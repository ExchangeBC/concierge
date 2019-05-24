import { Component, ComponentView, Immutable, Init, Update, View } from 'front-end/lib/framework';
import { validateConfirmPassword } from 'front-end/lib/validators';
import { updateField, validateField } from 'front-end/lib/views/form-field';
import FormSectionHeading from 'front-end/lib/views/form-section-heading';
import * as ShortText from 'front-end/lib/views/input/short-text';
import Link from 'front-end/lib/views/link';
import { default as React } from 'react';
import { Col, FormGroup, Label, Row } from 'reactstrap';
import { ADT, UserType, userTypeToTitleCase } from 'shared/lib/types';
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
  return !state.email.errors.length && !state.password.errors.length && !state.confirmPassword.errors.length;
}

export type Msg
  = ADT<'onChangeEmail', string>
  | ADT<'onChangePassword', string>
  | ADT<'onChangeConfirmPassword', string>
  | ADT<'validateEmail'>
  | ADT<'validatePassword'>
  | ADT<'validateConfirmPassword'>;

export interface Params {
  userType: UserType;
}

export const init: Init<Params, State> = async ({ userType }) => {
  return {
    userType,
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

const UserTypeRadio: View<{ state: State, userType: UserType }> = ({ state, userType }) => {
  const id = `sign-up-user-type-${userType}`;
  const isChecked = state.userType === userType;
  const style = { cursor: 'pointer' };
  return (
    <Link href={`/sign-up/${userType.toLowerCase().replace('_', '-')}`} className='custom-radio custom-control pl-0 pr-3 d-flex align-items-center' color='body'>
      <input
        id={id}
        type='radio'
        name='sign-up-user-type'
        value={UserType.Vendor}
        className='form-check-input'
        checked={isChecked}
        style={style}
        readOnly />
      <Label for={id} className='mb-0' style={style} >{userTypeToTitleCase(userType)}</Label>
    </Link>
  );
};

const UserTypeToggle: View<{ state: State }> = ({ state }) => {
  if (state.userType === UserType.ProgramStaff) {
    return null;
  } else {
    return (
      <div>
        <Label className='font-weight-bold d-block'>
          I am a...
          <span className='text-info'>*</span>
        </Label>
        <FormGroup check inline className='mb-3'>
          <UserTypeRadio state={state} userType={UserType.Buyer} />
          <UserTypeRadio state={state} userType={UserType.Vendor} />
        </FormGroup>
      </div>
    );
  }
}

export const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const onChange = (tag: any) => ShortText.makeOnChange(dispatch, e => ({ tag, value: e.currentTarget.value }));
  return (
    <div>
      <FormSectionHeading text='Account Information' />
      <Row>
        <Col xs='12'>
          <UserTypeToggle state={state} />
        </Col>
      </Row>
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
