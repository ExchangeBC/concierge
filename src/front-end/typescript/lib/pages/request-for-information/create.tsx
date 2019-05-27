import { makePageMetadata, makeStartLoading, makeStopLoading, UpdateState } from 'front-end/lib';
import { isUserType } from 'front-end/lib/access-control';
import router from 'front-end/lib/app/router';
import { Route, SharedState } from 'front-end/lib/app/types';
import { ComponentView, Dispatch, emptyPageAlerts, GlobalComponentMsg, Immutable, immutable, mapComponentDispatch, newRoute, PageComponent, PageInit, replaceRoute, Update, updateComponentChild } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import * as RfiForm from 'front-end/lib/pages/request-for-information/components/form';
import { createAndShowPreview, makeRequestBody } from 'front-end/lib/pages/request-for-information/lib';
import FixedBar from 'front-end/lib/views/layout/fixed-bar';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import { default as React } from 'react';
import { Col, Container, Row } from 'reactstrap';
import * as RfiResource from 'shared/lib/resources/request-for-information';
import { ADT, UserType } from 'shared/lib/types';

export type RouteParams = null;

export type InnerMsg
  = ADT<'rfiForm', RfiForm.Msg>
  | ADT<'preview'>
  | ADT<'publish'>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

export interface State {
  previewLoading: number;
  publishLoading: number;
  rfiForm: Immutable<RfiForm.State>
};

async function makeInitState(): Promise<State> {
  return {
    previewLoading: 0,
    publishLoading: 0,
    rfiForm: immutable(await RfiForm.init({
      isEditing: true
    }))
  };
}

const init: PageInit<RouteParams, SharedState, State, Msg> = isUserType({

  userTypes: [UserType.ProgramStaff],
  success: makeInitState,

  async fail({ routeParams, dispatch }) {
    dispatch(replaceRoute({
      tag: 'signIn' as 'signIn',
      value: {
        redirectOnSuccess: router.routeToUrl({
          tag: 'requestForInformationCreate',
          value: routeParams
        })
      }
    }));
    return await makeInitState();
  }

});

const startPreviewLoading: UpdateState<State> = makeStartLoading('previewLoading');
const stopPreviewLoading: UpdateState<State>  = makeStopLoading('previewLoading');
const startPublishLoading: UpdateState<State> = makeStartLoading('publishLoading');
const stopPublishLoading: UpdateState<State>  = makeStopLoading('publishLoading');

const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'rfiForm':
      state = updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'rfiForm', value }),
        childStatePath: ['rfiForm'],
        childUpdate: RfiForm.update,
        childMsg: msg.value
      })[0];
      return [state];
    case 'preview':
      return createAndShowPreview({
        state,
        startLoading: startPreviewLoading,
        stopLoading: stopPreviewLoading,
        getRfiForm(state) {
          return state.rfiForm;
        },
        setRfiForm(state, rfiForm) {
          return state.set('rfiForm', rfiForm);
        }
      });
    case 'publish':
      return [
        startPublishLoading(state),
        async (state, dispatch) => {
          const fail = (state: Immutable<State>, errors: RfiResource.CreateValidationErrors) => {
            state = stopPublishLoading(state);
            return state.set('rfiForm', RfiForm.setErrors(state.rfiForm, errors));
          };
          const requestBody = await makeRequestBody(state.rfiForm);
          switch (requestBody.tag) {
            case 'valid':
              const result = await api.createRfi(requestBody.value);
              switch (result.tag) {
                case 'valid':
                  dispatch(newRoute({
                    tag: 'requestForInformationEdit' as 'requestForInformationEdit',
                    value: {
                      rfiId: result.value._id
                    }
                  }));
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
  const cancelRoute: Route = { tag: 'requestForInformationList' as 'requestForInformationList', value: null };
  const preview = () => dispatch({ tag: 'preview', value: undefined });
  const publish = () => dispatch({ tag: 'publish', value: undefined });
  const isPreviewLoading = state.previewLoading > 0;
  const isPublishLoading = state.publishLoading > 0;
  const isLoading = isPreviewLoading || isPublishLoading;
  const isDisabled = isLoading || !RfiForm.isValid(state.rfiForm);
  return (
    <FixedBar>
      <LoadingButton color='primary' onClick={publish} loading={isPublishLoading} disabled={isDisabled} className='text-nowrap'>
        Publish RFI
      </LoadingButton>
      <LoadingButton color='info'  onClick={preview} loading={isPreviewLoading} disabled={isDisabled} className='mx-3 text-nowrap'>
        Preview RFI
      </LoadingButton>
      <Link route={cancelRoute} color='secondary' disabled={isLoading} className='mx-3'>Cancel</Link>
    </FixedBar>
  );
};

const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const dispatchRfiForm: Dispatch<RfiForm.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'rfiForm' as 'rfiForm', value }));
  return (
    <Container className='mb-5 flex-grow-1'>
      <Row>
        <Col xs='12' md='10'>
          <h1>Create a Request for Information (RFI)</h1>
        </Col>
      </Row>
      <Row className='mb-4'>
        <Col xs='12' md='10'>
          <p>Use this form to create a Request for Information (RFI) for a program or business area. Please ensure that all information is complete and accurate before publishing.</p>
        </Col>
      </Row>
      <RfiForm.view state={state.rfiForm} dispatch={dispatchRfiForm} />
    </Container>
  );
};

export const component: PageComponent<RouteParams, SharedState, State, Msg> = {
  init,
  update,
  view,
  viewBottomBar,
  getAlerts(state) {
    return {
      ...emptyPageAlerts(),
      errors: !RfiForm.isValid(state.rfiForm)
        ? [RfiForm.GLOBAL_ERROR_MESSAGE]
        : []
    };
  },
  getMetadata() {
    return makePageMetadata('Create a Request for Information');
  }
};
