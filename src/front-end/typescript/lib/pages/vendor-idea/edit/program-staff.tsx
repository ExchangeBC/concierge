import { makePageMetadata, makeStartLoadingIn, makeStopLoadingIn, UpdateState } from 'front-end/lib';
import router, { replaceState } from 'front-end/lib/app/router';
import { Route } from 'front-end/lib/app/types';
import { ComponentView, ComponentViewProps, Dispatch, GlobalComponentMsg, immutable, Immutable, Init, mapComponentDispatch, newRoute, PageGetBreadcrumbs, PageGetMetadata, PageGetModal, replaceRoute, Update, updateComponentChild, View } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import { WarningId } from 'front-end/lib/pages/terms-and-conditions';
import * as IntakeForm from 'front-end/lib/pages/vendor-idea/components/intake-form';
import * as Management from 'front-end/lib/pages/vendor-idea/components/management';
import { makeRequestBody } from 'front-end/lib/pages/vendor-idea/lib';
import { SubmittedDate, UpdatedDate } from 'front-end/lib/pages/vendor-idea/views/dates';
import { LogItemTypeBadge } from 'front-end/lib/pages/vendor-idea/views/log-item-type-badge';
import FixedBar from 'front-end/lib/views/layout/fixed-bar';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import React from 'react';
import { Col, Nav, NavItem, NavLink, Row, TabContent, TabPane } from 'reactstrap';
import { PublicSessionUser } from 'shared/lib/resources/session';
import { PublicVendorIdeaForProgramStaff, UpdateValidationErrors } from 'shared/lib/resources/vendor-idea';
import { PublicLogItem } from 'shared/lib/resources/vendor-idea/log-item';
import { ADT } from 'shared/lib/types';
import { invalid, valid } from 'shared/lib/validators';

export type TabId
  = 'management'
  | 'application';

export function tabIdToName(id: TabId): string {
  switch (id) {
    case 'management':
      return 'Management';
    case 'application':
      return 'Application';
  }
}

export interface Params {
  viId: string;
  activeTab?: TabId;
  dispatch: Dispatch<Msg>;
  sessionUser: PublicSessionUser;
};

type InnerMsg
  = ADT<'setActiveTab', TabId>
  | ADT<'intakeForm', IntakeForm.Msg>
  | ADT<'management', Management.Msg>
  | ADT<'startEditing'>
  | ADT<'cancelEditing'>
  | ADT<'hideCancelEditingConfirmationPrompt'>
  | ADT<'hideSubmitChangesConfirmationPrompt'>
  | ADT<'hideCancelEntryConfirmationPrompt'>
  | ADT<'hideSubmitEntryConfirmationPrompt'>
  | ADT<'submitChanges'>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

interface ValidState {
  activeTab: TabId;
  startEditingLoading: number;
  submitLoading: number;
  promptCancelEditingConfirmation: boolean;
  promptSubmitChangesConfirmation: boolean;
  promptCancelEntryConfirmation: boolean;
  promptSubmitEntryConfirmation: boolean;
  intakeForm: Immutable<IntakeForm.State>;
  management: Immutable<Management.State>;
  vi: PublicVendorIdeaForProgramStaff;
};

export type State
  = ADT<'valid', ValidState>
  | ADT<'invalid'>;

async function resetIntakeForm(existingVi: PublicVendorIdeaForProgramStaff): Promise<Immutable<IntakeForm.State>> {
  return immutable(await IntakeForm.init({
    isEditing: false,
    existingVi
  }));
}

async function resetManagement(viId: string, logItems: PublicLogItem[]): Promise<Immutable<Management.State>> {
  return immutable(await Management.init({ viId, logItems }));
}

export const init: Init<Params, State> = async ({ sessionUser, viId, dispatch, activeTab = 'management' }) => {
  if (!(await api.hasUserAcceptedTerms(sessionUser.id))) {
    dispatch(replaceRoute({
      tag: 'termsAndConditions',
      value: {
        warningId: WarningId.EditVi,
        redirectOnAccept: router.routeToUrl({
          tag: 'viEdit',
          value: {
            viId,
            activeTab
          }
        }),
        redirectOnSkip: router.routeToUrl({
          tag: 'viList',
          value: null
        })
      }
    }));
    return invalid(undefined);
  }
  const existingVi = await api.readOneViForProgramStaff(viId);
  if (existingVi.tag === 'invalid') {
    dispatch(replaceRoute({
      tag: 'notice',
      value: {
        noticeId: {
          tag: 'notFound',
          value: undefined
        }
      }
    }));
    return invalid(undefined);
  }
  return valid({
    activeTab,
    startEditingLoading: 0,
    submitLoading: 0,
    promptCancelEditingConfirmation: false,
    promptSubmitChangesConfirmation: false,
    promptCancelEntryConfirmation: false,
    promptSubmitEntryConfirmation: false,
    intakeForm: await resetIntakeForm(existingVi.value),
    management: await resetManagement(existingVi.value._id, existingVi.value.log),
    vi: existingVi.value
  });
};

const startStartEditingLoading: UpdateState<State> = makeStartLoadingIn(['value', 'startEditingLoading']);
const stopStartEditingLoading: UpdateState<State> = makeStopLoadingIn(['value', 'startEditingLoading']);
const startSubmitLoading: UpdateState<State> = makeStartLoadingIn(['value', 'submitLoading']);
const stopSubmitLoading: UpdateState<State> = makeStopLoadingIn(['value', 'submitLoading']);

function setIsEditing(state: Immutable<State>, value: boolean): Immutable<State> {
  return state.setIn(['value', 'intakeForm', 'isEditing'], value);
}

export const update: Update<State, Msg> = ({ state, msg }) => {
  if (state.tag === 'invalid') { return [state]; }
  switch (msg.tag) {
    case 'setActiveTab':
      // Update the query string with the active tab.
      replaceState({
        tag: 'viEdit',
        value: {
          viId: state.value.vi._id,
          activeTab: msg.value
        }
      });
      return [state.setIn(['value', 'activeTab'], msg.value)];
    case 'intakeForm':
      return updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'intakeForm', value }),
        childStatePath: ['value', 'intakeForm'],
        childUpdate: IntakeForm.update,
        childMsg: msg.value
      });
    case 'management':
      const managementMsg = msg.value;
      // Intercept management component's messages to show submit/cancel
      // prompts as required.
      if (managementMsg.tag === 'submit') {
        if (!state.value.promptSubmitEntryConfirmation) {
          return [state.setIn(['value', 'promptSubmitEntryConfirmation'], true)];
        } else {
          state = state.setIn(['value', 'promptSubmitEntryConfirmation'], false);
          const [newState, newAsyncState] = updateComponentChild({
            state,
            mapChildMsg: value => ({ tag: 'management' as const, value }),
            childStatePath: ['value', 'management'],
            childUpdate: Management.update,
            childMsg: msg.value
          });
          return [
            newState,
            async (state, dispatch) => {
              if (newAsyncState) {
                state = await newAsyncState(state, dispatch) || state;
              }
              if (state.tag === 'invalid') { return state; }
              const viResult = await api.readOneViForProgramStaff(state.value.vi._id);
              switch (viResult.tag) {
                case 'valid':
                  return state
                    .setIn(['value', 'management'], await resetManagement(state.value.vi._id, viResult.value.log))
                    .setIn(['value', 'vi'], viResult.value);
                case 'invalid':
                  return state;
              }
            }
          ];
        }
      } else if (managementMsg.tag === 'cancel') {
        if (!state.value.promptCancelEntryConfirmation) {
          return [state.setIn(['value', 'promptCancelEntryConfirmation'], true)];
        } else {
          state = state.setIn(['value', 'promptCancelEntryConfirmation'], false);
        }
      }
      return updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'management', value }),
        childStatePath: ['value', 'management'],
        childUpdate: Management.update,
        childMsg: msg.value
      });
    case 'startEditing':
      return [
        startStartEditingLoading(state),
        async state => {
          state = stopStartEditingLoading(state);
          if (state.tag === 'invalid') { return state; }
          // Reset the RFI form with fresh data before editing.
          const result = await api.readOneViForProgramStaff(state.value.vi._id);
          if (result.tag === 'invalid') { return state; }
          const existingManagement = state.value.management;
          state = state
            .setIn(['value', 'vi'], result.value)
            .setIn(['value', 'intakeForm'], await resetIntakeForm(result.value))
            // Reset the management tab to reflect an updated VI while retaining
            // the values in the "Create Entry" form.
            .setIn(['value', 'management'], await resetManagement(state.value.vi._id, result.value.log))
            .setIn(['value', 'newLogItemType'], existingManagement.newLogItemType)
            .setIn(['value', 'newLogItemNote'], existingManagement.newLogItemNote);
          return setIsEditing(state, true);
        }
      ];
    case 'cancelEditing':
      if (!state.value.promptCancelEditingConfirmation) {
        return [state.setIn(['value', 'promptCancelEditingConfirmation'], true)];
      } else {
        state = state.setIn(['value', 'promptCancelEditingConfirmation'], false);
      }
      return [
        setIsEditing(state, false),
        async (state) => {
          if (state.tag === 'invalid') { return state; }
          return state.setIn(['value', 'intakeForm'], await resetIntakeForm(state.value.vi));
        }
      ];
    case 'hideCancelEditingConfirmationPrompt':
      return [state.setIn(['value', 'promptCancelEditingConfirmation'], false)];
    case 'hideSubmitChangesConfirmationPrompt':
      return [state.setIn(['value', 'promptSubmitChangesConfirmation'], false)];
    case 'hideCancelEntryConfirmationPrompt':
      return [state.setIn(['value', 'promptCancelEntryConfirmation'], false)];
    case 'hideSubmitEntryConfirmationPrompt':
      return [state.setIn(['value', 'promptSubmitEntryConfirmation'], false)];
    case 'submitChanges':
      if (!state.value.promptSubmitChangesConfirmation) {
        return [state.setIn(['value', 'promptSubmitChangesConfirmation'], true)];
      } else {
        state = state.setIn(['value', 'promptSubmitChangesConfirmation'], false);
      }
      return [
        startSubmitLoading(state),
        async (state, dispatch) => {
          state = stopSubmitLoading(state);
          if (state.tag === 'invalid') { return state; }
          const fail = (state: Immutable<State>, errors: UpdateValidationErrors) => {
            if (state.tag === 'invalid') { return state; }
            return state.setIn(['value', 'intakeForm'], IntakeForm.setErrors(state.value.intakeForm, errors));
          };
          const requestBody = await makeRequestBody(state.value.intakeForm);
          switch (requestBody.tag) {
            case 'valid':
              const result = await api.updateViForProgramStaff(requestBody.value, state.value.vi._id);
              switch (result.tag) {
                case 'valid':
                  const existingManagement = state.value.management;
                  state = state
                    .setIn(['value', 'vi'], result.value)
                    .setIn(['value', 'intakeForm'], await resetIntakeForm(result.value))
                    // Reset the management tab to reflect an updated VI while retaining
                    // the values in the "Create Entry" form.
                    .setIn(['value', 'management'], await resetManagement(state.value.vi._id, result.value.log))
                    .setIn(['value', 'newLogItemType'], existingManagement.newLogItemType)
                    .setIn(['value', 'newLogItemNote'], existingManagement.newLogItemNote);
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
      ];
    default:
      return [state];
  }
};

export const viewBottomBar: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (state.tag === 'invalid') { return null; }
  const submit = () => dispatch({ tag: 'submitChanges', value: undefined });
  const startEditing = () => dispatch({ tag: 'startEditing', value: undefined });
  const cancelEditing = () => dispatch({ tag: 'cancelEditing', value: undefined });
  const isSubmitLoading = state.value.submitLoading > 0;
  const isStartEditingLoading = state.value.startEditingLoading > 0;
  const isLoading = isSubmitLoading || isStartEditingLoading;
  const isDisabled = isLoading || !IntakeForm.isValid(state.value.intakeForm);
  const isEditingApplication = state.value.intakeForm.isEditing;
  const isApplicationTab = state.value.activeTab === 'application';
  const ViewVendorProfile: View<{ className?: string }> = ({ className }) => (<Link button newTab route={{ tag: 'userView', value: { profileUserId: state.value.vi.createdBy._id }}} color='info' className={className}>View Vendor Profile</Link>);
  if (isApplicationTab) {
    return (
      <FixedBar>
        <LoadingButton color='primary' onClick={isEditingApplication ? submit : startEditing} loading={isEditingApplication ? isSubmitLoading : isStartEditingLoading} disabled={isDisabled} className='text-nowrap'>
          {isEditingApplication ? 'Submit Changes' : 'Edit Application'}
        </LoadingButton>
        <ViewVendorProfile className='mx-3' />
        {isEditingApplication
          ? (<Link onClick={cancelEditing} color='secondary' disabled={isLoading}>Cancel</Link>)
          : null}
      </FixedBar>
    );
  } else { // Management tab.
    return (
      <FixedBar>
        <ViewVendorProfile />
      </FixedBar>
    );
  }
};

interface TabLinkProps extends ComponentViewProps<State, Msg> {
  id: TabId;
}

const TabLink: View<TabLinkProps> = ({ id, state, dispatch }) => {
  if (state.tag === 'invalid') { return null; }
  const isActive = id === state.value.activeTab;
  let isValid = true;
  switch (id) {
    case 'management':
      isValid = !Management.hasProvidedRequiredFields(state.value.management) || Management.isValid(state.value.management);
    case 'application':
      isValid = !IntakeForm.hasProvidedRequiredFields(state.value.intakeForm) || IntakeForm.isValid(state.value.intakeForm);
  }
  return (
    <NavItem>
      <NavLink className={`${isActive ? 'active' : isValid ? 'text-primary' : ''} ${isValid ? '' : 'text-danger'} text-nowrap`} onClick={() => !isActive && dispatch({ tag: 'setActiveTab', value: id })}>
        {tabIdToName(id)}
      </NavLink>
    </NavItem>
  );
};

export const view: ComponentView<State, Msg> = props => {
  const { state, dispatch } = props;
  if (state.tag === 'invalid') { return null; }
  const { vi } = state.value;
  const dispatchIntakeForm: Dispatch<IntakeForm.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'intakeForm' as const, value }));
  const dispatchManagement: Dispatch<Management.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'management' as const, value }));
  return (
    <div>
      <Row>
        <Col xs='12' md='10'>
          <h3 className='d-flex flex-column-reverse flex-md-row align-items-start align-items-md-center flex-wrap'>
            Unsolicited Proposal
            <LogItemTypeBadge
              logItemType={vi.latestStatus}
              className='d-block d-md-inline mb-2 mb-md-0 ml-md-3 font-size-base' />
          </h3>
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='10'>
          <h1>{vi.latestVersion.description.title}</h1>
        </Col>
      </Row>
      <Row className='mb-5'>
        <Col xs='12'>
          <p className='text-secondary small'>
            <SubmittedDate date={vi.createdAt} vendor={vi.createdBy} className='d-block d-md-inline' />
            <span className='px-3 d-none d-md-inline'>|</span>
            <UpdatedDate date={vi.latestVersion.createdAt} className='d-block d-md-inline' />
          </p>
        </Col>
      </Row>
      <div className='d-flex mb-5' style={{ overflowX: 'auto' }}>
        <Nav className='flex-grow-1 flex-nowrap' tabs>
          <TabLink id='management' {...props} />
          <TabLink id='application' {...props} />
        </Nav>
      </div>
      <TabContent activeTab={state.value.activeTab}>
        <TabPane tabId='management'>
          <Management.view state={state.value.management} dispatch={dispatchManagement} />
        </TabPane>
        <TabPane tabId='application'>
          <IntakeForm.view state={state.value.intakeForm} dispatch={dispatchIntakeForm} />
        </TabPane>
      </TabContent>
    </div>
  );
};

export const getMetadata: PageGetMetadata<State> = state => {
  if (state.tag === 'valid') {
    return makePageMetadata(`${state.value.vi.latestVersion.description.title} — Unsolicited Proposal`);
  } else {
    return makePageMetadata('Edit an Unsolicited Proposal');
  }
};

export const getBreadcrumbs: PageGetBreadcrumbs<State, Msg> = state => {
  return [
    {
      text: 'Unsolicited Proposals',
      onClickMsg: newRoute({
        tag: 'viList',
        value: null
      })
    },
    {
      text: state.tag === 'valid' ? state.value.vi.latestVersion.description.title : 'Edit an Unsolicited Proposal'
    }
  ];
};

export const getModal: PageGetModal<State, Msg> = state => {
  if (state.tag === 'invalid') { return null; }
  if (state.value.promptSubmitChangesConfirmation) {
    return {
      title: 'Submit Changes to Application?',
      body: 'Please ensure all information provided is accurate.',
      onCloseMsg: { tag: 'hideSubmitChangesConfirmationPrompt', value: undefined },
      actions: [
        {
          text: 'Submit Changes',
          color: 'primary',
          button: true,
          msg: { tag: 'submitChanges', value: undefined }
        },
        {
          text: 'Cancel',
          color: 'secondary',
          msg: { tag: 'hideSubmitChangesConfirmationPrompt', value: undefined }
        }
      ]
    };
  } else if (state.value.promptCancelEditingConfirmation) {
    return {
      title: 'Cancel Changes to Application?',
      body: 'Any changes that you may have made will be lost if you choose to cancel.',
      onCloseMsg: { tag: 'hideCancelEditingConfirmationPrompt', value: undefined },
      actions: [
        {
          text: 'Yes, I want to cancel',
          color: 'primary',
          button: true,
          msg: {
            tag: 'cancelEditing',
            value: undefined
          }
        },
        {
          text: 'Go Back',
          color: 'secondary',
          msg: { tag: 'hideCancelEditingConfirmationPrompt', value: undefined }
        }
      ]
    };
  } else if (state.value.promptSubmitEntryConfirmation) {
    return {
      title: 'Submit Entry?',
      body: 'Please ensure all information provided is accurate. You will not be able to edit or delete this entry once it has been submitted.',
      onCloseMsg: { tag: 'hideSubmitEntryConfirmationPrompt', value: undefined },
      actions: [
        {
          text: 'Submit Entry',
          color: 'primary',
          button: true,
          msg: {
            tag: 'management',
            value: {
              tag: 'submit',
              value: undefined
            }
          }
        },
        {
          text: 'Go Back',
          color: 'secondary',
          msg: { tag: 'hideSubmitEntryConfirmationPrompt', value: undefined }
        }
      ]
    };
  } else if (state.value.promptCancelEntryConfirmation) {
    return {
      title: 'Cancel Entry?',
      body: 'Any information that you may have entered will be lost if you choose to cancel.',
      onCloseMsg: { tag: 'hideCancelEntryConfirmationPrompt', value: undefined },
      actions: [
        {
          text: 'Yes, I want to cancel',
          color: 'primary',
          button: true,
          msg: {
            tag: 'management',
            value: {
              tag: 'cancel',
              value: undefined
            }
          }
        },
        {
          text: 'Go Back',
          color: 'secondary',
          msg: { tag: 'hideCancelEntryConfirmationPrompt', value: undefined }
        }
      ]
    };
  } else {
    return null;
  }
};
