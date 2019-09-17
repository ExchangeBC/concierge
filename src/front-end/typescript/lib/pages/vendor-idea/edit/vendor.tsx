import { makePageMetadata, makeStartLoadingIn, makeStopLoadingIn, UpdateState } from 'front-end/lib';
import { Route } from 'front-end/lib/app/types';
import { ComponentView, Dispatch, GlobalComponentMsg, immutable, Immutable, Init, mapComponentDispatch, newRoute, PageGetBreadcrumbs, PageGetMetadata, PageGetModal, replaceRoute, Update, updateComponentChild } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import * as IntakeForm from 'front-end/lib/pages/vendor-idea/components/intake-form';
import { makeRequestBody } from 'front-end/lib/pages/vendor-idea/lib';
import { SubmittedDate, UpdatedDate } from 'front-end/lib/pages/vendor-idea/views/dates';
import { LogItemTypeBadge } from 'front-end/lib/pages/vendor-idea/views/log-item-type-badge';
import Icon from 'front-end/lib/views/icon';
import FixedBar from 'front-end/lib/views/layout/fixed-bar';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import React from 'react';
import { Col, Row } from 'reactstrap';
import { PublicVendorIdeaForVendors, UpdateValidationErrors } from 'shared/lib/resources/vendor-idea';
import { LogItemType } from 'shared/lib/resources/vendor-idea/log-item';
import { ADT } from 'shared/lib/types';
import { invalid, valid } from 'shared/lib/validators';

export interface Params {
  viId: string;
  dispatch: Dispatch<Msg>;
};

type InnerMsg
  = ADT<'intakeForm', IntakeForm.Msg>
  | ADT<'startEditing'>
  | ADT<'cancelEditing'>
  | ADT<'hideCancelConfirmationPrompt'>
  | ADT<'hideSubmitConfirmationPrompt'>
  | ADT<'submit'>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

interface ValidState {
  startEditingLoading: number;
  submitLoading: number;
  promptCancelConfirmation: boolean;
  promptSubmitConfirmation: boolean;
  intakeForm: Immutable<IntakeForm.State>;
  vi: PublicVendorIdeaForVendors;
};

export type State
  = ADT<'valid', ValidState>
  | ADT<'invalid'>;

async function resetIntakeForm(existingVi: PublicVendorIdeaForVendors): Promise<Immutable<IntakeForm.State>> {
  return immutable(await IntakeForm.init({
    isEditing: false,
    existingVi
  }));
}

export const init: Init<Params, State> = async ({ viId, dispatch }) => {
  const existingVi = await api.readOneViForVendors(viId);
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
    startEditingLoading: 0,
    submitLoading: 0,
    promptCancelConfirmation: false,
    promptSubmitConfirmation: false,
    intakeForm: await resetIntakeForm(existingVi.value),
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
    case 'intakeForm':
      return updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'intakeForm', value }),
        childStatePath: ['value', 'intakeForm'],
        childUpdate: IntakeForm.update,
        childMsg: msg.value
      });
    case 'startEditing':
      return [
        startStartEditingLoading(state),
        async state => {
          state = stopStartEditingLoading(state);
          if (state.tag === 'invalid') { return state; }
          // Reset the RFI form with fresh data before editing.
          const result = await api.readOneViForVendors(state.value.vi._id);
          if (result.tag === 'invalid') { return state; }
          state = state
            .setIn(['value', 'vi'], result.value)
            .setIn(['value', 'intakeForm'], await resetIntakeForm(result.value));
          return setIsEditing(state, true);
        }
      ];
    case 'cancelEditing':
      if (!state.value.promptCancelConfirmation) {
        return [state.setIn(['value', 'promptCancelConfirmation'], true)];
      } else {
        state = state.setIn(['value', 'promptCancelConfirmation'], false);
      }
      return [
        setIsEditing(state, false),
        async (state) => {
          if (state.tag === 'invalid') { return state; }
          return state.setIn(['value', 'intakeForm'], await resetIntakeForm(state.value.vi));
        }
      ];
    case 'hideCancelConfirmationPrompt':
      return [state.setIn(['value', 'promptCancelConfirmation'], false)];
    case 'hideSubmitConfirmationPrompt':
      return [state.setIn(['value', 'promptSubmitConfirmation'], false)];
    case 'submit':
      if (!state.value.promptSubmitConfirmation) {
        return [state.setIn(['value', 'promptSubmitConfirmation'], true)];
      } else {
        state = state.setIn(['value', 'promptSubmitConfirmation'], false);
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
              const result = await api.updateViForVendors(requestBody.value, state.value.vi._id);
              switch (result.tag) {
                case 'valid':
                  state = state
                    .setIn(['value', 'intakeForm'], await resetIntakeForm(result.value))
                    .setIn(['value', 'vi'], result.value);
                  dispatch(newRoute({
                    tag: 'notice',
                    value: {
                      noticeId: {
                        tag: 'viEditedByVendor',
                        value: undefined
                      }
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

export const viewBottomBar: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (state.tag === 'invalid') { return null; }
  if (state.value.vi.latestStatus !== LogItemType.EditsRequired) { return null; }
  const submit = () => dispatch({ tag: 'submit', value: undefined });
  const startEditing = () => dispatch({ tag: 'startEditing', value: undefined });
  const cancelEditing = () => dispatch({ tag: 'cancelEditing', value: undefined });
  const isSubmitLoading = state.value.submitLoading > 0;
  const isStartEditingLoading = state.value.startEditingLoading > 0;
  const isLoading = isSubmitLoading || isStartEditingLoading;
  const isDisabled = isLoading || !IntakeForm.isValid(state.value.intakeForm);
  if (state.value.intakeForm.isEditing) {
    return (
      <FixedBar>
        <LoadingButton color='primary' onClick={submit} loading={isSubmitLoading} disabled={isDisabled} className='text-nowrap'>
          Submit Changes
        </LoadingButton>
        <Link onClick={cancelEditing} color='secondary' disabled={isLoading} className='px-3'>Cancel</Link>
      </FixedBar>
    );
  } else {
    return (
      <FixedBar>
        <LoadingButton color='primary' onClick={startEditing} loading={isStartEditingLoading} disabled={isDisabled} className='text-nowrap'>
          Edit Application
        </LoadingButton>
      </FixedBar>
    );
  }
};

export const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (state.tag === 'invalid') { return null; }
  const { intakeForm, vi } = state.value;
  const dispatchIntakeForm: Dispatch<IntakeForm.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'intakeForm' as const, value }));
  return (
    <div>
      <Row>
        <Col xs='12' md='10'>
          <h3 className='d-flex flex-column-reverse flex-md-row align-items-start align-items-md-center flex-wrap'>
            Vendor-Initiated Idea Application
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
      <Row className='mb-3'>
        <Col xs='12'>
          <p className='text-secondary small'>
            <SubmittedDate date={vi.createdAt} className='d-block d-md-inline' />
            <span className='px-3 d-none d-md-inline'>|</span>
            <UpdatedDate date={vi.latestVersion.createdAt} className='d-block d-md-inline' />
          </p>
        </Col>
      </Row>
      <Row className='mb-5'>
        <Col xs='12' md='9' lg='8'>
          <div className='d-flex align-items-top flex-nowrap'>
            <Icon name='info-circle' color='info' width={0.9} height={0.9} className='mr-2 flex-shrink-0 mt-1' />
            <div className='font-italic small'>Please note that it may take up to four weeks to review and process your application. A member of the Procurement Concierge Program will be in touch with you shortly.</div>
          </div>
        </Col>
      </Row>
      <IntakeForm.view state={intakeForm} dispatch={dispatchIntakeForm} />
    </div>
  );
};

export const getMetadata: PageGetMetadata<State> = state => {
  if (state.tag === 'valid') {
    return makePageMetadata(`${state.value.vi.latestVersion.description.title} — Vendor-Initiated Idea Application`);
  } else {
    return makePageMetadata('Edit a Vendor-Initiated Idea Application');
  }
};

export const getBreadcrumbs: PageGetBreadcrumbs<State, Msg> = state => {
  return [
    {
      text: 'My Vendor-Initiated Ideas',
      onClickMsg: newRoute({
        tag: 'viList',
        value: null
      })
    },
    {
      text: state.tag === 'valid' ? state.value.vi.latestVersion.description.title : 'Edit a Vendor-Initiated Idea Application'
    }
  ];
};

export const getModal: PageGetModal<State, Msg> = state => {
  if (state.tag === 'invalid') { return null; }
  if (state.value.promptSubmitConfirmation) {
    return {
      title: 'Submit Changes to Application?',
      body: 'Please ensure all information provided is accurate. You will not be able to make additional changes to your application once it has been submitted unless requested by the program\'s staff.',
      onCloseMsg: { tag: 'hideSubmitConfirmationPrompt', value: undefined },
      actions: [
        {
          text: 'Submit Changes',
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
      title: 'Cancel Changes to Application?',
      body: 'Any information that you may have entered will be lost if you choose to cancel.',
      onCloseMsg: { tag: 'hideCancelConfirmationPrompt', value: undefined },
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
          msg: { tag: 'hideCancelConfirmationPrompt', value: undefined }
        }
      ]
    };
  } else {
    return null;
  }
};
