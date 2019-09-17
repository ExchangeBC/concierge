import { makePageMetadata } from 'front-end/lib';
import { isSignedIn } from 'front-end/lib/access-control';
import router from 'front-end/lib/app/router';
import { Route, SharedState } from 'front-end/lib/app/types';
import { ComponentView, Dispatch, emptyPageAlerts, emptyPageBreadcrumbs, GlobalComponentMsg, immutable, Immutable, mapGlobalComponentDispatch, mapPageModalMsg, PageComponent, PageInit, replaceRoute, Update, updateGlobalComponentChild } from 'front-end/lib/framework';
import * as BuyerList from 'front-end/lib/pages/vendor-idea/list/buyer';
import * as ProgramStaffList from 'front-end/lib/pages/vendor-idea/list/program-staff';
import * as VendorList from 'front-end/lib/pages/vendor-idea/list/vendor';
import React from 'react';
import { ADT, UserType } from 'shared/lib/types';

export type RouteParams = null;

export type InnerMsg
  = ADT<'vendor', VendorList.Msg>
  | ADT<'programStaff', ProgramStaffList.Msg>
  | ADT<'buyer', BuyerList.Msg>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

export interface State {
  vendor?: Immutable<VendorList.State>;
  programStaff?: Immutable<ProgramStaffList.State>;
  buyer?: Immutable<BuyerList.State>;
};

const init: PageInit<RouteParams, SharedState, State, Msg> = isSignedIn({

  async success({ shared, dispatch }) {
    const { sessionUser } = shared;
    switch (sessionUser.type) {
      case UserType.Vendor:
        return { vendor: immutable(await VendorList.init({ sessionUser })) };
      case UserType.ProgramStaff:
        return { programStaff: immutable(await ProgramStaffList.init({ sessionUser })) };
      case UserType.Buyer:
        return {
          buyer: immutable(await BuyerList.init({
            sessionUser,
            dispatch: mapGlobalComponentDispatch(dispatch, value => ({ tag: 'buyer' as const, value }))
          }))
        };
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
    case 'buyer':
      return updateGlobalComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'buyer', value }),
        childStatePath: ['buyer'],
        childUpdate: BuyerList.update,
        childMsg: msg.value
      });
    default:
      return [state];
  }
};

const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (state.vendor) {
    const dispatchVendor: Dispatch<VendorList.Msg> = mapGlobalComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'vendor' as const, value }));
    return (<VendorList.view state={state.vendor} dispatch={dispatchVendor} />);
  } else if (state.programStaff) {
    const dispatchProgramStaff: Dispatch<ProgramStaffList.Msg> = mapGlobalComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'programStaff' as const, value }));
    return (<ProgramStaffList.view state={state.programStaff} dispatch={dispatchProgramStaff} />);
  } else if (state.buyer) {
    const dispatchBuyer: Dispatch<BuyerList.Msg> = mapGlobalComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'buyer' as const, value }));
    return (<BuyerList.view state={state.buyer} dispatch={dispatchBuyer} />);
  } else {
    return null;
  }
};

export const component: PageComponent<RouteParams, SharedState, State, Msg> = {
  init,
  update,
  view,
  getAlerts(state) {
    if (state.programStaff) {
      return ProgramStaffList.getAlerts(state.programStaff);
    } else {
      return emptyPageAlerts();
    }
  },
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
