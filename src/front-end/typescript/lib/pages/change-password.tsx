import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentView, Immutable, Init, Update } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import { validateConfirmPassword } from 'front-end/lib/validators';
import { validateAndUpdateField } from 'front-end/lib/views/form-field';
import * as ShortText from 'front-end/lib/views/input/short-text';
import * as PageContainer from 'front-end/lib/views/layout/page-container';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import { default as React } from 'react';
import { Col, Row } from 'reactstrap';
import { ADT } from 'shared/lib/types';
import { validatePassword } from 'shared/lib/validators';

export interface State {
  loading: number;
  userId: string;
  currentPassword: ShortText.State;
  newPassword: ShortText.State;
  confirmNewPassword: ShortText.State;
}

type InnerMsg
  = ADT<'currentPassword', string>
  | ADT<'newPassword', string>
  | ADT<'confirmNewPassword', string>
  | ADT<'submit'>;

export type Msg = ComponentMsg<InnerMsg, Page>;

export interface Params {
  userId: string;
}

export const init: Init<Params, State> = async ({ userId }) => {
  return {
    loading: 0,
    userId,
    currentPassword: ShortText.init({
      id: 'change-password-password',
      required: true,
      type: 'password',
      label: 'Current Password',
      placeholder: 'Current Password'
    }),
    newPassword: ShortText.init({
      id: 'change-password-new-password',
      required: true,
      type: 'password',
      label: 'New Password',
      placeholder: 'New Password'
    }),
    confirmNewPassword: ShortText.init({
      id: 'change-password-confirm-new-password',
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
    case 'currentPassword':
      return [validateAndUpdateField(state, 'currentPassword', msg.value, validatePassword)];
    case 'newPassword':
      return [validateAndUpdateField(state, 'newPassword', msg.value, validatePassword)];
    case 'confirmNewPassword':
      return [validateAndUpdateField(state, 'confirmNewPassword', msg.value, v => validateConfirmPassword(state.newPassword.value, v))];
    case 'submit':
      state = startLoading(state);
      return [
        state,
        async dispatch => {
          const result = await api.updateUser({
            _id: state.userId,
            currentPassword: state.currentPassword.value,
            newPassword: state.newPassword.value
          });
          switch (result.tag) {
            case 'valid':
              dispatch({
                tag: '@newUrl',
                value: { tag: 'noticeChangePassword', value: null }
              });
              return state;
            case 'invalid':
              return stopLoading(state)
                .setIn(['currentPassword', 'errors'], result.value.currentPassword || []);
          }
        }
      ];
    default:
      return [state];
  }
};

function isInvalid(state: State): boolean {
  return !!(state.currentPassword.errors.length || state.newPassword.errors.length || state.confirmNewPassword.errors.length);
}

function isValid(state: State): boolean {
  const providedRequiredFields = !!(state.currentPassword.value && state.newPassword.value && state.confirmNewPassword.value);
  return providedRequiredFields && !isInvalid(state);
}

export const view: ComponentView<State, Msg> = props => {
  const { state, dispatch } = props;
  const onChange = (tag: any) => ShortText.makeOnChange(dispatch, e => ({ tag, value: e.currentTarget.value }));
  const isLoading = state.loading > 0;
  const isDisabled = isLoading || !isValid(state);
  const submit = () => !isDisabled && dispatch({ tag: 'submit', value: undefined });
  return (
    <PageContainer.View>
      <Row className='mb-3'>
        <Col xs='12'>
          <h1>Change Password</h1>
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='6' lg='5'>
          <Row>
            <Col xs='12'>
              <ShortText.view
                state={state.currentPassword}
                onChange={onChange('currentPassword')}
                onEnter={submit} />
            </Col>
          </Row>
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
                Update Password
              </LoadingButton>
              <Link page={{ tag: 'profile', value: { profileUserId: state.userId } }} text='Cancel' textColor='secondary' />
            </Col>
          </Row>
        </Col>
      </Row>
    </PageContainer.View>
  );
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
