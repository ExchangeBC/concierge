import { Page } from 'front-end/lib/app/types';
import { ProfileComponent, ProfileViewerMode } from 'front-end/lib/components/profiles/types';
// import { Component, ComponentMsg, ComponentView, Dispatch, immutable, Immutable, Init, mapComponentDispatch, Update, updateComponentChild } from 'front-end/lib/framework';
import { Component, ComponentMsg, ComponentView, immutable, Immutable, Init, Update, updateComponentChild } from 'front-end/lib/framework';
// import * as api from 'front-end/lib/http/api';
import * as ShortText from 'front-end/lib/views/input/short-text';
// import Link from 'front-end/lib/views/link';
// import LoadingButton from 'front-end/lib/views/loading-button';
// import { isArray } from 'lodash';
import { default as React } from 'react';
import { Col, Row } from 'reactstrap';
import { ADT } from 'shared/lib/types';

export interface State<ProfileState> {
  loading: number;
  email: ShortText.State;
  profile: Immutable<ProfileState>;
  userId: string;
  mode: ProfileViewerMode;
  showEmail: boolean;
  showChangePassword: boolean;
  showDeactivateAccount: boolean;
  isProfileEditable: boolean;
  isEditingProfile: boolean;
  promptDeactivationConfirmation: boolean;
}

type InnerMsg<ProfileMsg>
  = ADT<'changeEmail', string>
  | ADT<'changeProfile', ComponentMsg<ProfileMsg, Page>>
  | ADT<'deactivateAccount'>
  | ADT<'startEditingProfile'>
  | ADT<'stopEditingProfile'>
  | ADT<'saveProfile'>;

export type Msg<ProfileMsg> = ComponentMsg<InnerMsg<ProfileMsg>, Page>;

export interface Params<Profile> {
  userId: string;
  mode: ProfileViewerMode;
  showEmail: boolean;
  profile: Profile;
}

function init<PS, PM, P>(Profile: ProfileComponent<PS, PM, P>): Init<Params<P>, State<PS>> {
  return async params => {
    const { userId, mode, showEmail } = params;
    return {
      loading: 0,
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
      userId,
      mode,
      showEmail,
      showChangePassword: mode === 'owner',
      showDeactivateAccount: mode === 'owner',
      isProfileEditable: mode === 'owner',
      isEditingProfile: false,
      promptDeactivationConfirmation: false
    };
  }
};

/*function startLoading<PS>(state: Immutable<State<PS>>): Immutable<State<PS>> {
  return state.set('loading', state.loading + 1);
}

function stopLoading<PS>(state: Immutable<State<PS>>): Immutable<State<PS>> {
  return state.set('loading', Math.max(state.loading - 1, 0));
}*/

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
        return [state];
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
  return props => {
    return null;
  };
}

function conditionalDeactivateAccount<PS, PM, P>(Profile: ProfileComponent<PS, PM, P>): ComponentView<State<PS>, Msg<PM>> {
  return props => {
    return null;
  };
}

function view<PS, PM, P>(Profile: ProfileComponent<PS, PM, P>): ComponentView<State<PS>, Msg<PM>> {
  const ConditionalProfile = conditionalProfile(Profile);
  const ConditionalChangePassword = conditionalChangePassword(Profile);
  const ConditionalDeactivateAccount = conditionalDeactivateAccount(Profile);
  return props => {
    const { state } = props;
    return (
      <div>
        <Row>
          <Col xs='12'>
            <h1>{Profile.getName(state.profile)}'s Profile</h1>
          </Col>
        </Row>
        <ConditionalProfile {...props} />
        <ConditionalChangePassword {...props} />
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
