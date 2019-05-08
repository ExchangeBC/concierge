import { makePageMetadata } from 'front-end/lib';
import { isSignedOut } from 'front-end/lib/access-control';
import { Route, SharedState } from 'front-end/lib/app/types';
import { ComponentView, emptyPageAlerts, GlobalComponentMsg, Immutable, newRoute, PageComponent, PageInit, replaceRoute, Update } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import { updateField, validateField } from 'front-end/lib/views/form-field';
import * as ShortText from 'front-end/lib/views/input/short-text';
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
  = ADT<'onChangeEmail', string>
  | ADT<'validateEmail'>
  | ADT<'submit'>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

export type RouteParams = null;

const initState: State = {
  loading: 0,
  email: ShortText.init({
    id: 'forgot-password-email',
    required: true,
    type: 'email',
    label: 'Email',
    placeholder: 'Email'
  })
};

const init: PageInit<RouteParams, SharedState, State, Msg> = isSignedOut({

  async success() {
    return initState;
  },

  async fail({ dispatch }) {
    dispatch(replaceRoute({
      tag: 'requestForInformationList' as 'requestForInformationList',
      value: null
    }));
    return initState;
  }

});

function startLoading(state: Immutable<State>): Immutable<State> {
  return state.set('loading', state.loading + 1);
}

function stopLoading(state: Immutable<State>): Immutable<State> {
  return state.set('loading', Math.max(state.loading - 1, 0));
}

const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'onChangeEmail':
      return [updateField(state, 'email', msg.value)];
    case 'validateEmail':
      return [validateField(state, 'email', validateEmail)];
    case 'submit':
      state = startLoading(state);
      return [
        state,
        async (state, dispatch) => {
          await api.createForgotPasswordToken({ email: state.email.value });
          // Always redirect user to the confirmation page,
          // so we don't give away any information about which users
          // have accounts and which ones don't.
          dispatch(newRoute({
            tag: 'notice' as 'notice',
            value: {
              noticeId: {
                tag: 'forgotPassword' as 'forgotPassword',
                value: undefined
              }
            }
          }));
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
                onChange={onChange('onChangeEmail')}
                onChangeDebounced={() => dispatch({ tag: 'validateEmail', value: undefined })}
                onEnter={submit} />
            </Col>
          </Row>
          <Row>
            <Col xs='12'>
              <LoadingButton color='primary' onClick={submit} loading={isLoading} disabled={isDisabled}>
                Reset Password
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
  getMetadata() {
    return makePageMetadata('Forgotten your Password?');
  },
  getAlerts: emptyPageAlerts
};
