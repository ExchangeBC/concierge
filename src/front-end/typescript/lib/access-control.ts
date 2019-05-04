import { Route, SharedState } from 'front-end/lib/app/types';
import { GlobalComponentMsg, PageInit } from 'front-end/lib/framework';
import { SessionUser } from 'front-end/lib/http/api';
import { includes } from 'lodash';
import { UserType } from 'shared/lib/types';

export interface AccessControlParams<RouteParams, PageState, PageMsg, SuccessSharedState = SharedState> {
  success: PageInit<RouteParams, SuccessSharedState, PageState, PageMsg>;
  fail: PageInit<RouteParams, SharedState, PageState, PageMsg>;
}

export interface SharedStateWithGuaranteedSessionUser {
  sessionUser: SessionUser;
  original: SharedState;
}

export function accessControl<RouteParams, PageState, PageMsg>(allowed: boolean, params: AccessControlParams<RouteParams, PageState, GlobalComponentMsg<PageMsg, Route>>): PageInit<RouteParams, SharedState, PageState, GlobalComponentMsg<PageMsg, Route>> {
  return allowed ? params.success : params.fail;
}

export function isSignedOut<RouteParams, PageState, PageMsg>(params: AccessControlParams<RouteParams, PageState, GlobalComponentMsg<PageMsg, Route>>): PageInit<RouteParams, SharedState, PageState, GlobalComponentMsg<PageMsg, Route>> {
  return async initParams => {
    const { shared } = initParams;
    const allowed = !shared.session || !shared.session.user;
    return await accessControl(allowed, params)(initParams);
  };
}

export function isSignedIn<RouteParams, PageState, PageMsg>(params: AccessControlParams<RouteParams, PageState, GlobalComponentMsg<PageMsg, Route>, SharedStateWithGuaranteedSessionUser>): PageInit<RouteParams, SharedState, PageState, GlobalComponentMsg<PageMsg, Route>> {
  return async initParams => {
    const { shared } = initParams;
    if (shared.session && shared.session.user) {
      return await params.success({
        ...initParams,
        shared: {
          sessionUser: shared.session.user,
          original: initParams.shared
        }
      });
    } else {
      return await params.fail(initParams);
    }
  };
}

interface IsUserTypeParams<RouteParams, PageState, PageMsg> extends AccessControlParams<RouteParams, PageState, PageMsg, SharedStateWithGuaranteedSessionUser> {
  userTypes: UserType[];
}

export function isUserType<RouteParams, PageState, PageMsg>(params: IsUserTypeParams<RouteParams, PageState, GlobalComponentMsg<PageMsg, Route>>): PageInit<RouteParams, SharedState, PageState, GlobalComponentMsg<PageMsg, Route>> {
  return async initParams => {
    const { shared } = initParams;
    if (shared.session && shared.session.user && includes(params.userTypes, shared.session.user.type)) {
      return await params.success({
        ...initParams,
        shared: {
          sessionUser: shared.session.user,
          original: initParams.shared
        }
      });
    } else {
      return await params.fail(initParams);
    }
  };
}
