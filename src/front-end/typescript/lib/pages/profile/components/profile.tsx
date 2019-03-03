import { Page } from 'front-end/lib/app/types';
import { ProfileComponent, ViewerUser } from 'front-end/lib/components/profiles/types';
import { Component, ComponentMsg, ComponentView, Dispatch, immutable, Immutable, Init, mapComponentDispatch, newUrl, Update, updateComponentChild } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import { validateAndUpdateField } from 'front-end/lib/views/form-field';
import * as ShortText from 'front-end/lib/views/input/short-text';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import { default as React } from 'react';
import { Col, Row } from 'reactstrap';
import { formatTermsAndConditionsAgreementDate } from 'shared/lib';
import { PublicUser } from 'shared/lib/resources/user';
import { ADT, Profile as ProfileType, UserType } from 'shared/lib/types';
import { validateEmail } from 'shared/lib/validators';

export interface State<ProfileState> {
  deactivateLoading: number;
  profileUser: PublicUser;
  viewerUser?: ViewerUser;
  email: ShortText.State;
  profile: Immutable<ProfileState>;
  showEmail: boolean;
  showChangePassword: boolean;
  showTermsAndConditions: boolean;
  showReviewTermsAndConditionsLink: boolean;
  showDeactivateAccount: boolean;
  isProfileEditable: boolean;
  isEditingProfile: boolean;
  promptDeactivationConfirmation: boolean;
}

type InnerMsg<ProfileMsg>
  = ADT<'onChangeEmail', string>
  | ADT<'onChangeProfile', ComponentMsg<ProfileMsg, Page>>
  | ADT<'deactivateAccount'>
  | ADT<'cancelDeactivateAccount'>
  | ADT<'startEditingProfile'>
  | ADT<'cancelEditingProfile'>
  | ADT<'saveProfile'>;

export type Msg<ProfileMsg> = ComponentMsg<InnerMsg<ProfileMsg>, Page>;

export interface Params {
  profileUser: PublicUser;
  viewerUser?: ViewerUser;
}

function init<PS, PM, P extends ProfileType>(Profile: ProfileComponent<PS, PM, P>): Init<Params, State<PS>> {
  return async params => {
    const { profileUser, viewerUser } = params;
    const profileUserIsProgramStaff = profileUser.profile.type === UserType.ProgramStaff;
    const viewerUserIsProgramStaff = !!viewerUser && viewerUser.type === UserType.ProgramStaff;
    const viewerUserIsOwner = !!viewerUser && viewerUser.id === profileUser._id;
    return {
      deactivateLoading: 0,
      profileUser,
      viewerUser,
      email: ShortText.init({
        id: 'profile-email',
        required: true,
        type: 'email',
        label: 'Account Email Address',
        placeholder: 'Account Email Address',
        value: profileUser.email
      }),
      profile: immutable(await Profile.init({
        profile: profileUser.profile as P,
        disabled: true
      })),
      showEmail: viewerUserIsOwner || viewerUserIsProgramStaff,
      showChangePassword: viewerUserIsOwner,
      showTermsAndConditions: viewerUserIsOwner || viewerUserIsProgramStaff,
      showReviewTermsAndConditionsLink: viewerUserIsOwner,
      showDeactivateAccount: (viewerUserIsOwner && !profileUserIsProgramStaff) || (viewerUserIsProgramStaff && profileUserIsProgramStaff && !viewerUserIsOwner),
      isProfileEditable: viewerUserIsOwner,
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

export function update<PS, PM, P extends ProfileType>(Profile: ProfileComponent<PS, PM, P>): Update<State<PS>, Msg<PM>> {
  return (state, msg) => {
    switch (msg.tag) {
      case 'onChangeEmail':
        return [validateAndUpdateField(state, 'email', msg.value, validateEmail)];
      case 'onChangeProfile':
        return updateComponentChild({
          state,
          mapChildMsg: (value: PM) => ({ tag: 'onChangeProfile', value }),
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
        state = state
          .set('isEditingProfile', true)
          .setIn(['profile', 'disabled'], false);
        return [state];
      case 'cancelEditingProfile':
        state = state.set('isEditingProfile', false)
        return [
          state,
          async () => {
            return state
              .setIn(['email', 'value'], state.profileUser.email)
              .set('profile', immutable(await Profile.init({
                profile: state.profileUser.profile as P,
                disabled: true
              })));
          }
        ];
      case 'saveProfile':
        return [state];
      default:
        return [state];
    }
  };
};

function conditionalEmail<PS, PM, P extends ProfileType>(Profile: ProfileComponent<PS, PM, P>): ComponentView<State<PS>, Msg<PM>> {
  return props => {
    const { state, dispatch } = props;
    if (!state.showEmail) {
      return null;
    }
    const onChangeEmail = ShortText.makeOnChange(dispatch, e => ({ tag: 'onChangeEmail' as 'onChangeEmail', value: e.currentTarget.value }));
    const isDisabled = !state.isEditingProfile;
    return (
      <Row className='mb-md-3'>
        <Col xs='12' md='5'>
          <ShortText.view
            state={state.email}
            disabled={isDisabled}
            onChange={onChangeEmail} />
        </Col>
      </Row>
    );
  };
}

function conditionalTopProfileButtons<PS, PM, P extends ProfileType>(Profile: ProfileComponent<PS, PM, P>): ComponentView<State<PS>, Msg<PM>> {
  return props => {
    const { state, dispatch } = props;
    if (!state.isProfileEditable) {
      return null;
    }
    const startEditingProfile = () => !state.isEditingProfile && dispatch({ tag: 'startEditingProfile', value: undefined });
    const cancelEditingProfile = () => state.isEditingProfile && dispatch({ tag: 'cancelEditingProfile', value: undefined });
    const saveProfile = () => state.isEditingProfile && dispatch({ tag: 'saveProfile', value: undefined });
    if (!state.isEditingProfile) {
      return (
        <div className='d-flex pl-3'>
          <Link buttonColor='secondary' buttonSize='sm' text='Edit Profile' onClick={startEditingProfile} />
        </div>
      );
    } else {
      return (
        <div className='d-flex pl-3'>
          <Link buttonColor='primary' buttonSize='sm' text='Save Changes' onClick={saveProfile} />
          <Link textColor='secondary' buttonSize='sm' text='Cancel' onClick={cancelEditingProfile} />
        </div>
      );
    }
  };
}

function conditionalBottomProfileButtons<PS, PM, P extends ProfileType>(Profile: ProfileComponent<PS, PM, P>): ComponentView<State<PS>, Msg<PM>> {
  return props => {
    const { state, dispatch } = props;
    if (!state.isProfileEditable || !state.isEditingProfile) {
      return null;
    }
    const cancelEditingProfile = () => state.isEditingProfile && dispatch({ tag: 'cancelEditingProfile', value: undefined });
    const saveProfile = () => state.isEditingProfile && dispatch({ tag: 'saveProfile', value: undefined });
    return (
      <Row className='mt-4'>
        <Col xs='12'>
          <Link buttonColor='primary' text='Save Changes' onClick={saveProfile} />
          <Link textColor='secondary' text='Cancel' onClick={cancelEditingProfile} />
        </Col>
      </Row>
    );
  };
}

function conditionalProfile<PS, PM, P extends ProfileType>(Profile: ProfileComponent<PS, PM, P>): ComponentView<State<PS>, Msg<PM>> {
  const ConditionalEmail = conditionalEmail(Profile);
  const ConditionalTopProfileButtons = conditionalTopProfileButtons(Profile);
  const ConditionalBottomProfileButtons = conditionalBottomProfileButtons(Profile);
  return props => {
    const { state, dispatch } = props;
    const dispatchProfile: Dispatch<ComponentMsg<PM, Page>> = mapComponentDispatch(dispatch as Dispatch<Msg<PM>>, value => ({ tag: 'onChangeProfile' as 'onChangeProfile', value }));
    return (
      <div className='pb-5'>
        <Row className='mb-4'>
          <Col xs='12' className='d-flex align-items-center'>
            <h2 className='mb-0'>Profile</h2>
            <ConditionalTopProfileButtons {...props} />
          </Col>
        </Row>
        <Row>
          <Col xs='12' md='9' lg='8' xl='7'>
            <ConditionalEmail {...props} />
            <Profile.view state={state.profile} dispatch={dispatchProfile} />
            <ConditionalBottomProfileButtons {...props} />
          </Col>
        </Row>
      </div>
    );
  };
}

function conditionalChangePassword<PS, PM, P extends ProfileType>(Profile: ProfileComponent<PS, PM, P>): ComponentView<State<PS>, Msg<PM>> {
  return ({ state }) => {
    if (!state.showChangePassword) {
      return null;
    }
    return (
      <div className='py-5 border-top'>
        <Row>
          <Col xs='12'>
            <h2>Change Password</h2>
          </Col>
        </Row>
        <Row className='mb-3'>
          <Col xs='12'>
            Click the button below to change your password.
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

function conditionalTermsAndConditions<PS, PM, P extends ProfileType>(Profile: ProfileComponent<PS, PM, P>): ComponentView<State<PS>, Msg<PM>> {
  return ({ state }) => {
    if (!state.showTermsAndConditions) {
      return null;
    }
    let conditionalLink = null;
    if (state.showReviewTermsAndConditionsLink) {
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
            <h2>Terms & Conditions</h2>
          </Col>
        </Row>
        <Row className='mb-3'>
          <Col xs='12'>
            {formatTermsAndConditionsAgreementDate(state.profileUser.acceptedTermsAt)}
          </Col>
        </Row>
        {conditionalLink}
      </div>
    );
  };
}

function conditionalDeactivateAccount<PS, PM, P extends ProfileType>(Profile: ProfileComponent<PS, PM, P>): ComponentView<State<PS>, Msg<PM>> {
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
            <h2>Deactivate Account</h2>
          </Col>
        </Row>
        <Row className='mb-3'>
          <Col xs='12'>
            Deactivating your account means that you will no longer be able to access the Concierge.
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

function view<PS, PM, P extends ProfileType>(Profile: ProfileComponent<PS, PM, P>): ComponentView<State<PS>, Msg<PM>> {
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

export function component<PS, PM, P extends ProfileType>(Profile: ProfileComponent<PS, PM, P>): Component<Params, State<PS>, Msg<PM>> {
  return {
    init: init(Profile),
    update: update(Profile),
    view: view(Profile)
  };
};
