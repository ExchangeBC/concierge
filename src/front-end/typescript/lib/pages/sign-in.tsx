import { makeStartLoading, makeStopLoading, UpdateState } from 'front-end/lib';
import { makePageMetadata } from 'front-end/lib';
import { isSignedOut } from 'front-end/lib/access-control';
import { Route, SharedState } from 'front-end/lib/app/types';
import { ComponentView, emptyPageAlerts, emptyPageBreadcrumbs, GlobalComponentMsg, noPageModal, PageComponent, PageInit, replaceRoute, replaceUrl, Update } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import { updateField, validateField } from 'front-end/lib/views/form-field/lib';
import * as ShortText from 'front-end/lib/views/form-field/short-text';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import { default as React } from 'react';
import { Col, Row } from 'reactstrap';
import { ADT } from 'shared/lib/types';
import { validateEmail, validatePassword } from 'shared/lib/validators';

export interface State {
  loading: number;
  errors: string[];
  redirectOnSuccess?: string;
  email: ShortText.State;
  password: ShortText.State;
}

type InnerMsg
  = ADT<'onChangeEmail', string>
  | ADT<'onChangePassword', string>
  | ADT<'validateEmail'>
  | ADT<'validatePassword'>
  | ADT<'submit'>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

export interface RouteParams {
  redirectOnSuccess?: string;
};

const initState: State = {
  loading: 0,
  errors: [],
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

const init: PageInit<RouteParams, SharedState, State, Msg> = isSignedOut({

  async success({ routeParams }) {
    const { redirectOnSuccess } = routeParams;
    return {
      ...initState,
      redirectOnSuccess
    }
  },

  async fail({ dispatch }) {
    dispatch(replaceRoute({
      tag: 'requestForInformationList' as 'requestForInformationList',
      value: null
    }));
    return initState;
  }

});

const startLoading: UpdateState<State> = makeStartLoading('loading');
const stopLoading: UpdateState<State> = makeStopLoading('loading');

const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'onChangeEmail':
      state = state.set('errors', []);
      return [updateField(state, 'email', msg.value)];
    case 'onChangePassword':
      state = state.set('errors', []);
      return [updateField(state, 'password', msg.value)];
    case 'validateEmail':
      return [validateField(state, 'email', validateEmail)];
    case 'validatePassword':
      return [validateField(state, 'password', validatePassword)];
    case 'submit':
      state = state.set('errors', []);
      state = startLoading(state);
      return [
        state,
        async (state, dispatch) => {
          const result = await api.createSession({
            email: state.email.value,
            password: state.password.value
          });
          switch (result.tag) {
            case 'valid':
              if (state.redirectOnSuccess) {
                dispatch(replaceUrl(state.redirectOnSuccess));
              } else {
                dispatch(replaceRoute({
                  tag: 'requestForInformationList' as 'requestForInformationList',
                  value: null
                }));
              }
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

const view: ComponentView<State, Msg> = props => {
  const { state, dispatch } = props;
  const onChange = (tag: any) => ShortText.makeOnChange(dispatch, value => ({ tag, value }));
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
            Welcome back to the Concierge. If you don't already have an account,{' '}
            <a href='/sign-up' className='text-primary'>sign up here</a>.
          </p>
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='6' lg='5'>
          <Row>
            <Col xs='12'>
              <ShortText.view
                state={state.email}
                onChange={onChange('onChangeEmail')}
                onChangeDebounced={() => dispatch({ tag: 'validateEmail', value: undefined })}
                onEnter={submit}
                autoFocus />
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
              <Link route={{ tag: 'forgotPassword', value: null }} color='secondary'>Forgotten your password?</Link>
            </Col>
          </Row>
          <Row>
            <Col xs='12'>
              <LoadingButton color='primary' onClick={submit} loading={isLoading} disabled={isDisabled}>
                Sign In
              </LoadingButton>
              <Link route={{ tag: 'landing', value: null }} color='secondary' className='ml-3'>Cancel</Link>
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
    return makePageMetadata('Sign In');
  },
  getBreadcrumbs: emptyPageBreadcrumbs,
  getModal: noPageModal
};
