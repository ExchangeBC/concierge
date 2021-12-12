import { ComponentView, Immutable, Init, Update } from 'front-end/lib/framework';
import { IsLoading, IsValid, makeView, StepComponent, StepMsg } from 'front-end/lib/pages/sign-up/lib/steps/step';
import * as ShortText from 'front-end/lib/views/form-field/short-text';
import { get } from 'lodash';
import React from 'react';
import { Col, Row } from 'reactstrap';
import { CreateValidationErrors } from 'shared/lib/resources/user';
import { ADT, UserType, userTypeToTitleCase } from 'shared/lib/types';
import { getInvalidValue, validateFirstName, validateLastName, validatePositionTitle, Validation } from 'shared/lib/validators';

export interface State {
  firstName: ShortText.State;
  lastName: ShortText.State;
  positionTitle: ShortText.State;
}

type FormFieldKeys = 'firstName' | 'lastName' | 'positionTitle';

export type InnerMsg = ADT<'onChangeFirstName', string> | ADT<'onChangeLastName', string> | ADT<'onChangePositionTitle', string> | ADT<'validateFirstName'> | ADT<'validateLastName'> | ADT<'validatePositionTitle'>;

export type Msg = StepMsg<InnerMsg>;

export type Params = null;

const init: Init<Params, State> = async () => {
  return {
    firstName: ShortText.init({
      id: 'program-staff-profile-first-name',
      type: 'text',
      required: true,
      label: 'First Name',
      placeholder: 'First Name'
    }),
    lastName: ShortText.init({
      id: 'program-staff-profile-last-name',
      type: 'text',
      required: true,
      label: 'Last Name',
      placeholder: 'Last Name'
    }),
    positionTitle: ShortText.init({
      id: 'program-staff-profile-position-title',
      type: 'text',
      required: true,
      label: 'Position Title',
      placeholder: 'Position Title'
    })
  };
};

const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'onChangeFirstName':
      return [updateValue(state, 'firstName', msg.value)];
    case 'onChangeLastName':
      return [updateValue(state, 'lastName', msg.value)];
    case 'onChangePositionTitle':
      return [updateValue(state, 'positionTitle', msg.value)];
    case 'validateFirstName':
      return [validateValue(state, 'firstName', validateFirstName)];
    case 'validateLastName':
      return [validateValue(state, 'lastName', validateLastName)];
    case 'validatePositionTitle':
      return [validateValue(state, 'positionTitle', validatePositionTitle)];
    default:
      return [state];
  }
};

function updateValue<K extends FormFieldKeys>(state: Immutable<State>, key: K, value: State[K]['value']): Immutable<State> {
  return state.setIn([key, 'value'], value);
}

function validateValue<K extends FormFieldKeys>(state: Immutable<State>, key: K, validate: (value: State[K]['value']) => Validation<State[K]['value']>): Immutable<State> {
  const validation = validate(state.getIn([key, 'value']));
  return state.setIn([key, 'errors'], getInvalidValue(validation, []));
}

const isValid: IsValid<State> = (state) => {
  return !!(!state.firstName.errors.length && !state.lastName.errors.length && !state.positionTitle.errors.length && state.firstName.value && state.lastName.value && state.positionTitle.value);
};

const isLoading: IsLoading<State> = (state) => false;

const view: ComponentView<State, Msg> = makeView({
  title: `${userTypeToTitleCase(UserType.ProgramStaff)} Information`,
  stepIndicator: 'Step 2 of 2',
  view({ state, dispatch }) {
    const onChangeShortText = (tag: any) => ShortText.makeOnChange(dispatch, (value) => ({ tag, value }));
    const onChangeDebounced = (tag: any) => () => dispatch({ tag, value: undefined });
    return (
      <div>
        <Row>
          <Col xs="12" md="4">
            <ShortText.view state={state.firstName} onChangeDebounced={onChangeDebounced('validateFirstName')} onChange={onChangeShortText('onChangeFirstName')} autoFocus />
          </Col>
          <Col xs="12" md="4">
            <ShortText.view state={state.lastName} onChangeDebounced={onChangeDebounced('validateLastName')} onChange={onChangeShortText('onChangeLastName')} />
          </Col>
        </Row>
        <Row>
          <Col xs="12" md="4">
            <ShortText.view state={state.positionTitle} onChangeDebounced={onChangeDebounced('validatePositionTitle')} onChange={onChangeShortText('onChangePositionTitle')} />
          </Col>
        </Row>
      </div>
    );
  }
});

export const component: StepComponent<Params, State, InnerMsg> = {
  init,
  update,
  view,
  isValid,
  isLoading,
  actionLabels: {
    next: 'Create Account',
    cancel: 'Cancel',
    back: 'Go Back'
  }
};

export default component;

export function setErrors(state: Immutable<State>, errors: CreateValidationErrors): Immutable<State> {
  return state.setIn(['firstName', 'errors'], get(errors.profile, 'firstName', [])).setIn(['lastName', 'errors'], get(errors.profile, 'lastName', [])).setIn(['postitionTitle', 'errors'], get(errors.profile, 'postitionTitle', []));
}
