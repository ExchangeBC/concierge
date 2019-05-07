import { makePageMetadata } from 'front-end/lib';
import { Route, SharedState } from 'front-end/lib/app/types';
import { ComponentView, emptyPageAlerts, GlobalComponentMsg, Immutable, newRoute, PageComponent, PageInit, Update } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import { validateConfirmPassword } from 'front-end/lib/validators';
import { updateField, validateField } from 'front-end/lib/views/form-field';
import * as ShortText from 'front-end/lib/views/input/short-text';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import { concat } from 'lodash';
import { default as React } from 'react';
import { Col, Row } from 'reactstrap';
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
  = ADT<'onChangeNewPassword', string>
  | ADT<'onChangeConfirmNewPassword', string>
  | ADT<'validateNewPassword'>
  | ADT<'validateConfirmNewPassword'>
  | ADT<'submit'>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

export interface RouteParams {
  forgotPasswordToken: string;
  userId: string;
}

const init: PageInit<RouteParams, SharedState, State, Msg> = async ({ routeParams }) => {
  const { forgotPasswordToken, userId } = routeParams;
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

const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'onChangeNewPassword':
      return [updateField(state, 'newPassword', msg.value)];
    case 'onChangeConfirmNewPassword':
      return [updateField(state, 'confirmNewPassword', msg.value)];
    case 'validateNewPassword':
      return [validateField(state, 'newPassword', validatePassword)];
    case 'validateConfirmNewPassword':
      return [validateField(state, 'confirmNewPassword', v => validateConfirmPassword(state.newPassword.value, v))];
    case 'submit':
      state = startLoading(state);
      return [
        state,
        async (state, dispatch) => {
          const result = await api.updateForgotPasswordToken(state.forgotPasswordToken, state.userId, state.newPassword.value);
          switch (result.tag) {
            case 'valid':
              dispatch(newRoute({
                tag: 'notice' as 'notice',
                value: {
                  noticeId: {
                    tag: 'resetPassword' as 'resetPassword',
                    value: undefined
                  }
                }
              }));
              return state;
            case 'invalid':
              return stopLoading(state)
                .setIn(['onChangeNewPassword', 'errors'], result.value.password || [])
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

const view: ComponentView<State, Msg> = props => {
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
      <Row>
        <Col xs='12' md='6' lg='5'>
          <Row>
            <Col xs='12'>
              <ShortText.view
                state={state.newPassword}
                onChange={onChange('onChangeNewPassword')}
                onChangeDebounced={() => dispatch({ tag: 'validateNewPassword', value: undefined })}
                onEnter={submit} />
            </Col>
          </Row>
          <Row className='mb-3 pb-3'>
            <Col xs='12'>
              <ShortText.view
                state={state.confirmNewPassword}
                onChange={onChange('onChangeConfirmNewPassword')}
                onChangeDebounced={() => dispatch({ tag: 'validateConfirmNewPassword', value: undefined })}
                onEnter={submit} />
            </Col>
          </Row>
          <Row>
            <Col xs='12'>
              <LoadingButton color='primary' onClick={submit} loading={isLoading} disabled={isDisabled}>
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

export const component: PageComponent<RouteParams, SharedState, State, Msg> = {
  init,
  update,
  view,
  getAlerts(state) {
    return {
      ...emptyPageAlerts(),
      errors: state.errors
    };
  },
  getMetadata() {
    return makePageMetadata('Reset your Password');
  }
};
