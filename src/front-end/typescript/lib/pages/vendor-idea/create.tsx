import { makePageMetadata, makeStartLoading, makeStopLoading, UpdateState } from 'front-end/lib';
import { isUserType } from 'front-end/lib/access-control';
import router from 'front-end/lib/app/router';
import { Route, SharedState } from 'front-end/lib/app/types';
import { ComponentView, Dispatch, emptyPageAlerts, emptyPageBreadcrumbs, GlobalComponentMsg, Immutable, immutable, mapComponentDispatch, newRoute, PageComponent, PageInit, replaceRoute, Update, updateComponentChild } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import { WarningId } from 'front-end/lib/pages/terms-and-conditions';
import * as IntakeForm from 'front-end/lib/pages/vendor-idea/components/intake-form';
import { makeRequestBody } from 'front-end/lib/pages/vendor-idea/lib';
import FixedBar from 'front-end/lib/views/layout/fixed-bar';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import React from 'react';
import { Col, Row } from 'reactstrap';
import { CreateValidationErrors } from 'shared/lib/resources/vendor-idea';
import { ADT, UserType } from 'shared/lib/types';
import { invalid, valid } from 'shared/lib/validators';

export type RouteParams = null;

type InnerMsg
  = ADT<'intakeForm', IntakeForm.Msg>
  | ADT<'hideCancelConfirmationPrompt'>
  | ADT<'showCancelConfirmationPrompt'>
  | ADT<'hideSubmitConfirmationPrompt'>
  | ADT<'submit'>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

interface ValidState {
  loading: number;
  promptCancelConfirmation: boolean;
  promptSubmitConfirmation: boolean;
  intakeForm: Immutable<IntakeForm.State>;
};

export type State
  = ADT<'valid', Immutable<ValidState>>
  | ADT<'invalid'>;

const init: PageInit<RouteParams, SharedState, State, Msg> = isUserType({

  userTypes: [UserType.Vendor],

  async success({ shared, dispatch }) {
    const user = await api.readOneUser(shared.sessionUser.id);
    if (user.tag === 'valid' && !user.value.acceptedTermsAt) {
      dispatch(replaceRoute({
        tag: 'termsAndConditions' as const,
        value: {
          warningId: WarningId.CreateVi,
          redirectOnAccept: router.routeToUrl({
            tag: 'viCreate',
            value: null
          }),
          redirectOnSkip: router.routeToUrl({
            tag: 'viList',
            value: null
          })
        }
      }));
    }
    return valid(immutable({
      loading: 0,
      promptCancelConfirmation: false,
      promptSubmitConfirmation: false,
      intakeForm: immutable(await IntakeForm.init({
        isEditing: true
      }))
    }));
  },

  async fail({ routeParams, dispatch }) {
    dispatch(replaceRoute({
      tag: 'signIn' as const,
      value: {
        redirectOnSuccess: router.routeToUrl({
          tag: 'viCreate',
          value: null
        })
      }
    }));
    return invalid(undefined);
  }

});

const startLoading: UpdateState<ValidState> = makeStartLoading('loading');
const stopLoading: UpdateState<ValidState> = makeStopLoading('loading');

const update: Update<State, Msg> = ({ state, msg }) => {
  if (state.tag === 'invalid') { return [state]; }
  switch (msg.tag) {
    case 'intakeForm':
      return updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'intakeForm', value }),
        childStatePath: ['value', 'intakeForm'],
        childUpdate: IntakeForm.update,
        childMsg: msg.value
      });
    case 'hideCancelConfirmationPrompt':
      return [state.setIn(['value', 'promptCancelConfirmation'], false)];
    case 'showCancelConfirmationPrompt':
      return [state.setIn(['value', 'promptCancelConfirmation'], true)];
    case 'hideSubmitConfirmationPrompt':
      return [state.setIn(['value', 'promptSubmitConfirmation'], false)];
    case 'submit':
      if (!state.value.promptSubmitConfirmation) {
        return [state.setIn(['value', 'promptSubmitConfirmation'], true)];
      } else {
        state = state.setIn(['value', 'promptSubmitConfirmation'], false);
      }
      return [
        state.set('value', startLoading(state.value)),
        async (state, dispatch) => {
          if (state.tag === 'invalid') { return state; }
          const fail = (state: Immutable<State>, errors: CreateValidationErrors) => {
            if (state.tag === 'invalid') { return state; }
            state = state.set('value', stopLoading(state.value));
            return state.setIn(['value', 'intakeForm'], IntakeForm.setErrors(state.value.intakeForm, errors));
          };
          const requestBody = await makeRequestBody(state.value.intakeForm);
          switch (requestBody.tag) {
            case 'valid':
              const result = await api.createVi(requestBody.value);
              switch (result.tag) {
                case 'valid':
                  dispatch(newRoute({
                    tag: 'notice' as const,
                    value: {
                      noticeId: {
                        tag: 'viCreated',
                        value: undefined
                      }
                    }
                  }));
                  return null;
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
  if (state.tag === 'invalid') { return null; }
  const showCancelConfirmationPrompt = () => dispatch({ tag: 'showCancelConfirmationPrompt', value: undefined });
  const submit = () => dispatch({ tag: 'submit', value: undefined });
  const isLoading = state.value.loading > 0;
  const isDisabled = isLoading || !IntakeForm.isValid(state.value.intakeForm);
  return (
    <FixedBar>
      <LoadingButton color='primary' onClick={submit} loading={isLoading} disabled={isDisabled} className='text-nowrap'>
        Submit Application
      </LoadingButton>
      <Link onClick={showCancelConfirmationPrompt} color='secondary' disabled={isLoading} className='px-3'>Cancel</Link>
    </FixedBar>
  );
};

const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (state.tag === 'invalid') { return null; }
  const dispatchIntakeForm: Dispatch<IntakeForm.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'intakeForm' as const, value }));
  return (
    <div>
      <Row className='mb-5'>
        <Col xs='12' md='9' lg='8'>
          <h1>Vendor-Initiated Idea (VII) Application</h1>
          <p className='mb-3'>Complete the form below to submit your VII for review by the Procurement Concierge Program's staff. If you have not done so already, <b>please download and fill out the detailed information portion of the application</b> using the "Download Application" button below, as you will not be able to save this application as a draft.</p>
          <Link button color='primary'>Download Application</Link>
        </Col>
      </Row>
      <IntakeForm.view state={state.value.intakeForm} dispatch={dispatchIntakeForm} />
    </div>
  );
};

export const component: PageComponent<RouteParams, SharedState, State, Msg> = {
  init,
  update,
  view,
  viewBottomBar,
  getAlerts: emptyPageAlerts,
  getMetadata() {
    return makePageMetadata('Vendor-Initiated Idea Application');
  },
  getBreadcrumbs: emptyPageBreadcrumbs,
  getModal(state) {
    if (state.tag === 'invalid') { return null; }
    if (state.value.promptSubmitConfirmation) {
      return {
        title: 'Submit Application?',
        body: 'Please ensure all information provided is accurate. You will not be able to edit your application once it has been submitted unless requested by the program\'s staff.',
        onCloseMsg: { tag: 'hideSubmitConfirmationPrompt', value: undefined },
        actions: [
          {
            text: 'Submit Application',
            color: 'primary',
            button: true,
            msg: { tag: 'submit', value: undefined }
          },
          {
            text: 'Cancel',
            color: 'secondary',
            msg: { tag: 'hideSubmitConfirmationPrompt', value: undefined }
          }
        ]
      };
    } else if (state.value.promptCancelConfirmation) {
      return {
        title: 'Cancel Application?',
        body: 'Any information that you may have entered will be lost if you choose to cancel.',
        onCloseMsg: { tag: 'hideCancelConfirmationPrompt', value: undefined },
        actions: [
          {
            text: 'Yes, I want to cancel',
            color: 'primary',
            button: true,
            msg: newRoute({
              tag: 'viList',
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
