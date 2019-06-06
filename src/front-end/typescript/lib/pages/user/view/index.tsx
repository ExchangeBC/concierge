import { FALLBACK_USER_NAME } from 'front-end/config';
import { makePageMetadata } from 'front-end/lib';
import { isSignedIn } from 'front-end/lib/access-control';
import router from 'front-end/lib/app/router';
import { Route, SharedState } from 'front-end/lib/app/types';
import { ViewerUser } from 'front-end/lib/components/profiles/types';
import { ComponentView, Dispatch, emptyPageAlerts, GlobalComponentMsg, Immutable, immutable, mapGlobalComponentDispatch, mapPageModalMsg, newRoute, PageComponent, PageInit, replaceRoute, Update, updateGlobalComponentChild } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import * as BuyerProfile from 'front-end/lib/pages/user/view/components/buyer';
import * as ProgramStaffProfile from 'front-end/lib/pages/user/view/components/program-staff';
import * as VendorProfile from 'front-end/lib/pages/user/view/components/vendor';
import { default as React, ReactElement } from 'react';
import { PublicUser } from 'shared/lib/resources/user';
import { ADT, profileToName, UserType } from 'shared/lib/types';

const ERROR_MESSAGE = 'You do not have sufficient privileges to view this profile.';

export interface RouteParams {
  profileUserId: string;
}

export interface State {
  errors: string[];
  viewerUser?: ViewerUser;
  profileUser?: PublicUser;
  buyer?: Immutable<BuyerProfile.State>;
  vendor?: Immutable<VendorProfile.State>;
  programStaff?: Immutable<ProgramStaffProfile.State>;
};

type InnerMsg
  = ADT<'buyer', BuyerProfile.Msg>
  | ADT<'vendor', VendorProfile.Msg>
  | ADT<'programStaff', ProgramStaffProfile.Msg>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

async function userToState(profileUser: PublicUser, viewerUser?: ViewerUser): Promise<State> {
  switch (profileUser.profile.type) {
    case UserType.Buyer:
      return {
        errors: [],
        profileUser,
        viewerUser,
        buyer: immutable(await BuyerProfile.init({
          profileUser,
          viewerUser
        }))
      };
    case UserType.Vendor:
      return {
        errors: [],
        profileUser,
        viewerUser,
        vendor: immutable(await VendorProfile.init({
          profileUser,
          viewerUser
        }))
      };
    case UserType.ProgramStaff:
      return {
        errors: [],
        profileUser,
        viewerUser,
        programStaff: immutable(await ProgramStaffProfile.init({
          profileUser,
          viewerUser
        }))
      };
  }
}

const init: PageInit<RouteParams, SharedState, State, Msg> = isSignedIn({

  async success({ routeParams, shared }) {
    const { profileUserId } = routeParams;
    const viewerUser = shared.sessionUser;
    const result = await api.readOneUser(profileUserId);
    switch (result.tag) {
      case 'valid':
        return await userToState(result.value, viewerUser);
      case 'invalid':
        return {
          errors: [ERROR_MESSAGE],
          viewerUser
        };
    }
  },

  async fail({ routeParams, dispatch }) {
    dispatch(replaceRoute({
      tag: 'signIn' as 'signIn',
      value: {
        redirectOnSuccess: router.routeToUrl({
          tag: 'userView',
          value: routeParams
        })
      }
    }));
    // Use Buyer as an arbitrary choice for the first argument.
    return { errors: [] };
  }

});

const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {

    case 'buyer':
      return updateGlobalComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'buyer' as 'buyer', value }),
        childStatePath: ['buyer'],
        childUpdate: BuyerProfile.update,
        childMsg: msg.value
      });

    case 'vendor':
      return updateGlobalComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'vendor' as 'vendor', value }),
        childStatePath: ['vendor'],
        childUpdate: VendorProfile.update,
        childMsg: msg.value
      });

    case 'programStaff':
      return updateGlobalComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'programStaff' as 'programStaff', value }),
        childStatePath: ['programStaff'],
        childUpdate: ProgramStaffProfile.update,
        childMsg: msg.value
      });

    default:
      return [state];
  }
};

interface ViewProfileProps<ProfileState, ProfileMsg> {
  dispatch: Dispatch<GlobalComponentMsg<Msg, Route>>;
  profileState?: Immutable<ProfileState>;
  View: ComponentView<ProfileState, GlobalComponentMsg<ProfileMsg, Route>>;
  mapProfileMsg(msg: GlobalComponentMsg<ProfileMsg, Route>): Msg;
}

function ViewProfile<ProfileState, ProfileMsg>(props: ViewProfileProps<ProfileState, ProfileMsg>): ReactElement<ViewProfileProps<ProfileState, ProfileMsg>> | null {
  const { dispatch, profileState, mapProfileMsg, View } = props;
  if (profileState !== undefined) {
    const dispatchProfile: Dispatch<GlobalComponentMsg<ProfileMsg, Route>> = mapGlobalComponentDispatch(dispatch, mapProfileMsg);
    return (<View dispatch={dispatchProfile} state={profileState} />);
  } else {
    return null;
  }
}

const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (state.errors.length) {
    return null;
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
  getMetadata(state) {
    return makePageMetadata(state.profileUser ? profileToName(state.profileUser.profile) : FALLBACK_USER_NAME);
  },
  getBreadcrumbs(state) {
    if (state.viewerUser && state.viewerUser.type !== UserType.ProgramStaff) {
      return [];
    }
    const profileUser = state.profileUser;
    return [
      {
        text: 'Users',
        onClickMsg: newRoute({
          tag: 'userList',
          value: null
        })
      },
      {
        text: profileUser ? profileToName(profileUser.profile) : FALLBACK_USER_NAME
      }
    ];
  },
  getModal(state) {
    if (state.buyer) {
      return mapPageModalMsg(BuyerProfile.getModal(state.buyer), value => ({
        tag: 'buyer',
        value
      }));
    } else if (state.vendor) {
      return mapPageModalMsg(VendorProfile.getModal(state.vendor), value => ({
        tag: 'vendor',
        value
      }));
    } else if (state.programStaff) {
      return mapPageModalMsg(ProgramStaffProfile.getModal(state.programStaff), value => ({
        tag: 'programStaff',
        value
      }));
    } else {
      return null;
    }
  }
};
