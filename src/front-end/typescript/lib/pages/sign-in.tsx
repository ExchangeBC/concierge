import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentView, Immutable, Init, Update } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import { validateAndUpdateField } from 'front-end/lib/views/form-field';
import * as ShortText from 'front-end/lib/views/input/short-text';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import { default as React } from 'react';
import { Alert, Col, Row } from 'reactstrap';
import { ADT } from 'shared/lib/types';
import { validateEmail, validatePassword } from 'shared/lib/validators';

export interface State {
  loading: number;
  errors: string[];
  email: ShortText.State;
  password: ShortText.State;
}

type InnerMsg
  = ADT<'onChangeEmail', string>
  | ADT<'onChangePassword', string>
  | ADT<'submit'>;

export type Msg = ComponentMsg<InnerMsg, Page>;

export type Params = null;

export const init: Init<Params, State> = async () => {
  return {
    loading: 0,
    errors: [],
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
      return [validateAndUpdateField(state, 'email', msg.value, validateEmail)];
    case 'onChangePassword':
      return [validateAndUpdateField(state, 'password', msg.value, validatePassword)];
    case 'submit':
      state = startLoading(state);
      return [
        state,
        async dispatch => {
          const result = await api.createSession(state.email.value, state.password.value);
          switch (result.tag) {
            case 'valid':
              dispatch({
                tag: '@newUrl',
                value: { tag: 'landing', value: null }
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
            {state.errors.map(e => (<div>{e}</div>))}
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
          <h1>Sign In</h1>
        </Col>
      </Row>
      <Row className='mb-3'>
        <Col xs='12' md='8'>
          <p>
            Welcome back to the Concierge. If you don't already have an account{' '}
            <Link href='/sign-up' text='sign up here' textColor='primary' buttonClassName='p-0' />.
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
                onEnter={submit} />
            </Col>
          </Row>
          <Row>
            <Col xs='12'>
              <ShortText.view
                state={state.password}
                onChange={onChange('onChangePassword')}
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
