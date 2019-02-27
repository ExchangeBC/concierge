import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentView, Immutable, Init, Update, View } from 'front-end/lib/framework';
import { validateConfirmPassword } from 'front-end/lib/validators';
import { validateAndUpdateField } from 'front-end/lib/views/form-field';
import FormSectionHeading from 'front-end/lib/views/form-section-heading';
import * as ShortText from 'front-end/lib/views/input/short-text';
import Link from 'front-end/lib/views/link';
import { default as React } from 'react';
import { Col, Form, FormGroup, Label, Row } from 'reactstrap';
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

type InnerMsg
  = ADT<'onChangeEmail', string>
  | ADT<'onChangePassword', string>
  | ADT<'onChangeConfirmPassword', string>;

export type Msg = ComponentMsg<InnerMsg, Page>;

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
      placeholder: 'Email Address'
    }),
    password: ShortText.init({
      id: 'password',
      required: true,
      type: 'password',
      label: 'Password',
      placeholder: 'Password'
    }),
    confirmPassword: ShortText.init({
      id: 'confirmPassword',
      required: true,
      type: 'password',
      label: 'Confirm Password',
      placeholder: 'Confirm Password'
    })
  };
};

export const update: Update<State, Msg> = (state, msg) => {
  const json = state.toJSON();
  switch (msg.tag) {
    case 'onChangeEmail':
      return [validateAndUpdateField(state, 'email', msg.value, validateEmail)];
    case 'onChangePassword':
      return [validateAndUpdateField(state, 'password', msg.value, validatePassword)];
    case 'onChangeConfirmPassword':
      return [validateAndUpdateField(state, 'confirmPassword', msg.value, v => validateConfirmPassword(json.password.value, v))];
    default:
      return [state];
  }
};

const UserTypeRadio: View<{ state: State, userType: UserType }> = ({ state, userType }) => {
  const id = `sign-up-user-type-${userType}`;
  const isChecked = state.userType === userType;
  const style = { cursor: 'pointer' };
  return (
    <Link href={`/sign-up/${userType.toLowerCase().replace('_', '-')}`} className='custom-radio custom-control' buttonClassName='p-0 d-flex align-items-center' textColor='body'>
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
      <FormGroup check inline className='mb-3'>
        <Label className='mb-0'>
          I am a*:
        </Label>
        <UserTypeRadio state={state} userType={UserType.Buyer} />
        <UserTypeRadio state={state} userType={UserType.Vendor} />
      </FormGroup>
    );
  }
}

export const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const onChange = (tag: any) => ShortText.makeOnChange(dispatch, e => ({ tag, value: e.currentTarget.value }));
  return (
    <div>
      <FormSectionHeading text='Account Information' />
      <Form>
        <Row>
          <Col xs='12'>
            <UserTypeToggle state={state} />
          </Col>
          <Col xs='12'>
            <ShortText.view
              state={state.email}
              onChange={onChange('onChangeEmail')} />
          </Col>
          <Col xs='12'>
            <ShortText.view
              state={state.password}
              onChange={onChange('onChangePassword')} />
          </Col>
          <Col xs='12'>
            <ShortText.view
              state={state.confirmPassword}
              onChange={onChange('onChangeConfirmPassword')} />
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
