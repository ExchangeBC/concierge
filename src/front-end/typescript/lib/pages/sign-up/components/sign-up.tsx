import { Page } from 'front-end/lib/app/types';
import { ProfileComponent } from 'front-end/lib/components/profiles/types';
import { Component, ComponentMsg, ComponentView, Dispatch, immutable, Immutable, Init, mapComponentDispatch, Update, updateComponentChild } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import * as AccountInformation from 'front-end/lib/pages/sign-up/components/account-information';
import FixedBar from 'front-end/lib/views/fixed-bar';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import { isArray } from 'lodash';
import { default as React } from 'react';
import { Col, Row } from 'reactstrap';
import { ADT, Profile as ProfileType, UserType, userTypeToTitleCase } from 'shared/lib/types';

export interface State<ProfileState> {
  loading: number;
  fixedBarBottom: number;
  accountInformation: Immutable<AccountInformation.State>;
  profile: Immutable<ProfileState>;
}

type InnerMsg<ProfileMsg>
  = ADT<'accountInformation', AccountInformation.Msg>
  | ADT<'profile', ComponentMsg<ProfileMsg, Page>>
  | ADT<'createAccount'>
  | ADT<'updateFixedBarBottom', number>;

export type Msg<ProfileMsg> = ComponentMsg<InnerMsg<ProfileMsg>, Page>;

export interface Params {
  accountInformation?: Immutable<AccountInformation.State>;
  fixedBarBottom?: number;
}

function init<PS, PM, P extends ProfileType>(Profile: ProfileComponent<PS, PM, P>): Init<Params, State<PS>> {
  return async ({ accountInformation, fixedBarBottom = 0 }) => {
    return {
      loading: 0,
      fixedBarBottom,
      accountInformation: accountInformation || immutable(await AccountInformation.init({
        userType: Profile.userType
      })),
      profile: immutable(await Profile.init({}))
    };
  }
};

function startLoading<PS>(state: Immutable<State<PS>>): Immutable<State<PS>> {
  return state.set('loading', state.loading + 1);
}

function stopLoading<PS>(state: Immutable<State<PS>>): Immutable<State<PS>> {
  return state.set('loading', Math.max(state.loading - 1, 0));
}

export function update<PS, PM, P extends ProfileType>(Profile: ProfileComponent<PS, PM, P>): Update<State<PS>, Msg<PM>> {
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
        state = startLoading(state);
        return [
          state,
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
                // Redirect Program Staff to the created user's profile.
                if (result.value.profile.type === UserType.ProgramStaff) {
                  dispatch({
                    tag: '@newUrl',
                    value: {
                      tag: 'profile',
                      value: {
                        profileUserId: result.value._id
                      }
                    }
                  });
                } else {
                  // All other users who are creating their own accounts,
                  // should be prompted to accept the terms and conditions.
                  dispatch({
                    tag: '@newUrl',
                    value: {
                      tag: 'termsAndConditions',
                      value: { userId: result.value._id }
                    }
                  });
                }
                return state;
              case 'invalid':
                const profileErrors = result.value.profile;
                if (profileErrors && !isArray(profileErrors)) {
                  state = state.set('profile', Profile.setErrors(state.profile, profileErrors));
                }
                return stopLoading(state)
                  .set('accountInformation', AccountInformation.setErrors(state.accountInformation, result.value));
            }
          }
        ];
      case 'updateFixedBarBottom':
        return [state.set('fixedBarBottom', msg.value)];
      default:
        return [state];
    }
  };
};

function isInvalid<PS, PM, P extends ProfileType>(state: State<PS>, Profile: ProfileComponent<PS, PM, P>): boolean {
  return !AccountInformation.isValid(state.accountInformation) || !Profile.isValid(state.profile);
}

function isValid<PS, PM, P extends ProfileType>(state: State<PS>, Profile: ProfileComponent<PS, PM, P>): boolean {
  const info = state.accountInformation;
  const providedRequiredFields = !!(info.email.value && info.password.value && info.confirmPassword.value);
  return providedRequiredFields && !isInvalid(state, Profile);
}

function Subtitle(props: { userType: UserType }) {
  switch (props.userType) {
    case UserType.Buyer:
    case UserType.Vendor:
      return (
        <p>
          Create an account to gain access to all features of the Concierge. Already have an account?{' '}
          <a href='/sign-in'>
            Sign in here.
          </a>
        </p>
      );
    case UserType.ProgramStaff:
      return (
        <p>
          Create another Program Staff account to manage the Concierge.
        </p>
      );
  }
}

function view<PS, PM, P extends ProfileType>(Profile: ProfileComponent<PS, PM, P>): ComponentView<State<PS>, Msg<PM>> {
  return props => {
    const { state, dispatch } = props;
    const dispatchAccountInformation: Dispatch<AccountInformation.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg<PM>>, value => ({ tag: 'accountInformation' as 'accountInformation', value }));
    const dispatchProfile: Dispatch<ComponentMsg<PM, Page>> = mapComponentDispatch(dispatch as Dispatch<Msg<PM>>, value => ({ tag: 'profile' as 'profile', value }));
    const isLoading = state.loading > 0;
    const isDisabled = isLoading || !isValid(state, Profile);
    const createAccount = () => !isDisabled && dispatch({ tag: 'createAccount', value: undefined });
    const isProgramStaff = Profile.userType === UserType.ProgramStaff;
    const cancelPage: Page = isProgramStaff ? { tag: 'userList', value: null } : { tag: 'landing', value: null };
    return (
      <div>
        <Row>
          <Col xs='12'>
            <h1>Create a {userTypeToTitleCase(Profile.userType)} Account</h1>
          </Col>
        </Row>
        <Row>
          <Col xs='12' md='8'>
            <Subtitle userType={Profile.userType} />
          </Col>
        </Row>
        <Row className='mt-3'>
          <Col xs='12' md='4' xl='3'>
            <AccountInformation.view state={state.accountInformation} dispatch={dispatchAccountInformation} />
          </Col>
          <Col md='1' className='vertical-line'></Col>
          <Col xs='12' md='7' xl='8'>
            <Profile.view state={state.profile} dispatch={dispatchProfile} />
          </Col>
        </Row>
        <FixedBar location='bottom' distance={state.fixedBarBottom}>
          <LoadingButton color={isDisabled ? 'secondary' : 'primary'} onClick={createAccount} loading={isLoading} disabled={isDisabled}>
            Create Account
          </LoadingButton>
          <Link page={cancelPage} text='Cancel' textColor='secondary' disabled={isLoading} />
        </FixedBar>
      </div>
    );
  };
};

export function component<PS, PM, P extends ProfileType>(Profile: ProfileComponent<PS, PM, P>): Component<Params, State<PS>, Msg<PM>> {
  return {
    init: init(Profile),
    update: update(Profile),
    view: view(Profile)
  };
};
