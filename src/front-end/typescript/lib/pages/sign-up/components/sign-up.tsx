import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentView, Dispatch, immutable, Immutable, Init, mapComponentDispatch, Update, updateComponentChild, View } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import * as AccountInformation from 'front-end/lib/pages/sign-up/components/account-information';
import { ProfileComponent } from 'front-end/lib/pages/sign-up/types';
import { isArray } from 'lodash';
import { default as React, ReactElement } from 'react';
import { Button, Col, Container, Row, Spinner } from 'reactstrap';
import { ADT } from 'shared/lib/types';

export interface State<ProfileState> {
  loading: number;
  accountInformation: Immutable<AccountInformation.State>;
  profile: Immutable<ProfileState>;
}

type InnerMsg<ProfileMsg>
  = ADT<'accountInformation', AccountInformation.Msg>
  | ADT<'profile', ComponentMsg<ProfileMsg, Page>>
  | ADT<'createAccount'>
  | ADT<'startLoading'>
  | ADT<'stopLoading'>;

export type Msg<ProfileMsg> = ComponentMsg<InnerMsg<ProfileMsg>, Page>;

export type Params = null;

function init<PS, PM>(Profile: ProfileComponent<PS, PM>): Init<Params, State<PS>> {
  return async () => {
    return {
      loading: 0,
      accountInformation: immutable(await AccountInformation.init(null)),
      profile: immutable(await Profile.init(null))
    };
  }
};

export function update<PS, PM>(Profile: ProfileComponent<PS, PM>): Update<State<PS>, Msg<PM>> {
  return (state, msg) => {
    switch (msg.tag) {
      case 'accountInformation':
        return updateComponentChild({
          state,
          mapChildMsg: value => ({ tag: 'accountInformation', value }),
          childStatePath: ['accountInformation'],
          childUpdate: AccountInformation.update,
          childMsg: msg.value
        });
      case 'profile':
        return updateComponentChild({
          state,
          mapChildMsg: (value: PM) => ({ tag: 'profile', value }),
          childStatePath: ['profile'],
          childUpdate: Profile.update,
          childMsg: msg.value
        });
      case 'createAccount':
        return [
          update(Profile)(state, { tag: 'startLoading', value: undefined })[0],
          async dispatch => {
            const { email, password } = AccountInformation.getValues(state.accountInformation);
            const user = {
              email,
              password,
              acceptedTerms: false,
              profile: Profile.getValues(state.profile)
            };
            const result = await api.createUser(user);
            switch (result.tag) {
              case 'valid':
                dispatch({ tag:
                  '@newUrl',
                  value: { tag: 'say', value: { message: 'Sign Up Successful' }}
                });
                return state;
              case 'invalid':
                const profileErrors = result.value.profile;
                if (profileErrors && !isArray(profileErrors)) {
                  state = state.set('profile', Profile.setErrors(state.profile, profileErrors));
                }
                return state
                  .set('accountInformation', AccountInformation.setErrors(state.accountInformation, result.value));
            }
          }
        ];
      case 'startLoading':
        return [state.set('loading', state.loading + 1)];
      case 'stopLoading':
        return [state.set('loading', Math.max(state.loading - 1, 0))];
      default:
        return [state];
    }
  };
};

function isInvalid<PS, PM>(state: State<PS>, Profile: ProfileComponent<PS, PM>): boolean {
  return !AccountInformation.isValid(state.accountInformation) || !Profile.isValid(state.profile);
}

function isValid<PS, PM>(state: State<PS>, Profile: ProfileComponent<PS, PM>): boolean {
  const info = state.accountInformation;
  const providedRequiredFields = !!(info.email.value && info.password.value && info.confirmPassword.value);
  return providedRequiredFields && !isInvalid(state, Profile);
}

const CreateAccountChild: View<{ isLoading: boolean }> = ({ isLoading }) => {
  if (isLoading) {
    return (<Spinner color='light' size='sm' />);
  } else {
    return (<div>Create Account</div>);
  }
};

export const Buttons: View<{ children: Array<ReactElement<any>> }> = ({ children }) => {
  return (
    <div className='fixed-bottom bg-light py-3 border-top'>
      <Container>
        <Row>
          <Col xs='12' className='d-flex justify-content-xs-center justify-content-md-end align-items-center'>
            {children}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

function view<PS, PM>(Profile: ProfileComponent<PS, PM>): ComponentView<State<PS>, Msg<PM>> {
  return props => {
    const { state, dispatch } = props;
    const dispatchAccountInformation: Dispatch<AccountInformation.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg<PM>>, value => ({ tag: 'accountInformation' as 'accountInformation', value }));
    const dispatchProfile: Dispatch<ComponentMsg<PM, Page>> = mapComponentDispatch(dispatch as Dispatch<Msg<PM>>, value => ({ tag: 'profile' as 'profile', value }));
    const createAccount = () => dispatch({ tag: 'createAccount', value: undefined });
    const isLoading = state.loading > 0;
    const isDisabled = isLoading || !isValid(state, Profile);
    return (
      <div>
        <Row>
          <Col xs='12'>
            <h1>Create an Account</h1>
          </Col>
        </Row>
        <Row>
          <Col xs='12' md='8'>
            <p>
              Create an account to gain access to all features of the Concierge Web Application.
              <br className='d-none d-md-block' />
              <span className='pl-1 pl-md-0'>Already have an account?</span>
              <a href='/sign-in' className='ml-1'>
                Sign in here.
              </a>
            </p>
          </Col>
        </Row>
        <Row className='mt-3'>
          <Col xs='12' md='4'>
            <AccountInformation.view state={state.accountInformation} dispatch={dispatchAccountInformation} />
          </Col>
          <Col md='1' className='vertical-line'></Col>
          <Col xs='12' md='7'>
            <Profile.view state={state.profile} dispatch={dispatchProfile} />
          </Col>
        </Row>
        <Buttons>
          <a href='/' className='mr-3'>
            <Button color='secondary' disabled={isLoading}>Cancel</Button>
          </a>
          <Button color='primary' onClick={createAccount} disabled={isDisabled}>
            <CreateAccountChild isLoading={isLoading} />
          </Button>
        </Buttons>
      </div>
    );
  };
};

export function component<PS, PM>(Profile: ProfileComponent<PS, PM>): Component<Params, State<PS>, Msg<PM>> {
  return {
    init: init(Profile),
    update: update(Profile),
    view: view(Profile)
  };
};
