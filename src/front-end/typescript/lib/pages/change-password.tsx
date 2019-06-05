import { makePageMetadata } from 'front-end/lib';
import { isSignedIn } from 'front-end/lib/access-control';
import router from 'front-end/lib/app/router';
import { Route, SharedState } from 'front-end/lib/app/types';
import { ComponentView, emptyPageAlerts, emptyPageBreadcrumbs, GlobalComponentMsg, Immutable, newRoute, noPageModal, PageComponent, PageInit, replaceRoute, Update } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import { validateConfirmPassword } from 'front-end/lib/validators';
import { updateField, validateField } from 'front-end/lib/views/form-field/lib';
import * as ShortText from 'front-end/lib/views/form-field/short-text';
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
  = ADT<'onChangeCurrentPassword', string>
  | ADT<'onChangeNewPassword', string>
  | ADT<'onChangeConfirmNewPassword', string>
  | ADT<'validateCurrentPassword'>
  | ADT<'validateNewPassword'>
  | ADT<'validateConfirmNewPassword'>
  | ADT<'submit'>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

export type RouteParams = null;

const initState: State = {
  loading: 0,
  userId: '',
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

const init: PageInit<RouteParams, SharedState, State, Msg> = isSignedIn({

  async success({ shared }) {
    return {
      ...initState,
      userId: shared.sessionUser.id
    };
  },

  async fail({ routeParams, dispatch }) {
    dispatch(replaceRoute({
      tag: 'signIn' as 'signIn',
      value: {
        redirectOnSuccess: router.routeToUrl({
          tag: 'changePassword',
          value: routeParams
        })
      }
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
    case 'onChangeCurrentPassword':
      return [updateField(state, 'currentPassword', msg.value)];
    case 'onChangeNewPassword':
      return [updateField(state, 'newPassword', msg.value)];
    case 'onChangeConfirmNewPassword':
      return [updateField(state, 'confirmNewPassword', msg.value)];
    case 'validateCurrentPassword':
      return [validateField(state, 'currentPassword', validatePassword)];
    case 'validateNewPassword':
      return [validateField(state, 'newPassword', validatePassword)];
    case 'validateConfirmNewPassword':
      return [validateField(state, 'confirmNewPassword', v => validateConfirmPassword(state.newPassword.value, v))];
    case 'submit':
      state = startLoading(state);
      return [
        state,
        async (state, dispatch) => {
          const result = await api.updateUser({
            id: state.userId,
            currentPassword: state.currentPassword.value,
            newPassword: state.newPassword.value
          });
          switch (result.tag) {
            case 'valid':
              dispatch(newRoute({
                tag: 'notice' as 'notice',
                value: {
                  noticeId: {
                    tag: 'changePassword' as 'changePassword',
                    value: undefined
                  }
                }
              }));
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

const view: ComponentView<State, Msg> = props => {
  const { state, dispatch } = props;
  const onChange = (tag: any) => ShortText.makeOnChange(dispatch, value => ({ tag, value }));
  const isLoading = state.loading > 0;
  const isDisabled = isLoading || !isValid(state);
  const submit = () => !isDisabled && dispatch({ tag: 'submit', value: undefined });
  return (
    <div>
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
                onChange={onChange('onChangeCurrentPassword')}
                onChangeDebounced={() => dispatch({ tag: 'validateCurrentPassword', value: undefined })}
                onEnter={submit}
                autoFocus />
            </Col>
          </Row>
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
                Update Password
              </LoadingButton>
              <Link route={{ tag: 'userView', value: { profileUserId: state.userId } }} color='secondary' className='ml-3'>Cancel</Link>
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
    return makePageMetadata('Change your Password')
  },
  getAlerts: emptyPageAlerts,
  getBreadcrumbs: emptyPageBreadcrumbs,
  getModal: noPageModal
};
