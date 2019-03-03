import { Page } from 'front-end/lib/app/types';
import { ViewerUser } from 'front-end/lib/components/profiles/types';
import { Component, ComponentMsg, ComponentView, Dispatch, immutable, Immutable, Init, mapComponentDispatch, Update, updateComponentChild } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import * as BuyerProfile from 'front-end/lib/pages/profile/components/buyer';
import * as ProgramStaffProfile from 'front-end/lib/pages/profile/components/program-staff';
import * as VendorProfile from 'front-end/lib/pages/profile/components/vendor';
import { default as React, ReactElement } from 'react';
import { Alert, Col, Row } from 'reactstrap';
import { PublicUser } from 'shared/lib/resources/user';
import { ADT, UserType } from 'shared/lib/types';

const ERROR_MESSAGE = 'An error occurred.';

export interface Params {
  profileUserId: string;
  viewerUser?: ViewerUser
}

export interface State {
  errors: string[];
  buyer?: Immutable<BuyerProfile.State>;
  vendor?: Immutable<VendorProfile.State>;
  programStaff?: Immutable<ProgramStaffProfile.State>;
};

type InnerMsg
  = ADT<'buyer', BuyerProfile.Msg>
  | ADT<'vendor', VendorProfile.Msg>
  | ADT<'programStaff', ProgramStaffProfile.Msg>;

export type Msg = ComponentMsg<InnerMsg, Page>;

async function userToState(profileUser: PublicUser, viewerUser?: ViewerUser): Promise<State> {
  switch (profileUser.profile.type) {
    case UserType.Buyer:
      return {
        errors: [],
        buyer: immutable(await BuyerProfile.init({
          profileUser,
          viewerUser
        }))
      };
    case UserType.Vendor:
      return {
        errors: [],
        vendor: immutable(await VendorProfile.init({
          profileUser,
          viewerUser
        }))
      };
    case UserType.ProgramStaff:
      /*return {
        errors: [],
        programStaff: immutable(await ProgramStaffProfile.init({
          profileUser,
          viewerUser
        }))
      };*/
    default:
      return {
        errors: [ERROR_MESSAGE]
      };
  }
}

export const init: Init<Params, State> = async ({ profileUserId, viewerUser }) => {
  const result = await api.readOneUser(profileUserId);
  switch (result.tag) {
    case 'valid':
      return await userToState(result.value, viewerUser);
    case 'invalid':
      return {
        errors: [ERROR_MESSAGE]
      };
  }
};

export const update: Update<State, Msg> = (state, msg) => {
  switch (msg.tag) {

    case 'buyer':
      return updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'buyer', value }),
        childStatePath: ['buyer'],
        childUpdate: BuyerProfile.update,
        childMsg: msg.value
      });

    case 'vendor':
      return updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'vendor', value }),
        childStatePath: ['vendor'],
        childUpdate: VendorProfile.update,
        childMsg: msg.value
      });

    case 'programStaff':
      return updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'programStaff', value }),
        childStatePath: ['programStaff'],
        childUpdate: ProgramStaffProfile.update,
        childMsg: msg.value
      });

    default:
      return [state];
  }
};

interface ViewProfileProps<ProfileState, ProfileMsg> {
  dispatch: Dispatch<ComponentMsg<Msg, Page>>;
  profileState?: Immutable<ProfileState>;
  View: ComponentView<ProfileState, ComponentMsg<ProfileMsg, Page>>;
  mapProfileMsg(msg: ComponentMsg<ProfileMsg, Page>): Msg;
}

function ViewProfile<ProfileState, ProfileMsg>(props: ViewProfileProps<ProfileState, ProfileMsg>): ReactElement<ViewProfileProps<ProfileState, ProfileMsg>> | null {
  const { dispatch, profileState, mapProfileMsg, View } = props;
  if (profileState !== undefined) {
    const dispatchProfile: Dispatch<ComponentMsg<ProfileMsg, Page>> = mapComponentDispatch(dispatch, mapProfileMsg);
    return (<View dispatch={dispatchProfile} state={profileState} />);
  } else {
    return null;
  }
}

export const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (state.errors.length) {
    return (
      <Row>
        <Col xs='12'>
          <Alert color='danger'>
            {state.errors.map((e, i) => (<div key={`profile-error-${i}`}>{e}</div>))}
          </Alert>
        </Col>
      </Row>
    );
  } else if (state.buyer) {
    return (
      <ViewProfile
        dispatch={dispatch}
        profileState={state.buyer}
        mapProfileMsg={value => ({ tag: 'buyer', value })}
        View={BuyerProfile.view} />
    );
  } else if (state.vendor) {
    return (
      <ViewProfile
        dispatch={dispatch}
        profileState={state.vendor}
        mapProfileMsg={value => ({ tag: 'vendor', value })}
        View={VendorProfile.view} />
    );
  } else if (state.programStaff) {
    return (
      <ViewProfile
        dispatch={dispatch}
        profileState={state.programStaff}
        mapProfileMsg={value => ({ tag: 'programStaff', value })}
        View={ProgramStaffProfile.view} />
    );
  } else {
    return null;
  }
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
