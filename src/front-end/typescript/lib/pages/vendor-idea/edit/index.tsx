import { makePageMetadata } from 'front-end/lib';
import { isUserType } from 'front-end/lib/access-control';
import router from 'front-end/lib/app/router';
import { Route, SharedState } from 'front-end/lib/app/types';
import { ComponentView, Dispatch, emptyPageAlerts, GlobalComponentMsg, Immutable, immutable, mapGlobalComponentDispatch, mapPageBreadcrumbsMsg, mapPageModalMsg, PageComponent, PageInit, replaceRoute, Update, updateGlobalComponentChild } from 'front-end/lib/framework';
import * as ProgramStaffEdit from 'front-end/lib/pages/vendor-idea/edit/program-staff';
import * as VendorEdit from 'front-end/lib/pages/vendor-idea/edit/vendor';
import React from 'react';
import { ADT, UserType } from 'shared/lib/types';

export interface RouteParams {
  viId: string;
  activeTab?: ProgramStaffEdit.TabId;
};

export type InnerMsg
  = ADT<'vendor', VendorEdit.Msg>
  | ADT<'programStaff', ProgramStaffEdit.Msg>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

export interface State {
  vendor?: Immutable<VendorEdit.State>;
  programStaff?: Immutable<ProgramStaffEdit.State>;
};

const init: PageInit<RouteParams, SharedState, State, Msg> = isUserType({

  userTypes: [UserType.Vendor, UserType.ProgramStaff],

  async success({ shared, routeParams, dispatch }) {
    const { sessionUser } = shared;
    const { viId, activeTab } = routeParams;
    switch (sessionUser.type) {
      case UserType.Vendor:
        const dispatchVendor: Dispatch<VendorEdit.Msg> = mapGlobalComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'vendor' as const, value }));
        return { vendor: immutable(await VendorEdit.init({ viId, dispatch: dispatchVendor })) };
      case UserType.ProgramStaff:
        const dispatchProgramStaff: Dispatch<ProgramStaffEdit.Msg> = mapGlobalComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'programStaff' as const, value }));
        return { programStaff: immutable(await ProgramStaffEdit.init({ viId, activeTab, dispatch: dispatchProgramStaff, sessionUser })) };
      default:
        return {};
    }
  },

  async fail({ routeParams, shared, dispatch }) {
    if (!shared.session || !shared.session.user) {
      dispatch(replaceRoute({
        tag: 'signIn' as const,
        value: {
          redirectOnSuccess: router.routeToUrl({
            tag: 'viEdit',
            value: routeParams
          })
        }
      }));
    } else { // is buyer.
      dispatch(replaceRoute({
        tag: 'viView' as const,
        value: {
          viId: routeParams.viId
        }
      }));
    }
    return {};
  }

});

const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'vendor':
      return updateGlobalComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'vendor', value }),
        childStatePath: ['vendor'],
        childUpdate: VendorEdit.update,
        childMsg: msg.value
      });
    case 'programStaff':
      return updateGlobalComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'programStaff', value }),
        childStatePath: ['programStaff'],
        childUpdate: ProgramStaffEdit.update,
        childMsg: msg.value
      });
    default:
      return [state];
  }
};

const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (state.vendor) {
    const dispatchVendor: Dispatch<VendorEdit.Msg> = mapGlobalComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'vendor' as const, value }));
    return (<VendorEdit.view state={state.vendor} dispatch={dispatchVendor} />);
  } else if (state.programStaff) {
    const dispatchProgramStaff: Dispatch<ProgramStaffEdit.Msg> = mapGlobalComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'programStaff' as const, value }));
    return (<ProgramStaffEdit.view state={state.programStaff} dispatch={dispatchProgramStaff} />);
  } else {
    return null;
  }
};

export const component: PageComponent<RouteParams, SharedState, State, Msg> = {
  init,
  update,
  view,
  viewBottomBar({ state, dispatch }) {
    if (state.vendor) {
      const dispatchVendor: Dispatch<VendorEdit.Msg> = mapGlobalComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'vendor' as const, value }));
      return (<VendorEdit.viewBottomBar state={state.vendor} dispatch={dispatchVendor} />);
    } else if (state.programStaff) {
      const dispatchProgramStaff: Dispatch<ProgramStaffEdit.Msg> = mapGlobalComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'programStaff' as const, value }));
      return (<ProgramStaffEdit.viewBottomBar state={state.programStaff} dispatch={dispatchProgramStaff} />);
    } else {
      return null;
    }
  },
  getAlerts: emptyPageAlerts,
  getMetadata(state) {
    if (state.vendor) {
      return VendorEdit.getMetadata(state.vendor);
    } else if (state.programStaff) {
      return ProgramStaffEdit.getMetadata(state.programStaff);
    } else {
      return makePageMetadata('Edit a Vendor-Initiated Idea Application');
    }
  },
  getBreadcrumbs(state) {
    if (state.vendor) {
      return mapPageBreadcrumbsMsg(VendorEdit.getBreadcrumbs(state.vendor), value => ({ tag: 'vendor', value }));
    } else if (state.programStaff) {
      return mapPageBreadcrumbsMsg(ProgramStaffEdit.getBreadcrumbs(state.programStaff), value => ({ tag: 'programStaff', value }));
    } else {
      return [];
    }
  },
  getModal(state) {
    if (state.vendor) {
      return mapPageModalMsg(VendorEdit.getModal(state.vendor), value => ({ tag: 'vendor', value }));
    } else if (state.programStaff) {
      return mapPageModalMsg(ProgramStaffEdit.getModal(state.programStaff), value => ({ tag: 'programStaff', value }));
    } else {
      return null;
    }
  }
};
