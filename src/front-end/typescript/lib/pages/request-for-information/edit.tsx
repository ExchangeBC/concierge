import { makePageMetadata, makeStartLoading, makeStopLoading, UpdateState } from 'front-end/lib';
import { isUserType } from 'front-end/lib/access-control';
import router, { replaceState } from 'front-end/lib/app/router';
import { Route, SharedState } from 'front-end/lib/app/types';
import { ComponentView, Dispatch, emptyPageAlerts, emptyPageBreadcrumbs, GlobalComponentMsg, Immutable, immutable, mapComponentDispatch, PageComponent, PageInit, replaceRoute, Update, updateComponentChild } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import * as Attendees from 'front-end/lib/pages/request-for-information/components/attendees';
import * as RfiForm from 'front-end/lib/pages/request-for-information/components/form';
import { createAndShowPreview, makeRequestBody, publishedDateToString, updatedDateToString } from 'front-end/lib/pages/request-for-information/lib';
import StatusBadge from 'front-end/lib/pages/request-for-information/views/status-badge';
import { WarningId } from 'front-end/lib/pages/terms-and-conditions';
import FixedBar from 'front-end/lib/views/layout/fixed-bar';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import { default as React } from 'react';
import { Button, Col, Row } from 'reactstrap';
import { getString } from 'shared/lib';
import * as DdrResource from 'shared/lib/resources/discovery-day-response';
import * as RfiResource from 'shared/lib/resources/request-for-information';
import { ADT, UserType } from 'shared/lib/types';
import { allValid, getInvalidValue, valid, ValidOrInvalid } from 'shared/lib/validators';

const ERROR_MESSAGE = 'The Request for Information you are looking for is not available.';

export interface RouteParams {
  rfiId: string;
  activeTab?: RfiForm.TabId;
}

export type InnerMsg
  = ADT<'rfiForm', RfiForm.Msg>
  | ADT<'preview'>
  | ADT<'startEditing'>
  | ADT<'cancelEditing'>
  | ADT<'hideChangeTabConfirmationPrompt'>
  | ADT<'hideCancelConfirmationPrompt'>
  | ADT<'hidePublishConfirmationPrompt'>
  | ADT<'hideCancelEventConfirmationPrompt'>
  | ADT<'publish'>
  | ADT<'cancelEvent'>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

export interface ValidState {
  rfi: RfiResource.PublicRfi;
  rfiForm: Immutable<RfiForm.State>;
};

export interface State {
  previewLoading: number;
  publishLoading: number;
  cancelEventLoading: number;
  hasTriedPublishing: boolean;
  promptChangeTabConfirmation?: RfiForm.Msg;
  promptCancelConfirmation: boolean;
  promptPublishConfirmation: boolean;
  promptCancelEventConfirmation: boolean;
  valid?: ValidState;
};

async function resetRfiForm(existingRfi: RfiResource.PublicRfi, activeTab?: RfiForm.TabId): Promise<Immutable<RfiForm.State>> {
  return immutable(await RfiForm.init({
    formType: 'edit',
    existingRfi,
    activeTab
  }));
}

const initState: State = {
  previewLoading: 0,
  publishLoading: 0,
  cancelEventLoading: 0,
  promptChangeTabConfirmation: undefined,
  promptCancelConfirmation: false,
  promptPublishConfirmation: false,
  promptCancelEventConfirmation: false,
  hasTriedPublishing: false
};

const init: PageInit<RouteParams, SharedState, State, Msg> = isUserType({

  userTypes: [UserType.ProgramStaff],

  async success({ routeParams, dispatch, shared }) {
    const { rfiId, activeTab } = routeParams;
    const result = await api.readOneRfi(rfiId);
    switch (result.tag) {
      case 'valid':
        if (shared.sessionUser.type === UserType.ProgramStaff && !(await api.hasUserAcceptedTerms(shared.sessionUser.id))) {
          dispatch(replaceRoute({
            tag: 'termsAndConditions' as const,
            value: {
              warningId: WarningId.EditRfi,
              redirectOnAccept: router.routeToUrl({
                tag: 'requestForInformationEdit',
                value: routeParams
              }),
              redirectOnSkip: router.routeToUrl({
                tag: 'requestForInformationList',
                value: null
              })
            }
          }));
          return initState;
        } else {
          return {
            ...initState,
            valid: {
              rfi: result.value,
              rfiForm: await resetRfiForm(result.value, activeTab)
            }
          };
        }
      case 'invalid':
        return initState;
    }
  },

  async fail({ routeParams, dispatch, shared }) {
    if (!shared.session || !shared.session.user) {
      dispatch(replaceRoute({
        tag: 'signIn' as 'signIn',
        value: {
          redirectOnSuccess: router.routeToUrl({
            tag: 'requestForInformationEdit',
            value: routeParams
          })
        }
      }));
    } else {
      dispatch(replaceRoute({
        tag: 'requestForInformationView',
        value: routeParams
      }));
    }
    return initState;
  }

});

const startPreviewLoading: UpdateState<State> = makeStartLoading('previewLoading');
const stopPreviewLoading: UpdateState<State>  = makeStopLoading('previewLoading');
const startPublishLoading: UpdateState<State> = makeStartLoading('publishLoading');
const stopPublishLoading: UpdateState<State>  = makeStopLoading('publishLoading');
const startCancelEventLoading: UpdateState<State> = makeStartLoading('cancelEventLoading');
const stopCancelEventLoading: UpdateState<State>  = makeStopLoading('cancelEventLoading');

function getExistingDiscoveryDay(state: State): RfiResource.PublicDiscoveryDay | undefined {
  return state.valid && state.valid.rfi.latestVersion.discoveryDay;
}

function setIsEditing(state: Immutable<State>, value: boolean): Immutable<State> {
  if (!state.valid) { return state; }
  return state
    .setIn(['valid', 'rfiForm', 'details', 'isEditing'], false)
    .setIn(['valid', 'rfiForm', 'discoveryDay', 'isEditing'], false)
    .setIn(['valid', 'rfiForm', state.valid.rfiForm.activeTab, 'isEditing'], true);
}

function getIsEditing(state: Immutable<State>): boolean {
  if (!state.valid) { return false; }
  return state.getIn(['valid', 'rfiForm', 'details', 'isEditing']) || state.getIn(['valid', 'rfiForm', 'discoveryDay', 'isEditing']);
}

async function updateRfi(state: Immutable<State>, requestBody: ValidOrInvalid<RfiResource.CreateRequestBody, RfiResource.CreateValidationErrors>): Promise<Immutable<State>> {
  const valid = state.valid;
  if (!valid) { return state };
  const fail = (state: Immutable<State>, errors: RfiResource.UpdateValidationErrors) => {
    state = setIsEditing(state, false);
    return state.setIn(['valid', 'rfiForm'], RfiForm.setErrors(valid.rfiForm, errors));
  };
  switch (requestBody.tag) {
    case 'valid':
      // Update discovery day attendees before updating the RFI.
      // Update the RFI afterwards so we can update state with the
      // "freshest" version of the RFI that is returned from the
      // "update" API request..
      const attendeesState = valid.rfiForm.discoveryDay.attendees;
      if (valid.rfiForm.activeTab === 'discoveryDay' && attendeesState) {
        const ddrUpdates = RfiForm.getDdrUpdates(valid.rfiForm);
        const ddrResults: Array<ValidOrInvalid<unknown, DdrResource.CreateValidationErrors>> = [];
        for await (const ddrUpdate of ddrUpdates) {
          switch (ddrUpdate.tag) {
            case 'update':
              ddrResults.push(await api.updateDdr(ddrUpdate.value.vendorId, valid.rfi._id, ddrUpdate.value.attendees));
              break;
            case 'delete':
              // We don't populate delete errors to the user via the UI (no design).
              await api.deleteDdr(ddrUpdate.value.vendorId, valid.rfi._id);
              break;
          }
        }
        if (!allValid(ddrResults)) {
          return state.setIn(['valid', 'rfiForm', 'discoveryDay', 'attendees'], Attendees.setErrors(attendeesState, ddrResults.map(r => getInvalidValue(r, { attendees: [] }).attendees || [])));
        }
      }
      const result = await api.updateRfi(valid.rfi._id, requestBody.value);
      switch (result.tag) {
        case 'valid':
          state = state
            .setIn(['valid', 'rfi'], result.value)
            .setIn(['valid', 'rfiForm'], await resetRfiForm(result.value, valid.rfiForm.activeTab));
          break;
        case 'invalid':
          state = fail(state, result.value);
          if (window.scrollTo) { window.scrollTo(0, 0); }
          break;
      }
      break;
    case 'invalid':
      state = fail(state, requestBody.value);
      break;
  }
  return state;
}

const update: Update<State, Msg> = ({ state, msg }) => {
  const validState = state.valid;
  if (!validState) { return [state]; }
  switch (msg.tag) {
    case 'rfiForm':
      const rfiFormChildMsg = msg.value;
      let shouldResetRfiForm = false;
      if (rfiFormChildMsg.tag === 'setActiveTab' && rfiFormChildMsg.value !== validState.rfiForm.activeTab) {
        if (getIsEditing(state)) {
          if (!state.promptChangeTabConfirmation) {
            return [state.set('promptChangeTabConfirmation', rfiFormChildMsg)];
          } else {
            state = setIsEditing(state, false)
              .set('promptChangeTabConfirmation', undefined);
            shouldResetRfiForm = true;
          }
        }
        // Update the query string with the active tab.
        replaceState({
          tag: 'requestForInformationEdit',
          value: {
            rfiId: validState.rfi._id,
            activeTab: rfiFormChildMsg.value
          }
        });
      }
      state = updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'rfiForm', value }),
        childStatePath: ['valid', 'rfiForm'],
        childUpdate: RfiForm.update,
        childMsg: msg.value
      })[0];
      return [
        state,
        async state => {
          if (state.valid && shouldResetRfiForm) {
            state = state.setIn(['valid', 'rfiForm'], await resetRfiForm(state.valid.rfi, state.valid.rfiForm.activeTab));
          }
          return state;
        }
      ];
    case 'startEditing':
      return [setIsEditing(state, true)];
    case 'cancelEditing':
      state = state.set('hasTriedPublishing', false);
      if (!state.promptCancelConfirmation) {
        return [state.set('promptCancelConfirmation', true)];
      } else {
        state = state.set('promptCancelConfirmation', false);
      }
      return [
        setIsEditing(state, false),
        async (state) => {
          if (!state.valid) { return state; }
          return state.setIn(['valid', 'rfiForm'], await resetRfiForm(state.valid.rfi, state.valid.rfiForm.activeTab));
        }
      ];
    case 'preview':
      state = state.set('hasTriedPublishing', true);
      return createAndShowPreview({
        state,
        startLoading: startPreviewLoading,
        stopLoading: stopPreviewLoading,
        getRfiForm(state) {
          return validState.rfiForm;
        },
        setRfiForm(state, rfiForm) {
          return state.setIn(['valid', 'rfiForm'], rfiForm);
        }
      });
    case 'hideChangeTabConfirmationPrompt':
      return [state.set('promptChangeTabConfirmation', undefined)];
    case 'hideCancelConfirmationPrompt':
      return [state.set('promptCancelConfirmation', false)];
    case 'hidePublishConfirmationPrompt':
      return [state.set('promptPublishConfirmation', false)];
    case 'hideCancelEventConfirmationPrompt':
      return [state.set('promptCancelEventConfirmation', false)];
    case 'publish':
      state = state.set('hasTriedPublishing', true);
      if (!state.promptPublishConfirmation) {
        return [state.set('promptPublishConfirmation', true)];
      } else {
        state = state.set('promptPublishConfirmation', false);
      }
      return [
        startPublishLoading(state),
        async (state, dispatch) => {
          state = stopPublishLoading(state);
          if (!state.valid) { return state; }
          return await updateRfi(state, await makeRequestBody(state.valid.rfiForm));
        }
      ];
    case 'cancelEvent':
      state = state.set('hasTriedPublishing', false);
      if (!state.promptCancelEventConfirmation) {
        return [state.set('promptCancelEventConfirmation', true)];
      } else {
        state = state.set('promptCancelEventConfirmation', false);
      }
      return [
        startCancelEventLoading(state),
        async (state, dispatch) => {
          state = stopCancelEventLoading(state);
          if (!state.valid) { return state; }
          let requestBody = await makeRequestBody(state.valid.rfiForm);
          if (requestBody.tag === 'valid') {
            requestBody = valid({
              ...requestBody.value,
              discoveryDay: undefined
            });
          }
          return await updateRfi(state, requestBody);
        }
      ];
    default:
      return [state];
  }
};

const viewBottomBar: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (!state.valid) { return null; }
  const publish = () => dispatch({ tag: 'publish', value: undefined });
  const preview = () => dispatch({ tag: 'preview', value: undefined });
  const startEditing = () => dispatch({ tag: 'startEditing', value: undefined });
  const cancelEditing = () => dispatch({ tag: 'cancelEditing', value: undefined });
  const cancelEvent = () => dispatch({ tag: 'cancelEvent', value: undefined });
  const viewRoute: Route = { tag: 'requestForInformationView', value: { rfiId: getString(state.valid, ['rfi', '_id']) }};
  const isEditing = getIsEditing(state);
  const isPreviewLoading = state.previewLoading > 0;
  const isPublishLoading = state.publishLoading > 0;
  const isCancelEventLoading = state.cancelEventLoading > 0;
  const isLoading = isPreviewLoading || isPublishLoading || isCancelEventLoading;
  const isDisabled = isLoading || !RfiForm.isValid(state.valid.rfiForm);
  const isDetailsTab = state.valid.rfiForm.activeTab === 'details';
  const isDiscoveryDayTab = state.valid.rfiForm.activeTab === 'discoveryDay';
  const isResponsesTab = state.valid.rfiForm.activeTab === 'responses';
  const hasExistingDiscoveryDay = !!getExistingDiscoveryDay(state);
  if (isDetailsTab && isEditing) {
    return (
      <FixedBar>
        <LoadingButton color='primary' onClick={publish} loading={isPublishLoading} disabled={isDisabled} className='text-nowrap'>
          Publish Changes
        </LoadingButton>
        <LoadingButton color='info' onClick={preview} loading={isPreviewLoading} disabled={isDisabled} className='mx-3 text-nowrap'>
          Preview Changes
        </LoadingButton>
        <Link onClick={cancelEditing} color='secondary' disabled={isLoading}>Cancel</Link>
      </FixedBar>
    );
  } else if (isDetailsTab && !isEditing) {
    return (
      <FixedBar>
        <Button color='primary' onClick={startEditing} disabled={isLoading} className='text-nowrap'>
          Edit Details
        </Button>
        <Link route={viewRoute} button color='info' disabled={isLoading} className='ml-3 ml-md-0 mr-md-3 text-nowrap' newTab>View RFI</Link>
      </FixedBar>
    );
  } else if (isDiscoveryDayTab && isEditing) {
    if (hasExistingDiscoveryDay) {
      return (
        <FixedBar>
          <LoadingButton color='primary' onClick={publish} loading={isPublishLoading} disabled={isDisabled} className='text-nowrap'>
            Publish Changes
          </LoadingButton>
          <LoadingButton color='info' onClick={preview} loading={isPreviewLoading} disabled={isDisabled} className='mx-3 text-nowrap'>
            Preview Changes
          </LoadingButton>
          <Link onClick={cancelEditing} color='secondary' disabled={isLoading}>Cancel</Link>
        </FixedBar>
      );
    } else {
      return (
        <FixedBar>
          <LoadingButton color='primary' onClick={publish} loading={isPublishLoading} disabled={isDisabled} className='text-nowrap'>
            Publish Discovery Day Session
          </LoadingButton>
          <LoadingButton color='info' onClick={preview} loading={isPreviewLoading} disabled={isDisabled} className='mx-3 text-nowrap'>
            Preview RFI
          </LoadingButton>
          <Link onClick={cancelEditing} color='secondary' disabled={isLoading}>Cancel</Link>
        </FixedBar>
      );
    }
  } else if (isDiscoveryDayTab && !isEditing) {
    if (hasExistingDiscoveryDay) {
      return (
        <FixedBar>
          <Button color='primary' onClick={startEditing} disabled={isLoading} className='text-nowrap'>
            Edit Discovery Day Session
          </Button>
          <LoadingButton color='danger' onClick={cancelEvent} loading={isCancelEventLoading} disabled={isDisabled} className='mx-3 text-nowrap'>
            Cancel Discovery Day Session
          </LoadingButton>
          <Link route={viewRoute} button color='info' disabled={isLoading} className='text-nowrap' newTab>View RFI</Link>
        </FixedBar>
      );
    } else {
      return (
        <FixedBar>
          <Link route={viewRoute} button color='info' disabled={isLoading} className='text-nowrap' newTab>View RFI</Link>
        </FixedBar>
      );
    }
  } else if (isResponsesTab) {
    return (
      <FixedBar>
        <Link route={viewRoute} button color='info' disabled={isLoading} className='text-nowrap' newTab>View RFI</Link>
      </FixedBar>
    );
  } else {
    // This branch should never be evaluated.
    return null;
  }
};

const view: ComponentView<State, Msg> = props => {
  const { state, dispatch } = props;
  if (!state.valid) { return null; }
  const dispatchRfiForm: Dispatch<RfiForm.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'rfiForm' as 'rfiForm', value }));
  const rfi = state.valid.rfi;
  const version = state.valid.rfi.latestVersion;
  return (
    <div>
      <Row>
        <Col xs='12' md='10'>
          <h3 className='d-flex flex-column-reverse flex-md-row align-items-start align-items-md-center flex-wrap'>
            RFI Number: {version.rfiNumber}
            <StatusBadge
              rfi={rfi}
              className='d-block d-md-inline mb-2 mb-md-0 ml-md-3 font-size-base' />
          </h3>
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='10'>
          <h1>{version.title}</h1>
        </Col>
      </Row>
      <Row className='mb-4'>
        <Col xs='12'>
          <p className='text-secondary small'>
            <span className='d-block d-md-inline'>
              {publishedDateToString(rfi.createdAt)}
            </span>
            <span className='px-3 d-none d-md-inline'>|</span>
            <span className='d-block d-md-inline'>
              {updatedDateToString(version.createdAt)}
            </span>
          </p>
        </Col>
      </Row>
      <RfiForm.view state={state.valid.rfiForm} dispatch={dispatchRfiForm} />
    </div>
  );
};

export const component: PageComponent<RouteParams, SharedState, State, Msg> = {
  init,
  update,
  view,
  viewBottomBar,
  getAlerts(state) {
    const initializationErrors = !state.valid ? [ERROR_MESSAGE] : [];
    const validationErrors = state.valid && state.hasTriedPublishing && !RfiForm.isValid(state.valid.rfiForm)
      ? [RfiForm.ERROR_MESSAGE]
      : [];
    return {
      ...emptyPageAlerts(),
      errors: initializationErrors.concat(validationErrors)
    };
  },
  getMetadata(state) {
    if (state.valid) {
      return makePageMetadata(`${RfiForm.tabIdToName(state.valid.rfiForm.activeTab)} — ${state.valid.rfi.latestVersion.rfiNumber}`);
    } else {
      return makePageMetadata('Edit a Request for Information');
    }
  },
  getBreadcrumbs: emptyPageBreadcrumbs,
  getModal(state) {
    if (!state.valid) { return null; }
    const isDiscoveryDayTab = state.valid.rfiForm.activeTab === 'discoveryDay';
    const hasExistingDiscoveryDay = !!getExistingDiscoveryDay(state);
    const changes = isDiscoveryDayTab && !hasExistingDiscoveryDay ? 'Discovery Day session' : 'changes';
    const publishBody = `
      ${isDiscoveryDayTab && !hasExistingDiscoveryDay ? 'This Discovery Day session will be visible to the public once it has been published.' : 'Any changes that you have made will be visible to the public once they have been published.'}
      ${isDiscoveryDayTab && hasExistingDiscoveryDay ? ' Attendees will be notified via email of any changes to their attendance.' : ''}
    `.replace('\n', ' ').trim();
    if (state.promptPublishConfirmation) {
      return {
        title: `Publish ${changes}?`,
        body: publishBody,
        onCloseMsg: { tag: 'hidePublishConfirmationPrompt', value: undefined },
        actions: [
          {
            text: `Yes, publish ${changes}`,
            color: 'primary',
            button: true,
            msg: { tag: 'publish', value: undefined }
          },
          {
            text: 'Cancel',
            color: 'secondary',
            msg: { tag: 'hidePublishConfirmationPrompt', value: undefined }
          }
        ]
      };
    } else if (state.promptCancelConfirmation) {
      return {
        title: 'Cancel editing?',
        body: 'Any changes that you have made will be lost if you choose to cancel.',
        onCloseMsg: { tag: 'hideCancelConfirmationPrompt', value: undefined },
        actions: [
          {
            text: 'Yes, I want to cancel',
            color: 'primary',
            button: true,
            msg: { tag: 'cancelEditing', value: undefined }
          },
          {
            text: 'Go Back',
            color: 'secondary',
            msg: { tag: 'hideCancelConfirmationPrompt', value: undefined }
          }
        ]
      };
    } else if (state.promptChangeTabConfirmation) {
      return {
        title: 'Leave this tab?',
        body: 'Any changes that you have made will be lost if you choose to leave this tab.',
        onCloseMsg: { tag: 'hideChangeTabConfirmationPrompt', value: undefined },
        actions: [
          {
            text: 'Yes, I want to leave this tab',
            color: 'primary',
            button: true,
            msg: { tag: 'rfiForm', value: state.promptChangeTabConfirmation }
          },
          {
            text: 'Go Back',
            color: 'secondary',
            msg: { tag: 'hideChangeTabConfirmationPrompt', value: undefined }
          }
        ]
      };
    } else if (state.promptCancelEventConfirmation) {
      return {
        title: 'Cancel Discovery Day session?',
        body: 'All registered attendees will be notified that the session has been cancelled.',
        onCloseMsg: { tag: 'hideCancelEventConfirmationPrompt', value: undefined },
        actions: [
          {
            text: 'Yes, I want to cancel',
            color: 'danger',
            button: true,
            msg: { tag: 'cancelEvent', value: undefined }
          },
          {
            text: 'Go Back',
            color: 'secondary',
            msg: { tag: 'hideCancelEventConfirmationPrompt', value: undefined }
          }
        ]
      };
    } else {
      return null;
    }
  }
};
