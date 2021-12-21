import { makePageMetadata, makeStartLoading, makeStopLoading, UpdateState } from 'front-end/lib';
import { isUserType } from 'front-end/lib/access-control';
import router from 'front-end/lib/app/router';
import { Route, SharedState } from 'front-end/lib/app/types';
import { ComponentView, Dispatch, emptyPageAlerts, emptyPageBreadcrumbs, GlobalComponentMsg, immutable, Immutable, mapComponentDispatch, newRoute, PageComponent, PageInit, replaceRoute, Update, updateComponentChild } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import * as RfiForm from 'front-end/lib/pages/request-for-information/components/form';
import { createAndShowPreview, makeRequestBody } from 'front-end/lib/pages/request-for-information/lib';
import { WarningId } from 'front-end/lib/pages/terms-and-conditions';
import FixedBar from 'front-end/lib/views/layout/fixed-bar';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import { default as React } from 'react';
import { Col, Row } from 'reactstrap';
import * as RfiResource from 'shared/lib/resources/request-for-information';
import { ADT, UserType } from 'shared/lib/types';

export type RouteParams = null;

export type InnerMsg = ADT<'rfiForm', RfiForm.Msg> | ADT<'preview'> | ADT<'hideCancelConfirmationPrompt'> | ADT<'showCancelConfirmationPrompt'> | ADT<'hidePublishConfirmationPrompt'> | ADT<'publish'> | ADT<'saveDraft'>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

export interface State {
  previewLoading: number;
  saveLoading: number;
  publishLoading: number;
  hasTriedPublishing: boolean;
  promptCancelConfirmation: boolean;
  promptPublishConfirmation: boolean;
  rfiForm: Immutable<RfiForm.State>;
}

async function makeInitState(): Promise<State> {
  return {
    previewLoading: 0,
    saveLoading: 0,
    publishLoading: 0,
    hasTriedPublishing: false,
    promptCancelConfirmation: false,
    promptPublishConfirmation: false,
    rfiForm: immutable(
      await RfiForm.init({
        formType: 'create'
      })
    )
  };
}

const init: PageInit<RouteParams, SharedState, State, Msg> = isUserType({
  userTypes: [UserType.ProgramStaff],
  async success({ shared, dispatch }) {
    const user = await api.readOneUser(shared.sessionUser.id);
    if (user.tag === 'valid' && !user.value.acceptedTermsAt) {
      dispatch(
        replaceRoute({
          tag: 'termsAndConditions' as const,
          value: {
            warningId: WarningId.CreateRfi,
            redirectOnAccept: router.routeToUrl({
              tag: 'requestForInformationCreate',
              value: null
            }),
            redirectOnSkip: router.routeToUrl({
              tag: 'requestForInformationList',
              value: null
            })
          }
        })
      );
    }
    return await makeInitState();
  },

  async fail({ routeParams, dispatch }) {
    dispatch(
      replaceRoute({
        tag: 'signIn' as const,
        value: {
          redirectOnSuccess: router.routeToUrl({
            tag: 'requestForInformationCreate',
            value: routeParams
          })
        }
      })
    );
    return await makeInitState();
  }
});

const startPreviewLoading: UpdateState<State> = makeStartLoading('previewLoading');
const stopPreviewLoading: UpdateState<State> = makeStopLoading('previewLoading');
const startSaveLoading: UpdateState<State> = makeStartLoading('saveLoading');
const stopSaveLoading: UpdateState<State> = makeStopLoading('saveLoading');

const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'rfiForm':
      return updateComponentChild({
        state,
        mapChildMsg: (value) => ({ tag: 'rfiForm', value }),
        childStatePath: ['rfiForm'],
        childUpdate: RfiForm.update,
        childMsg: msg.value
      });
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
    case 'saveDraft':
      return [
        startSaveLoading(state),
        async (state, dispatch) => {
          const fail = (state: Immutable<State>, errors: RfiResource.CreateValidationErrors) => {
            state = stopSaveLoading(state);
            return state.set('rfiForm', RfiForm.setErrors(state.rfiForm, errors));
          };
          const requestBody = await makeRequestBody(state.rfiForm);
          switch (requestBody.tag) {
            case 'valid':
              const result = await api.createRfi(requestBody.value);
              switch (result.tag) {
                case 'valid':
                  dispatch(
                    newRoute({
                      tag: 'requestForInformationEdit',
                      value: {
                        rfiId: result.value._id
                      }
                    })
                  );
                  return null;
                case 'invalid':
                  state = fail(state, result.value);
                  if (window.scrollTo) {
                    window.scrollTo(0, 0);
                  }
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
    case 'hideCancelConfirmationPrompt':
      return [state.set('promptCancelConfirmation', false)];
    case 'showCancelConfirmationPrompt':
      return [state.set('promptCancelConfirmation', true)];
    case 'hidePublishConfirmationPrompt':
      return [state.set('promptPublishConfirmation', false)];
    default:
      return [state];
  }
};

const viewBottomBar: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const showCancelConfirmationPrompt = () => dispatch({ tag: 'showCancelConfirmationPrompt', value: undefined });
  const preview = () => dispatch({ tag: 'preview', value: undefined });
  const saveDraft = () => dispatch({ tag: 'saveDraft', value: undefined });
  const isPreviewLoading = state.previewLoading > 0;
  const isPublishLoading = state.publishLoading > 0;
  const isSaveLoading = state.saveLoading > 0;
  const isLoading = isPreviewLoading || isPublishLoading;
  const isDisabled = isLoading || !RfiForm.isValid(state.rfiForm);
  return (
    <FixedBar>
      <LoadingButton color="primary" onClick={saveDraft} loading={isSaveLoading} disabled={isDisabled} className="ml-3 text-nowrap">
        Create
      </LoadingButton>
      <LoadingButton color="info" onClick={preview} loading={isPreviewLoading} disabled={isDisabled} className="ml-3 text-nowrap">
        Preview
      </LoadingButton>
      <Link onClick={showCancelConfirmationPrompt} color="secondary" className="ml-3" disabled={isLoading}>
        Cancel
      </Link>
    </FixedBar>
  );
};

const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const dispatchRfiForm: Dispatch<RfiForm.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, (value) => ({ tag: 'rfiForm' as const, value }));
  return (
    <div className="mb-5 flex-grow-1">
      <Row>
        <Col xs="12" md="10">
          <h1>Create a Request for Information (RFI)</h1>
        </Col>
      </Row>
      <Row className="mb-4">
        <Col xs="12" md="10">
          <p>Use this form to create a Request for Information (RFI) for a program or business area. Please ensure that all information is complete and accurate before publishing.</p>
        </Col>
      </Row>
      <RfiForm.view state={state.rfiForm} dispatch={dispatchRfiForm} />
    </div>
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
      errors: state.hasTriedPublishing && !RfiForm.isValid(state.rfiForm) ? [RfiForm.ERROR_MESSAGE] : []
    };
  },
  getMetadata() {
    return makePageMetadata('Create a Request for Information');
  },
  getBreadcrumbs: emptyPageBreadcrumbs,
  getModal(state) {
    if (state.promptPublishConfirmation) {
      return {
        title: 'Publish this RFI?',
        body: 'This RFI will be visible to the public once it has been published.',
        onCloseMsg: { tag: 'hidePublishConfirmationPrompt', value: undefined },
        actions: [
          {
            text: 'Yes, publish RFI',
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
        title: 'Cancel creating an RFI?',
        body: 'Any information that you may have entered will be lost if you choose to cancel.',
        onCloseMsg: { tag: 'hideCancelConfirmationPrompt', value: undefined },
        actions: [
          {
            text: 'Yes, I want to cancel',
            color: 'primary',
            button: true,
            msg: newRoute({
              tag: 'requestForInformationList',
              value: null
            })
          },
          {
            text: 'Go Back',
            color: 'secondary',
            msg: { tag: 'hideCancelConfirmationPrompt', value: undefined }
          }
        ]
      };
    } else {
      return null;
    }
  }
};
