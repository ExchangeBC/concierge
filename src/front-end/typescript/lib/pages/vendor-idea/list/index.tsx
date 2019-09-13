import { makePageMetadata } from 'front-end/lib';
import { isSignedIn } from 'front-end/lib/access-control';
import router from 'front-end/lib/app/router';
import { Route, SharedState } from 'front-end/lib/app/types';
import { ComponentView, Dispatch, emptyPageAlerts, emptyPageBreadcrumbs, GlobalComponentMsg, Immutable, immutable, mapComponentDispatch, mapPageModalMsg, PageComponent, PageInit, replaceRoute, Update, updateGlobalComponentChild } from 'front-end/lib/framework';
import * as ProgramStaffList from 'front-end/lib/pages/vendor-idea/list/program-staff';
import * as VendorList from 'front-end/lib/pages/vendor-idea/list/vendor';
import React from 'react';
import { ADT, UserType } from 'shared/lib/types';

export type RouteParams = null;

export type InnerMsg
  = ADT<'vendor', VendorList.Msg>
  | ADT<'programStaff', ProgramStaffList.Msg>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

export interface State {
  vendor?: Immutable<VendorList.State>;
  programStaff?: Immutable<ProgramStaffList.State>;
};

const init: PageInit<RouteParams, SharedState, State, Msg> = isSignedIn({

  async success({ shared }) {
    const { sessionUser } = shared;
    switch (sessionUser.type) {
      case UserType.Vendor:
        return { vendor: immutable(await VendorList.init({ sessionUser })) };
      case UserType.ProgramStaff:
        return { programStaff: immutable(await ProgramStaffList.init({ sessionUser })) };
      default:
        return {};
    }
  },

  async fail({ routeParams, shared, dispatch }) {
    dispatch(replaceRoute({
      tag: 'signIn' as const,
      value: {
        redirectOnSuccess: router.routeToUrl({
          tag: 'viList',
          value: null
        })
      }
    }));
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
        childUpdate: VendorList.update,
        childMsg: msg.value
      });
    case 'programStaff':
      return updateGlobalComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'programStaff', value }),
        childStatePath: ['programStaff'],
        childUpdate: ProgramStaffList.update,
        childMsg: msg.value
      });
    default:
      return [state];
  }
};

const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (state.vendor) {
    const dispatchVendor: Dispatch<VendorList.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'vendor' as const, value }));
    return (<VendorList.view state={state.vendor} dispatch={dispatchVendor} />);
  } else if (state.programStaff) {
    const dispatchProgramStaff: Dispatch<ProgramStaffList.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'programStaff' as const, value }));
    return (<ProgramStaffList.view state={state.programStaff} dispatch={dispatchProgramStaff} />);
  } else {
    return null;
  }
};

export const component: PageComponent<RouteParams, SharedState, State, Msg> = {
  init,
  update,
  view,
  getAlerts: emptyPageAlerts,
  getMetadata(state) {
    return makePageMetadata('Vendor-Initiated Ideas');
  },
  getBreadcrumbs: emptyPageBreadcrumbs,
  getModal(state) {
    if (state.vendor) {
      return mapPageModalMsg(VendorList.getModal(state.vendor), value => ({ tag: 'vendor', value }));
    } else if (state.programStaff) {
      return mapPageModalMsg(ProgramStaffList.getModal(state.programStaff), value => ({ tag: 'programStaff', value }));
    } else {
      return null;
    }
  }
};
