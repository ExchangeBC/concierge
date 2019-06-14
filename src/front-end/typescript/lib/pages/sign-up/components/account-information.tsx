import { Component, ComponentView, Immutable, Init, Update } from 'front-end/lib/framework';
import { validateConfirmPassword } from 'front-end/lib/validators';
import { updateField, validateField } from 'front-end/lib/views/form-field/lib';
import * as ShortText from 'front-end/lib/views/form-field/short-text';
import { default as React } from 'react';
import { Col, Row } from 'reactstrap';
import { ADT, UserType } from 'shared/lib/types';
import { validateEmail, validatePassword } from 'shared/lib/validators';

export interface State {
  userType: UserType;
  email: ShortText.State;
  password: ShortText.State;
  confirmPassword: ShortText.State;
}

export interface AccountInformation {
  email: string;
  password: string;
}

export function getValues(state: State): AccountInformation {
  return {
    email: state.email.value,
    password: state.password.value
  };
}

export interface ValidationErrors {
  email?: string[];
  password?: string[];
  confirmPassword?: string[];
}

export function setErrors(state: Immutable<State>, errors: ValidationErrors): Immutable<State> {
  return state
    .updateIn(['email', 'errors'], v => errors.email || v)
    .updateIn(['password', 'errors'], v => errors.password || v)
    .updateIn(['confirmPassword', 'errors'], v => errors.confirmPassword || v);

}

export function isValid(state: Immutable<State>): boolean {
  return !!(!state.email.errors.length && !state.password.errors.length && !state.confirmPassword.errors.length && state.email.value && state.password.value && state.confirmPassword.value);
}

export type Msg
  = ADT<'onChangeEmail', string>
  | ADT<'onChangePassword', string>
  | ADT<'onChangeConfirmPassword', string>
  | ADT<'validateEmail'>
  | ADT<'validatePassword'>
  | ADT<'validateConfirmPassword'>;

export type Params = null | {
  userType: UserType;
};

export const init: Init<Params, State> = async () => {
  return {
    userType: UserType.Buyer,
    email: ShortText.init({
      id: 'email',
      required: true,
      type: 'email',
      label: 'Email Address',
      placeholder: 'Email Address',
      value: ''
    }),
    password: ShortText.init({
      id: 'password',
      required: true,
      type: 'password',
      label: 'Password',
      placeholder: 'Password',
      value: ''
    }),
    confirmPassword: ShortText.init({
      id: 'confirmPassword',
      required: true,
      type: 'password',
      label: 'Confirm Password',
      placeholder: 'Confirm Password',
      value: ''
    })
  };
};

export const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'onChangeEmail':
      return [updateField(state, 'email', msg.value)];
    case 'onChangePassword':
      return [updateField(state, 'password', msg.value)];
    case 'onChangeConfirmPassword':
      return [updateField(state, 'confirmPassword', msg.value)];
    case 'validateEmail':
      return [validateField(state, 'email', validateEmail)];
    case 'validatePassword':
      return [validateField(state, 'password', validatePassword)];
    case 'validateConfirmPassword':
      return [validateField(state, 'confirmPassword', v => validateConfirmPassword(state.password.value, v))];
    default:
      return [state];
  }
};

export const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const onChange = (tag: any) => ShortText.makeOnChange(dispatch, value => ({ tag, value }));
  return (
    <div>
      <Row>
        <Col xs='12'>
          <ShortText.view
            state={state.email}
            onChangeDebounced={() => dispatch({ tag: 'validateEmail', value: undefined })}
            onChange={onChange('onChangeEmail')}
            autoFocus />
        </Col>
      </Row>
      <Row>
        <Col xs='12'>
          <ShortText.view
            state={state.password}
            onChangeDebounced={() => dispatch({ tag: 'validatePassword', value: undefined })}
            onChange={onChange('onChangePassword')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12'>
          <ShortText.view
            state={state.confirmPassword}
            onChangeDebounced={() => dispatch({ tag: 'validateConfirmPassword', value: undefined })}
            onChange={onChange('onChangeConfirmPassword')} />
        </Col>
      </Row>
    </div>
  );
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
