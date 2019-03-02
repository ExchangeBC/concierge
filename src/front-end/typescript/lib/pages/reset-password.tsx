import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentView, Immutable, Init, Update } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import { validateConfirmPassword } from 'front-end/lib/validators';
import { validateAndUpdateField } from 'front-end/lib/views/form-field';
import * as ShortText from 'front-end/lib/views/input/short-text';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import { concat } from 'lodash';
import { default as React } from 'react';
import { Alert, Col, Row } from 'reactstrap';
import { ADT } from 'shared/lib/types';
import { validatePassword } from 'shared/lib/validators';

export interface State {
  loading: number;
  forgotPasswordToken: string;
  userId: string;
  errors: string[];
  newPassword: ShortText.State;
  confirmNewPassword: ShortText.State;
}

type InnerMsg
  = ADT<'newPassword', string>
  | ADT<'confirmNewPassword', string>
  | ADT<'submit'>;

export type Msg = ComponentMsg<InnerMsg, Page>;

export interface Params {
  forgotPasswordToken: string;
  userId: string;
}

export const init: Init<Params, State> = async ({ forgotPasswordToken, userId }) => {
  return {
    loading: 0,
    forgotPasswordToken,
    userId,
    errors: [],
    newPassword: ShortText.init({
      id: 'reset-password-password',
      required: true,
      type: 'password',
      label: 'New Password',
      placeholder: 'New Password'
    }),
    confirmNewPassword: ShortText.init({
      id: 'reset-password-confirm-new-password',
      required: true,
      type: 'password',
      label: 'Confirm New Password',
      placeholder: 'Confirm New Password'
    })
  };
};

function startLoading(state: Immutable<State>): Immutable<State> {
  return state.set('loading', state.loading + 1);
}

function stopLoading(state: Immutable<State>): Immutable<State> {
  return state.set('loading', Math.max(state.loading - 1, 0));
}

export const update: Update<State, Msg> = (state, msg) => {
  switch (msg.tag) {
    case 'newPassword':
      return [validateAndUpdateField(state, 'newPassword', msg.value, validatePassword)];
    case 'confirmNewPassword':
      return [validateAndUpdateField(state, 'confirmNewPassword', msg.value, v => validateConfirmPassword(state.newPassword.value, v))];
    case 'submit':
      state = startLoading(state);
      return [
        state,
        async dispatch => {
          const result = await api.updateForgotPasswordToken(state.forgotPasswordToken, state.userId, state.newPassword.value);
          switch (result.tag) {
            case 'valid':
              dispatch({
                tag: '@newUrl',
                value: { tag: 'noticeResetPassword', value: null }
              });
              return state;
            case 'invalid':
              return stopLoading(state)
                .setIn(['newPassword', 'errors'], result.value.password || [])
                .set('errors', concat(result.value.permissions || [], result.value.forgotPasswordToken || [], result.value.userId || []));
          }
        }
      ];
    default:
      return [state];
  }
};

function isInvalid(state: State): boolean {
  return !!(state.newPassword.errors.length || state.confirmNewPassword.errors.length);
}

function isValid(state: State): boolean {
  const providedRequiredFields = !!(state.newPassword.value && state.confirmNewPassword.value);
  return providedRequiredFields && !isInvalid(state);
}

const ConditionalErrors: ComponentView<State, Msg> = ({ state }) => {
  if (state.errors.length) {
    return (
      <Row className='mb-3'>
        <Col xs='12'>
          <Alert color='danger'>
            {state.errors.map((e, i) => (<div key={`reset-password-error-${i}`}>{e}</div>))}
          </Alert>
        </Col>
      </Row>
    );
  } else {
    return (<div></div>);
  }
};

export const view: ComponentView<State, Msg> = props => {
  const { state, dispatch } = props;
  const onChange = (tag: any) => ShortText.makeOnChange(dispatch, e => ({ tag, value: e.currentTarget.value }));
  const isLoading = state.loading > 0;
  const isDisabled = isLoading || !isValid(state);
  const submit = () => !isDisabled && dispatch({ tag: 'submit', value: undefined });
  return (
    <div>
      <Row>
        <Col xs='12'>
          <h1>Reset Password</h1>
        </Col>
      </Row>
      <Row className='mb-3'>
        <Col xs='12' md='8'>
          <p>
            Please enter a new password below to regain access to your account.
          </p>
        </Col>
      </Row>
      <ConditionalErrors {...props} />
      <Row>
        <Col xs='12' md='6' lg='5'>
          <Row>
            <Col xs='12'>
              <ShortText.view
                state={state.newPassword}
                onChange={onChange('newPassword')}
                onEnter={submit} />
            </Col>
          </Row>
          <Row className='mb-3 pb-3'>
            <Col xs='12'>
              <ShortText.view
                state={state.confirmNewPassword}
                onChange={onChange('confirmNewPassword')}
                onEnter={submit} />
            </Col>
          </Row>
          <Row>
            <Col xs='12'>
              <LoadingButton color={isDisabled ? 'secondary' : 'primary'} onClick={submit} loading={isLoading} disabled={isDisabled}>
                Reset Password
              </LoadingButton>
              <Link href='/' text='Cancel' textColor='secondary' />
            </Col>
          </Row>
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
