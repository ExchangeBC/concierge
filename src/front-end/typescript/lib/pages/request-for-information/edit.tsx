import { makePageMetadata, makeStartLoading, makeStopLoading, UpdateState } from 'front-end/lib';
import { isUserType } from 'front-end/lib/access-control';
import router from 'front-end/lib/app/router';
import { Route, SharedState } from 'front-end/lib/app/types';
import { ComponentView, Dispatch, emptyPageAlerts, GlobalComponentMsg, immutable, Immutable, mapComponentDispatch, PageComponent, PageInit, replaceRoute, Update, updateComponentChild } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import * as RfiForm from 'front-end/lib/pages/request-for-information/components/form';
import { createAndShowPreview, makeRequestBody, publishedDateToString, updatedDateToString } from 'front-end/lib/pages/request-for-information/lib';
import StatusBadge from 'front-end/lib/pages/request-for-information/views/status-badge';
import FixedBar from 'front-end/lib/views/layout/fixed-bar';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import { default as React } from 'react';
import { Button, Col, Row } from 'reactstrap';
import { getString } from 'shared/lib';
import * as RfiResource from 'shared/lib/resources/request-for-information';
import { ADT, UserType } from 'shared/lib/types';

const ERROR_MESSAGE = 'The Request for Information you are looking for is not available.';

export interface RouteParams {
  rfiId: string;
}

export type InnerMsg
  = ADT<'rfiForm', RfiForm.Msg>
  | ADT<'startEditing'>
  | ADT<'cancelEditing'>
  | ADT<'preview'>
  | ADT<'publish'>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

export interface ValidState {
  rfi: RfiResource.PublicRfi;
  rfiForm: Immutable<RfiForm.State>;
};

export interface State {
  previewLoading: number;
  publishLoading: number;
  hasTriedPublishing: boolean;
  valid?: ValidState;
};

async function resetRfiForm(existingRfi: RfiResource.PublicRfi): Promise<Immutable<RfiForm.State>> {
  return immutable(await RfiForm.init({
    isEditing: false,
    existingRfi
  }));
}

const initState: State = {
  previewLoading: 0,
  publishLoading: 0,
  hasTriedPublishing: false
};

const init: PageInit<RouteParams, SharedState, State, Msg> = isUserType({

  userTypes: [UserType.ProgramStaff],

  async success({ routeParams }) {
    const { rfiId } = routeParams;
    const result = await api.readOneRfi(rfiId);
    switch (result.tag) {
      case 'valid':
        return {
          ...initState,
          valid: {
            rfi: result.value,
            rfiForm: await resetRfiForm(result.value)
          }
        };
      case 'invalid':
        return initState;
    }
  },

  async fail({ routeParams, dispatch }) {
    dispatch(replaceRoute({
      tag: 'signIn' as 'signIn',
      value: {
        redirectOnSuccess: router.routeToUrl({
          tag: 'requestForInformationEdit',
          value: routeParams
        })
      }
    }));
    return initState;
  }

});

const startPreviewLoading: UpdateState<State> = makeStartLoading('previewLoading');
const stopPreviewLoading: UpdateState<State>  = makeStopLoading('previewLoading');
const startPublishLoading: UpdateState<State> = makeStartLoading('publishLoading');
const stopPublishLoading: UpdateState<State>  = makeStopLoading('publishLoading');

function setIsEditing(state: Immutable<State>, value: boolean): Immutable<State> {
  if (!state.valid) { return state; }
  return state.setIn(['valid', 'rfiForm', 'isEditing'], value);
}

function getIsEditing(state: Immutable<State>): boolean {
  if (!state.valid) { return false; }
  return state.getIn(['valid', 'rfiForm', 'isEditing']);
}

const update: Update<State, Msg> = ({ state, msg }) => {
  if (!state.valid) { return [state]; }
  const valid = state.valid;
  switch (msg.tag) {
    case 'rfiForm':
      state = updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'rfiForm', value }),
        childStatePath: ['valid', 'rfiForm'],
        childUpdate: RfiForm.update,
        childMsg: msg.value
      })[0];
      return [state];
    case 'startEditing':
      return [setIsEditing(state, true)];
    case 'cancelEditing':
      state = state.set('hasTriedPublishing', false);
      return [
        setIsEditing(state, false),
        async () => {
          if (!state.valid) { return state; }
          return state.setIn(['valid', 'rfiForm'], await resetRfiForm(state.valid.rfi));
        }
      ];
    case 'preview':
      return createAndShowPreview({
        state,
        startLoading: startPreviewLoading,
        stopLoading: stopPreviewLoading,
        getRfiForm(state) {
          return state.valid && state.valid.rfiForm;
        },
        setRfiForm(state, rfiForm) {
          return state.setIn(['valid', 'rfiForm'], rfiForm);
        }
      });
    case 'publish':
      state = state.set('hasTriedPublishing', true);
      return [
        startPublishLoading(state),
        async (state, dispatch) => {
          const fail = (state: Immutable<State>, errors: RfiResource.UpdateValidationErrors) => {
            state = stopPublishLoading(state);
            state = setIsEditing(state, false);
            return state.setIn(['valid', 'rfiForm'], RfiForm.setErrors(valid.rfiForm, errors));
          };
          const requestBody = await makeRequestBody(valid.rfiForm);
          switch (requestBody.tag) {
            case 'valid':
              const result = await api.updateRfi(valid.rfi._id, requestBody.value);
              switch (result.tag) {
                case 'valid':
                  state = stopPublishLoading(state)
                    .setIn(['valid', 'rfi'], result.value)
                    .setIn(['valid', 'rfiForm'], await resetRfiForm(result.value));
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

const viewBottomBar: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (!state.valid) { return null; }
  const publish = () => dispatch({ tag: 'publish', value: undefined });
  const preview = () => dispatch({ tag: 'preview', value: undefined });
  const startEditing = () => dispatch({ tag: 'startEditing', value: undefined });
  const cancelEditing = () => dispatch({ tag: 'cancelEditing', value: undefined });
  const viewRoute: Route = { tag: 'requestForInformationView', value: { rfiId: getString(state.valid, ['rfi', '_id']) }};
  const isEditing = getIsEditing(state);
  const isPreviewLoading = state.previewLoading > 0;
  const isPublishLoading = state.publishLoading > 0;
  const isLoading = isPreviewLoading || isPublishLoading;
  const isDisabled = isLoading || !RfiForm.isValid(state.valid.rfiForm);
  if (isEditing) {
    return (
      <FixedBar>
        <LoadingButton color='primary' onClick={publish} loading={isPublishLoading} disabled={isDisabled} className='text-nowrap'>
          Publish Changes
        </LoadingButton>
        <LoadingButton color='info' onClick={preview} loading={isPreviewLoading} disabled={isDisabled} className='mx-3 text-nowrap'>
          Preview Changes
        </LoadingButton>
        <Link onClick={cancelEditing} color='secondary' disabled={isLoading} className='mx-3'>Cancel</Link>
      </FixedBar>
    );
  } else {
    return (
      <FixedBar>
        <Button color='primary' onClick={startEditing} disabled={isLoading} className='text-nowrap'>
          Edit RFI
        </Button>
        <Link route={viewRoute} button color='info' disabled={isLoading} className='ml-3 ml-md-0 mr-md-3 text-nowrap'>View RFI</Link>
      </FixedBar>
    );
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
          <h1 className='d-flex flex-column-reverse flex-md-row align-items-start align-items-md-center flex-wrap'>
            RFI Number: {version.rfiNumber}
            <StatusBadge
              rfi={rfi}
              className='d-block d-md-inline mb-2 mb-md-0 ml-md-3'
              style={{ fontSize: '1.4rem' }} />
          </h1>
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='10'>
          <h2>{version.title}</h2>
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
      ? [RfiForm.GLOBAL_ERROR_MESSAGE]
      : [];
    return {
      ...emptyPageAlerts(),
      errors: initializationErrors.concat(validationErrors)
    };
  },
  getMetadata() {
    return makePageMetadata('Edit a Request for Information');
  }
};
