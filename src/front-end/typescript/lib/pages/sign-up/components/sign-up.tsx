import { makePageMetadata } from 'front-end/lib';
import { AccessControlParams, isSignedOut, isUserType, SharedStateWithGuaranteedSessionUser } from 'front-end/lib/access-control';
import router from 'front-end/lib/app/router';
import { Route, SharedState } from 'front-end/lib/app/types';
import { ProfileComponent } from 'front-end/lib/components/profiles/types';
import { ComponentView, Dispatch, emptyPageAlerts, GlobalComponentMsg, immutable, Immutable, mapComponentDispatch, newRoute, PageComponent, PageInit, replaceRoute, Update, updateComponentChild } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import * as AccountInformation from 'front-end/lib/pages/sign-up/components/account-information';
import FixedBar from 'front-end/lib/views/layout/fixed-bar';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import { isArray } from 'lodash';
import { default as React } from 'react';
import { Col, Row } from 'reactstrap';
import { ADT, Profile as ProfileType, UserType, userTypeToTitleCase } from 'shared/lib/types';

export interface State<ProfileState> {
  loading: number;
  accountInformation: Immutable<AccountInformation.State>;
  profile: Immutable<ProfileState>;
}

type InnerMsg<ProfileMsg>
  = ADT<'accountInformation', AccountInformation.Msg>
  | ADT<'profile', ProfileMsg>
  | ADT<'createAccount'>;

export type Msg<ProfileMsg> = GlobalComponentMsg<InnerMsg<ProfileMsg>, Route>;

export interface RouteParams {
  accountInformation?: Immutable<AccountInformation.State>;
}

const rfiListRoute: Route = {
  tag: 'requestForInformationList' as 'requestForInformationList',
  value: null
};

function init<PS, PM, P extends ProfileType>(Profile: ProfileComponent<PS, PM, P>): PageInit<RouteParams, SharedState, State<PS>, Msg<PM>> {

  async function makeInitState(): Promise<State<PS>> {
    return {
      loading: 0,
      accountInformation: immutable(await AccountInformation.init({
        userType: Profile.userType
      })),
      profile: immutable(await Profile.init({}))
    };
  }

  const accessControlParams: AccessControlParams<RouteParams, State<PS>, Msg<PM>, SharedStateWithGuaranteedSessionUser | SharedState> = {

    async success({ routeParams }) {
      const { accountInformation } = routeParams;
      const initState = await makeInitState();
      return {
        ...initState,
        accountInformation: accountInformation || initState.accountInformation
      };
    },

    async fail({ dispatch }) {
      dispatch(replaceRoute(rfiListRoute));
      return await makeInitState();
    }

  };

  if (Profile.userType === UserType.ProgramStaff) {
    return isUserType({
      ...accessControlParams,
      userTypes: [UserType.ProgramStaff],
      async fail({ routeParams, dispatch }) {
        dispatch(replaceRoute({
          tag: 'signIn' as 'signIn',
          value: {
            redirectOnSuccess: router.routeToUrl({
              tag: 'signUpProgramStaff',
              value: routeParams
            })
          }
        }));
        return await makeInitState();
      }
    });
  } else {
    return isSignedOut(accessControlParams);
  }
};

function startLoading<PS>(state: Immutable<State<PS>>): Immutable<State<PS>> {
  return state.set('loading', state.loading + 1);
}

function stopLoading<PS>(state: Immutable<State<PS>>): Immutable<State<PS>> {
  return state.set('loading', Math.max(state.loading - 1, 0));
}

export function update<PS, PM, P extends ProfileType>(Profile: ProfileComponent<PS, PM, P>): Update<State<PS>, Msg<PM>> {
  return ({ state, msg }) => {
    switch (msg.tag) {
      case 'accountInformation':
        return updateComponentChild({
          state,
          mapChildMsg: value => ({ tag: 'accountInformation' as 'accountInformation', value }),
          childStatePath: ['accountInformation'],
          childUpdate: AccountInformation.update,
          childMsg: msg.value
        });
      case 'profile':
        return updateComponentChild({
          state,
          mapChildMsg: (value: PM) => ({ tag: 'profile' as 'profile', value }),
          childStatePath: ['profile'],
          childUpdate: Profile.update,
          childMsg: msg.value
        });
      case 'createAccount':
        state = startLoading(state);
        return [
          state,
          async (state, dispatch) => {
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
                  dispatch(newRoute({
                    tag: 'profile' as 'profile',
                    value: {
                      profileUserId: result.value._id
                    }
                  }));
                } else {
                  // All other users who are creating their own accounts,
                  // should be prompted to accept the terms and conditions.
                  const rfiListUrl = router.routeToUrl(rfiListRoute);
                  dispatch(newRoute({
                    tag: 'termsAndConditions' as 'termsAndConditions',
                    value: {
                      redirectOnAccept: rfiListUrl,
                      redirectOnSkip: rfiListUrl
                    }
                  }));
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

function viewBottomBar<PS, PM, P extends ProfileType>(Profile: ProfileComponent<PS, PM, P>): ComponentView<State<PS>, Msg<PM>> {
  return ({ state, dispatch }) => {
    const isLoading = state.loading > 0;
    const isDisabled = isLoading || !isValid(state, Profile);
    const isProgramStaff = Profile.userType === UserType.ProgramStaff;
    const createAccount = () => !isDisabled && dispatch({ tag: 'createAccount', value: undefined });
    const cancelRoute: Route = isProgramStaff ? { tag: 'userList' as 'userList', value: null } : { tag: 'landing' as 'landing', value: null };
    return (
      <FixedBar>
        <LoadingButton color='primary' onClick={createAccount} loading={isLoading} disabled={isDisabled}>
          Create Account
        </LoadingButton>
        <Link route={cancelRoute} color='secondary' disabled={isLoading} className='mx-3'>Cancel</Link>
      </FixedBar>
    );
  };
}

function view<PS, PM, P extends ProfileType>(Profile: ProfileComponent<PS, PM, P>): ComponentView<State<PS>, Msg<PM>> {
  return ({ state, dispatch }) => {
    const dispatchAccountInformation: Dispatch<AccountInformation.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg<PM>>, value => ({ tag: 'accountInformation' as 'accountInformation', value }));
    const dispatchProfile: Dispatch<PM> = mapComponentDispatch(dispatch as Dispatch<Msg<PM>>, value => ({ tag: 'profile' as 'profile', value }));
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
        <Row className='mt-3 no-gutters'>
          <Col xs='12' md='4'>
            <AccountInformation.view state={state.accountInformation} dispatch={dispatchAccountInformation} />
          </Col>
          <Col md='1' className='vertical-line'></Col>
          <Col xs='12' md='7'>
            <Profile.view state={state.profile} dispatch={dispatchProfile} />
          </Col>
        </Row>
      </div>
    );
  };
};

export function component<PS, PM, P extends ProfileType>(Profile: ProfileComponent<PS, PM, P>): PageComponent<RouteParams, SharedState, State<PS>, Msg<PM>> {
  return {
    init: init(Profile),
    update: update(Profile),
    view: view(Profile),
    viewBottomBar: viewBottomBar(Profile),
    getAlerts: emptyPageAlerts,
    getMetadata() {
      return makePageMetadata(`Create a ${userTypeToTitleCase(Profile.userType)} Account`);
    }
  };
};
