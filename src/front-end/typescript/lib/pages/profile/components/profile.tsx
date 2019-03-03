import { Page } from 'front-end/lib/app/types';
import { ProfileComponent, ProfileViewerMode } from 'front-end/lib/components/profiles/types';
import { Component, ComponentMsg, ComponentView, immutable, Immutable, Init, newUrl, Update, updateComponentChild } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import * as ShortText from 'front-end/lib/views/input/short-text';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
// import { isArray } from 'lodash';
import { default as React } from 'react';
import { Col, Row } from 'reactstrap';
import { formatTermsAndConditionsAgreementDate } from 'shared/lib';
import { PublicUser } from 'shared/lib/resources/user';
import { ADT, UserType } from 'shared/lib/types';

export interface State<ProfileState> {
  deactivateLoading: number;
  email: ShortText.State;
  profile: Immutable<ProfileState>;
  mode: ProfileViewerMode;
  viewerIsProgramStaff: boolean;
  showEmail: boolean;
  showChangePassword: boolean;
  showTermsAndConditions: boolean;
  showDeactivateAccount: boolean;
  isProfileEditable: boolean;
  isEditingProfile: boolean;
  promptDeactivationConfirmation: boolean;
  profileUser: PublicUser;
}

type InnerMsg<ProfileMsg>
  = ADT<'changeEmail', string>
  | ADT<'changeProfile', ComponentMsg<ProfileMsg, Page>>
  | ADT<'deactivateAccount'>
  | ADT<'cancelDeactivateAccount'>
  | ADT<'startEditingProfile'>
  | ADT<'stopEditingProfile'>
  | ADT<'saveProfile'>;

export type Msg<ProfileMsg> = ComponentMsg<InnerMsg<ProfileMsg>, Page>;

export interface Params<Profile> {
  profileUser: PublicUser;
  mode: ProfileViewerMode;
  viewerIsProgramStaff: boolean;
  profile: Profile;
}

function init<PS, PM, P>(Profile: ProfileComponent<PS, PM, P>): Init<Params<P>, State<PS>> {
  return async params => {
    // TODO clean up by simply passing profile and viewer users to this init function.
    const { profileUser, mode, viewerIsProgramStaff } = params;
    const profileUserIsProgramStaff = profileUser.profile.type === UserType.ProgramStaff;
    return {
      deactivateLoading: 0,
      email: ShortText.init({
        id: 'profile-email',
        required: true,
        type: 'email',
        label: 'Account Email Address',
        placeholder: 'Account Email Address'
      }),
      profile: immutable(await Profile.init({
        profile: params.profile,
        disabled: true
      })),
      profileUser,
      mode,
      viewerIsProgramStaff,
      showEmail: mode === 'owner' || viewerIsProgramStaff,
      showChangePassword: mode === 'owner',
      showTermsAndConditions: mode === 'owner' || viewerIsProgramStaff,
      showDeactivateAccount: (mode === 'owner' && !profileUserIsProgramStaff) || (viewerIsProgramStaff && profileUserIsProgramStaff && mode !== 'owner'),
      isProfileEditable: mode === 'owner',
      isEditingProfile: false,
      promptDeactivationConfirmation: false
    };
  }
};

function startDeactivateLoading<PS>(state: Immutable<State<PS>>): Immutable<State<PS>> {
  return state.set('deactivateLoading', state.deactivateLoading + 1);
}

function stopDeactivateLoading<PS>(state: Immutable<State<PS>>): Immutable<State<PS>> {
  return state.set('deactivateLoading', Math.max(state.deactivateLoading - 1, 0));
}

export function update<PS, PM, P>(Profile: ProfileComponent<PS, PM, P>): Update<State<PS>, Msg<PM>> {
  return (state, msg) => {
    switch (msg.tag) {
      case 'changeEmail':
        return [state];
      case 'changeProfile':
        return updateComponentChild({
          state,
          mapChildMsg: (value: PM) => ({ tag: 'changeProfile', value }),
          childStatePath: ['profile'],
          childUpdate: Profile.update,
          childMsg: msg.value
        });
      case 'deactivateAccount':
        if (!state.promptDeactivationConfirmation) {
          return [state.set('promptDeactivationConfirmation', true)];
        }
        state = startDeactivateLoading(state)
          .set('promptDeactivationConfirmation', false);
        return [
          state,
          async dispatch => {
            const result = await api.deleteUser(state.profileUser._id);
            switch (result.tag) {
              case 'valid':
                dispatch(newUrl({
                  tag: 'landing' as 'landing',
                  value: null
                }));
                return stopDeactivateLoading(state);
              case 'invalid':
                // TODO show errors
                return stopDeactivateLoading(state);
            }
          }
        ];
      case 'cancelDeactivateAccount':
        return [state.set('promptDeactivationConfirmation', false)];
      case 'startEditingProfile':
        return [state];
      case 'stopEditingProfile':
        return [state];
      case 'saveProfile':
        return [state];
      default:
        return [state];
    }
  };
};

/*function conditionalEmail<PS, PM, P>(Profile: ProfileComponent<PS, PM, P>): ComponentView<State<PS>, Msg<PM>> {
  return props => {
    return null;
  };
}*/

function conditionalProfile<PS, PM, P>(Profile: ProfileComponent<PS, PM, P>): ComponentView<State<PS>, Msg<PM>> {
  // const ConditionalEmail = conditionalEmail(Profile);
  return ({ dispatch }) => {
    // const dispatchProfile: Dispatch<ComponentMsg<PM, Page>> = mapComponentDispatch(dispatch as Dispatch<Msg<PM>>, value => ({ tag: 'profile' as 'profile', value }));
    // const saveProfile = () => dispatch({ tag: 'saveProfile', value: undefined });
    return null;
  };
}

function conditionalChangePassword<PS, PM, P>(Profile: ProfileComponent<PS, PM, P>): ComponentView<State<PS>, Msg<PM>> {
  return ({ state }) => {
    if (!state.showChangePassword) {
      return null;
    }
    return (
      <div className='py-5 border-top'>
        <Row>
          <Col xs='12'>
            <h3>Change Password</h3>
          </Col>
        </Row>
        <Row>
          <Col xs='12'>
            <p>Click the button below to change your password.</p>
          </Col>
        </Row>
        <Row>
          <Col xs='12'>
            <Link page={{ tag: 'changePassword', value: { userId: state.profileUser._id } }} buttonColor='secondary' text='Change Password' />
          </Col>
        </Row>
      </div>
    );
  };
}

function conditionalTermsAndConditions<PS, PM, P>(Profile: ProfileComponent<PS, PM, P>): ComponentView<State<PS>, Msg<PM>> {
  return ({ state }) => {
    if (!state.showTermsAndConditions) {
      return null;
    }
    let conditionalLink = null;
    if (state.mode === 'owner') {
      conditionalLink = (
        <Row>
          <Col xs='12'>
            <Link
              page={{ tag: 'termsAndConditions', value: { userId: state.profileUser._id } }}
              textColor='secondary'
              text="Review the Concierge's Terms & Conditions"
              buttonClassName='p-0' />
          </Col>
        </Row>
      );
    }
    return (
      <div className='py-5 border-top'>
        <Row>
          <Col xs='12'>
            <h3>Terms & Conditions</h3>
          </Col>
        </Row>
        <Row>
          <Col xs='12'>
            <p>{formatTermsAndConditionsAgreementDate(state.profileUser.acceptedTermsAt)}</p>
          </Col>
        </Row>
        {conditionalLink}
      </div>
    );
  };
}

function conditionalDeactivateAccount<PS, PM, P>(Profile: ProfileComponent<PS, PM, P>): ComponentView<State<PS>, Msg<PM>> {
  return ({ state, dispatch }) => {
    if (!state.showDeactivateAccount) {
      return null;
    }
    const showPrompt = state.promptDeactivationConfirmation;
    const isLoading = state.deactivateLoading > 0;
    const deactivateAccount = () => dispatch({ tag: 'deactivateAccount', value: undefined });
    const cancelDeactivateAccount = () => dispatch({ tag: 'cancelDeactivateAccount', value: undefined });
    return (
      <div className='pt-5 border-top'>
        <Row>
          <Col xs='12'>
            <h3>Deactivate Account</h3>
          </Col>
        </Row>
        <Row>
          <Col xs='12'>
            <p>Deactivating your account means that you will no longer be able to access the Concierge.</p>
          </Col>
        </Row>
        <Row>
          <Col xs='12'>
            <LoadingButton onClick={deactivateAccount} color={showPrompt ? 'danger' : 'secondary'} loading={isLoading} disabled={isLoading}>
              {showPrompt ? 'Click Again to Confirm' : 'Deactivate Account'}
            </LoadingButton>
            {showPrompt ? (<Link onClick={cancelDeactivateAccount} text='Cancel' textColor='secondary' />) : null}
          </Col>
        </Row>
      </div>
    );
  };
}

function view<PS, PM, P>(Profile: ProfileComponent<PS, PM, P>): ComponentView<State<PS>, Msg<PM>> {
  const ConditionalProfile = conditionalProfile(Profile);
  const ConditionalChangePassword = conditionalChangePassword(Profile);
  const ConditionalTermsAndConditions = conditionalTermsAndConditions(Profile);
  const ConditionalDeactivateAccount = conditionalDeactivateAccount(Profile);
  return props => {
    const { state } = props;
    const name = Profile.getName(state.profile);
    return (
      <div>
        <Row className='mb-5'>
          <Col xs='12'>
            <h1>{name ? `${name}'s Profile` : 'Profile'}</h1>
          </Col>
        </Row>
        <ConditionalProfile {...props} />
        <ConditionalChangePassword {...props} />
        <ConditionalTermsAndConditions {...props} />
        <ConditionalDeactivateAccount {...props} />
      </div>
    );
  };
};

export function component<PS, PM, P>(Profile: ProfileComponent<PS, PM, P>): Component<Params<P>, State<PS>, Msg<PM>> {
  return {
    init: init(Profile),
    update: update(Profile),
    view: view(Profile)
  };
};
