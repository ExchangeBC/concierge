import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentView, Immutable, Init, Update } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import { validateAndUpdateField } from 'front-end/lib/views/form-field';
import * as ShortText from 'front-end/lib/views/input/short-text';
import * as PageContainer from 'front-end/lib/views/layout/page-container';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import { default as React } from 'react';
import { Col, Row } from 'reactstrap';
import { ADT } from 'shared/lib/types';
import { validateEmail } from 'shared/lib/validators';

export interface State {
  loading: number;
  email: ShortText.State;
}

type InnerMsg
  = ADT<'email', string>
  | ADT<'submit'>;

export type Msg = ComponentMsg<InnerMsg, Page>;

export type Params = null;

export const init: Init<Params, State> = async () => {
  return {
    loading: 0,
    email: ShortText.init({
      id: 'forgot-password-email',
      required: true,
      type: 'email',
      label: 'Email',
      placeholder: 'Email'
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
    case 'email':
      return [validateAndUpdateField(state, 'email', msg.value, validateEmail)];
    case 'submit':
      state = startLoading(state);
      return [
        state,
        async dispatch => {
          await api.createForgotPasswordToken(state.email.value);
          // Always redirect user to the confirmation page,
          // so we don't give away any information about which users
          // have accounts and which ones don't.
          dispatch({
            tag: '@newUrl',
            value: { tag: 'noticeForgotPassword', value: null }
          });
          return stopLoading(state)
        }
      ];
    default:
      return [state];
  }
};

function isInvalid(state: State): boolean {
  return !!state.email.errors.length;
}

function isValid(state: State): boolean {
  const providedRequiredFields = !!state.email.value;
  return providedRequiredFields && !isInvalid(state);
}

export const view: ComponentView<State, Msg> = props => {
  const { state, dispatch } = props;
  const onChange = (tag: any) => ShortText.makeOnChange(dispatch, e => ({ tag, value: e.currentTarget.value }));
  const isLoading = state.loading > 0;
  const isDisabled = isLoading || !isValid(state);
  const submit = () => !isDisabled && dispatch({ tag: 'submit', value: undefined });
  return (
    <PageContainer.View paddingY>
      <Row>
        <Col xs='12'>
          <h1>Forgotten Your Password?</h1>
        </Col>
      </Row>
      <Row className='mb-3'>
        <Col xs='12' md='8'>
          <p>
            Enter your email address below and we'll email you instructions on how to reset your password.
          </p>
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='6' lg='5'>
          <Row className='mb-3 pb-3'>
            <Col xs='12'>
              <ShortText.view
                state={state.email}
                onChange={onChange('email')}
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
    </PageContainer.View>
  );
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
