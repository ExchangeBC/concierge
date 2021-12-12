import { isUserType } from 'front-end/lib/access-control';
import router from 'front-end/lib/app/router';
import { SharedState } from 'front-end/lib/app/types';
import { PageInit, replaceRoute } from 'front-end/lib/framework';
import * as PageRequestForInformationView from 'front-end/lib/pages/request-for-information/view';
import { UserType } from 'shared/lib/types';

export type RouteParams = PageRequestForInformationView.RouteParams;

export type State = PageRequestForInformationView.State;

export type Msg = PageRequestForInformationView.Msg;

/**
 * We override the RFI View page's init function
 * to ensure only Program Staff can access previews.
 */

const init: PageInit<RouteParams, SharedState, State, Msg> = isUserType({
  userTypes: [UserType.ProgramStaff],

  async success(params) {
    return await PageRequestForInformationView.component.init({
      ...params,
      shared: params.shared.original
    });
  },

  async fail(params) {
    const { routeParams, dispatch } = params;
    dispatch(
      replaceRoute({
        tag: 'signIn',
        value: {
          redirectOnSuccess: router.routeToUrl({
            tag: 'requestForInformationPreview',
            value: routeParams
          })
        }
      })
    );
    return await PageRequestForInformationView.component.init(params);
  }
});

export const component = {
  ...PageRequestForInformationView.component,
  init
};
