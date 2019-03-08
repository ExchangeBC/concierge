import router from 'front-end/lib/app/router';
import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentView, Immutable, Init, Update } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import { updateField, validateField } from 'front-end/lib/views/form-field';
import * as ShortText from 'front-end/lib/views/input/short-text';
import * as PageContainer from 'front-end/lib/views/layout/page-container';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import { default as React } from 'react';
import { Alert, Col, Row } from 'reactstrap';
import { ADT, UserType } from 'shared/lib/types';
import { validateEmail, validatePassword } from 'shared/lib/validators';

export interface State {
  loading: number;
  errors: string[];
  redirectOnSuccess?: Page;
  email: ShortText.State;
  password: ShortText.State;
}

type InnerMsg
  = ADT<'onChangeEmail', string>
  | ADT<'onChangePassword', string>
  | ADT<'validateEmail'>
  | ADT<'validatePassword'>
  | ADT<'submit'>;

export type Msg = ComponentMsg<InnerMsg, Page>;

export interface Params {
  redirectOnSuccess?: Page;
};

export const init: Init<Params, State> = async ({ redirectOnSuccess }) => {
  return {
    loading: 0,
    errors: [],
    redirectOnSuccess,
    email: ShortText.init({
      id: 'sign-in-email',
      required: true,
      type: 'email',
      label: 'Email Address',
      placeholder: 'Email Address'
    }),
    password: ShortText.init({
      id: 'sign-in-password',
      required: true,
      type: 'password',
      label: 'Password',
      placeholder: 'Password'
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
  // Reset errors every time state updates.
  state = state.set('errors', []);
  switch (msg.tag) {
    case 'onChangeEmail':
      return [updateField(state, 'email', msg.value)];
    case 'onChangePassword':
      return [updateField(state, 'password', msg.value)];
    case 'validateEmail':
      return [validateField(state, 'email', validateEmail)];
    case 'validatePassword':
      return [validateField(state, 'password', validatePassword)];
    case 'submit':
      state = startLoading(state);
      return [
        state,
        async dispatch => {
          const result = await api.createSession(state.email.value, state.password.value);
          switch (result.tag) {
            case 'valid':
              let fallbackRedirectOnSuccess: Page = router.fallbackPage;
              if (result.value.user) {
                // Redirect user to relevant page based on type.
                const userId = result.value.user.id;
                const userType = result.value.user.type;
                fallbackRedirectOnSuccess = userType === UserType.ProgramStaff ? { tag: 'userList', value: null } : { tag: 'profile', value: { profileUserId: userId }};
              }
              // Give precendence to already-defined redirect page.
              const redirectOnSuccess = state.redirectOnSuccess || fallbackRedirectOnSuccess;
              dispatch({
                tag: '@newUrl',
                value: redirectOnSuccess
              });
              return state;
            case 'invalid':
              return stopLoading(state).set('errors', result.value);
          }
        }
      ];
    default:
      return [state];
  }
};

function isInvalid(state: State): boolean {
  return !!state.errors.length || !!state.email.errors.length || !!state.password.errors.length;
}

function isValid(state: State): boolean {
  const providedRequiredFields = !!(state.email.value && state.password.value);
  return providedRequiredFields && !isInvalid(state);
}

const ConditionalErrors: ComponentView<State, Msg> = ({ state }) => {
  if (state.errors.length) {
    return (
      <Row className='mb-3'>
        <Col xs='12'>
          <Alert color='danger'>
            {state.errors.map((e, i) => (<div key={`sign-in-error-${i}`}>{e}</div>))}
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
    <PageContainer.View paddingY>
      <Row>
        <Col xs='12'>
          <h1>Sign In</h1>
        </Col>
      </Row>
      <Row className='mb-3'>
        <Col xs='12' md='8'>
          <p>
            Welcome back to the Concierge. If you don't already have an account,{' '}
            <a href='/sign-up' className='text-primary'>sign up here</a>.
          </p>
        </Col>
      </Row>
      <ConditionalErrors {...props} />
      <Row>
        <Col xs='12' md='6' lg='5'>
          <Row>
            <Col xs='12'>
              <ShortText.view
                state={state.email}
                onChange={onChange('onChangeEmail')}
                onChangeDebounced={() => dispatch({ tag: 'validateEmail', value: undefined })}
                onEnter={submit} />
            </Col>
          </Row>
          <Row>
            <Col xs='12'>
              <ShortText.view
                state={state.password}
                onChange={onChange('onChangePassword')}
                onChangeDebounced={() => dispatch({ tag: 'validatePassword', value: undefined })}
                onEnter={submit} />
            </Col>
          </Row>
          <Row className='mb-3 pb-3'>
            <Col xs='12'>
              <Link href='/forgot-password' text='Forgotten your password?' textColor='secondary' buttonClassName='p-0' />
            </Col>
          </Row>
          <Row>
            <Col xs='12'>
              <LoadingButton color={isDisabled ? 'secondary' : 'primary'} onClick={submit} loading={isLoading} disabled={isDisabled}>
                Sign In
              </LoadingButton>
              <Link page={{ tag: 'landing', value: null }} text='Cancel' textColor='secondary' />
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
