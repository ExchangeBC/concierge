import { Msg, Route, Session, State } from 'front-end/lib/app/types';
import { Dispatch, Immutable, initAppChildPage, Update, updateAppChildPage } from 'front-end/lib/framework';
import { getSession } from 'front-end/lib/http/api';
import * as PageChangePassword from 'front-end/lib/pages/change-password';
import * as PageFeedback from 'front-end/lib/pages/feedback';
import * as PageForgotPassword from 'front-end/lib/pages/forgot-password';
import * as PageLanding from 'front-end/lib/pages/landing';
import * as PageMarkdown from 'front-end/lib/pages/markdown';
import * as PageNotice from 'front-end/lib/pages/notice';
import * as PageProfile from 'front-end/lib/pages/profile';
import * as PageRequestForInformationCreate from 'front-end/lib/pages/request-for-information/create';
import * as PageRequestForInformationEdit from 'front-end/lib/pages/request-for-information/edit';
import * as PageRequestForInformationList from 'front-end/lib/pages/request-for-information/list';
import * as PageRequestForInformationPreview from 'front-end/lib/pages/request-for-information/preview';
import * as PageRequestForInformationRespond from 'front-end/lib/pages/request-for-information/respond';
import * as PageRequestForInformationView from 'front-end/lib/pages/request-for-information/view';
import * as PageResetPassword from 'front-end/lib/pages/reset-password';
import * as PageSignIn from 'front-end/lib/pages/sign-in';
import * as PageSignOut from 'front-end/lib/pages/sign-out';
import * as PageSignUpBuyer from 'front-end/lib/pages/sign-up/buyer';
import * as PageSignUpProgramStaff from 'front-end/lib/pages/sign-up/program-staff';
import * as PageSignUpVendor from 'front-end/lib/pages/sign-up/vendor';
import * as PageTermsAndConditions from 'front-end/lib/pages/terms-and-conditions';
import * as PageUserList from 'front-end/lib/pages/user-list';
import { ValidOrInvalid } from 'shared/lib/validators';

function setSession(state: Immutable<State>, validated: ValidOrInvalid<Session, null>): Immutable<State> {
  return state.set('shared', {
    session: validated.tag === 'valid' ? validated.value : undefined
  });
};

function startTransition(state: Immutable<State>): Immutable<State> {
  return state.set('inTransition', true);
}

function endTransition(state: Immutable<State>): Immutable<State> {
  return state.set('inTransition', false);
}

async function initPage(state: Immutable<State>, dispatch: Dispatch<Msg>, route: Route): Promise<Immutable<State>> {
  switch (route.tag) {

    case 'landing':
      return await initAppChildPage({
        state,
        dispatch,
        childStatePath: ['pages', 'landing'],
        childRouteParams: route.value,
        childInit: PageLanding.component.init,
        getSharedState(state) {
          return state.shared;
        },
        mapChildMsg(value) {
          return { tag: 'pageLanding' as 'pageLanding', value };
        }
      });

    case 'signIn':
      return await initAppChildPage({
        state,
        dispatch,
        childStatePath: ['pages', 'signIn'],
        childRouteParams: route.value,
        childInit: PageSignIn.component.init,
        getSharedState(state) {
          return state.shared;
        },
        mapChildMsg(value) {
          return { tag: 'pageSignIn' as 'pageSignIn', value };
        }
      });

    case 'signUpBuyer':
      return await initAppChildPage({
        state,
        dispatch,
        childStatePath: ['pages', 'signUpBuyer'],
        childRouteParams: route.value,
        childInit: PageSignUpBuyer.component.init,
        getSharedState(state) {
          return state.shared;
        },
        mapChildMsg(value) {
          return { tag: 'pageSignUpBuyer' as 'pageSignUpBuyer', value };
        }
      });

    case 'signUpVendor':
      return await initAppChildPage({
        state,
        dispatch,
        childStatePath: ['pages', 'signUpVendor'],
        childRouteParams: route.value,
        childInit: PageSignUpVendor.component.init,
        getSharedState(state) {
          return state.shared;
        },
        mapChildMsg(value) {
          return { tag: 'pageSignUpVendor' as 'pageSignUpVendor', value };
        }
      });

    case 'signUpProgramStaff':
      return await initAppChildPage({
        state,
        dispatch,
        childStatePath: ['pages', 'signUpProgramStaff'],
        childRouteParams: route.value,
        childInit: PageSignUpProgramStaff.component.init,
        getSharedState(state) {
          return state.shared;
        },
        mapChildMsg(value) {
          return { tag: 'pageSignUpProgramStaff' as 'pageSignUpProgramStaff', value };
        }
      });

    case 'signOut':
      return await initAppChildPage({
        state,
        dispatch,
        childStatePath: ['pages', 'signOut'],
        childRouteParams: route.value,
        childInit: PageSignOut.component.init,
        getSharedState(state) {
          return state.shared;
        },
        mapChildMsg(value) {
          return { tag: 'pageSignOut' as 'pageSignOut', value };
        }
      });

    case 'changePassword':
      return await initAppChildPage({
        state,
        dispatch,
        childStatePath: ['pages', 'changePassword'],
        childRouteParams: route.value,
        childInit: PageChangePassword.component.init,
        getSharedState(state) {
          return state.shared;
        },
        mapChildMsg(value) {
          return { tag: 'pageChangePassword' as 'pageChangePassword', value };
        }
      });

    case 'resetPassword':
      return await initAppChildPage({
        state,
        dispatch,
        childStatePath: ['pages', 'resetPassword'],
        childRouteParams: route.value,
        childInit: PageResetPassword.component.init,
        getSharedState(state) {
          return state.shared;
        },
        mapChildMsg(value) {
          return { tag: 'pageResetPassword' as 'pageResetPassword', value };
        }
      });

    case 'forgotPassword':
      return await initAppChildPage({
        state,
        dispatch,
        childStatePath: ['pages', 'forgotPassword'],
        childRouteParams: route.value,
        childInit: PageForgotPassword.component.init,
        getSharedState(state) {
          return state.shared;
        },
        mapChildMsg(value) {
          return { tag: 'pageForgotPassword' as 'pageForgotPassword', value };
        }
      });

    case 'termsAndConditions':
      return await initAppChildPage({
        state,
        dispatch,
        childStatePath: ['pages', 'termsAndConditions'],
        childRouteParams: route.value,
        childInit: PageTermsAndConditions.component.init,
        getSharedState(state) {
          return state.shared;
        },
        mapChildMsg(value) {
          return { tag: 'pageTermsAndConditions' as 'pageTermsAndConditions', value };
        }
      });

    case 'profile':
      return await initAppChildPage({
        state,
        dispatch,
        childStatePath: ['pages', 'profile'],
        childRouteParams: route.value,
        childInit: PageProfile.component.init,
        getSharedState(state) {
          return state.shared;
        },
        mapChildMsg(value) {
          return { tag: 'pageProfile' as 'pageProfile', value };
        }
      });

    case 'userList':
      return await initAppChildPage({
        state,
        dispatch,
        childStatePath: ['pages', 'userList'],
        childRouteParams: route.value,
        childInit: PageUserList.component.init,
        getSharedState(state) {
          return state.shared;
        },
        mapChildMsg(value) {
          return { tag: 'pageUserList' as 'pageUserList', value };
        }
      });

    case 'requestForInformationCreate':
      return await initAppChildPage({
        state,
        dispatch,
        childStatePath: ['pages', 'requestForInformationCreate'],
        childRouteParams: route.value,
        childInit: PageRequestForInformationCreate.component.init,
        getSharedState(state) {
          return state.shared;
        },
        mapChildMsg(value) {
          return { tag: 'pageRequestForInformationCreate' as 'pageRequestForInformationCreate', value };
        }
      });

    case 'requestForInformationEdit':
      return await initAppChildPage({
        state,
        dispatch,
        childStatePath: ['pages', 'requestForInformationEdit'],
        childRouteParams: route.value,
        childInit: PageRequestForInformationEdit.component.init,
        getSharedState(state) {
          return state.shared;
        },
        mapChildMsg(value) {
          return { tag: 'pageRequestForInformationEdit' as 'pageRequestForInformationEdit', value };
        }
      });

    case 'requestForInformationView':
      return await initAppChildPage({
        state,
        dispatch,
        childStatePath: ['pages', 'requestForInformationView'],
        childRouteParams: route.value,
        childInit: PageRequestForInformationView.component.init,
        getSharedState(state) {
          return state.shared;
        },
        mapChildMsg(value) {
          return { tag: 'pageRequestForInformationView' as 'pageRequestForInformationView', value };
        }
      });

    case 'requestForInformationPreview':
      return await initAppChildPage({
        state,
        dispatch,
        childStatePath: ['pages', 'requestForInformationPreview'],
        childRouteParams: route.value,
        childInit: PageRequestForInformationPreview.component.init,
        getSharedState(state) {
          return state.shared;
        },
        mapChildMsg(value) {
          return { tag: 'pageRequestForInformationPreview' as 'pageRequestForInformationPreview', value };
        }
      });

    case 'requestForInformationRespond':
      return await initAppChildPage({
        state,
        dispatch,
        childStatePath: ['pages', 'requestForInformationRespond'],
        childRouteParams: route.value,
        childInit: PageRequestForInformationRespond.component.init,
        getSharedState(state) {
          return state.shared;
        },
        mapChildMsg(value) {
          return { tag: 'pageRequestForInformationRespond' as 'pageRequestForInformationRespond', value };
        }
      });

    case 'requestForInformationList':
      return await initAppChildPage({
        state,
        dispatch,
        childStatePath: ['pages', 'requestForInformationList'],
        childRouteParams: route.value,
        childInit: PageRequestForInformationList.component.init,
        getSharedState(state) {
          return state.shared;
        },
        mapChildMsg(value) {
          return { tag: 'pageRequestForInformationList' as 'pageRequestForInformationList', value };
        }
      });

    case 'markdown':
      return await initAppChildPage({
        state,
        dispatch,
        childStatePath: ['pages', 'markdown'],
        childRouteParams: route.value,
        childInit: PageMarkdown.component.init,
        getSharedState(state) {
          return state.shared;
        },
        mapChildMsg(value) {
          return { tag: 'pageMarkdown' as 'pageMarkdown', value };
        }
      });

    case 'notice':
      return await initAppChildPage({
        state,
        dispatch,
        childStatePath: ['pages', 'notice'],
        childRouteParams: route.value,
        childInit: PageNotice.component.init,
        getSharedState(state) {
          return state.shared;
        },
        mapChildMsg(value) {
          return { tag: 'pageNotice' as 'pageNotice', value };
        }
      });

    case 'feedback':
      return await initAppChildPage({
        state,
        dispatch,
        childStatePath: ['pages', 'feedback'],
        childRouteParams: route.value,
        childInit: PageFeedback.component.init,
        getSharedState(state) {
          return state.shared;
        },
        mapChildMsg(value) {
          return { tag: 'pageFeedback' as 'pageFeedback', value };
        }
      });

  }
}

const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {

    case '@incomingRoute':
      const incomingRoute: Route = msg.value;
      state = startTransition(state);
      return [
        state,
        async (state, dispatch) => {
          state = endTransition(state);
          // Unset the previous page's state.
          state = state.setIn(['pages', state.activeRoute.tag], undefined);
          // Refresh the front-end's view of the current session.
          state = setSession(state, await getSession());
          state = state
            .set('activeRoute', incomingRoute)
            // We switch this flag to true so the view function knows to display the page.
            .set('ready', true);
          // Set the new active page's state.
          state = await initPage(state, dispatch, incomingRoute);
          // Refresh the front-end's view of the current session again
          // if the user has been signed out.
          if (incomingRoute.tag === 'signOut') {
            state = setSession(state, await getSession());
          }
          // Scroll to the top-left of the page for page changes.
          if (window.scrollTo) { window.scrollTo(0, 0); }
          return state;
        }
      ];

    case 'toggleIsNavOpen':
      return [state.set('isNavOpen', msg.value === undefined ? !state.isNavOpen : msg.value)];

    case 'pageLanding':
      return updateAppChildPage({
        state,
        mapChildMsg: value => ({ tag: 'pageLanding', value }),
        childStatePath: ['pages', 'landing'],
        childUpdate: PageLanding.component.update,
        childGetMetadata: PageLanding.component.getMetadata,
        childMsg: msg.value
      });

    case 'pageSignIn':
      return updateAppChildPage({
        state,
        mapChildMsg: value => ({ tag: 'pageSignIn', value }),
        childStatePath: ['pages', 'signIn'],
        childUpdate: PageSignIn.component.update,
        childGetMetadata: PageSignIn.component.getMetadata,
        childMsg: msg.value
      });

    case 'pageSignUpBuyer':
      return updateAppChildPage({
        state,
        mapChildMsg: value => ({ tag: 'pageSignUpBuyer', value }),
        childStatePath: ['pages', 'signUpBuyer'],
        childUpdate: PageSignUpBuyer.component.update,
        childGetMetadata: PageSignUpBuyer.component.getMetadata,
        childMsg: msg.value
      });

    case 'pageSignUpVendor':
      return updateAppChildPage({
        state,
        mapChildMsg: value => ({ tag: 'pageSignUpVendor', value }),
        childStatePath: ['pages', 'signUpVendor'],
        childUpdate: PageSignUpVendor.component.update,
        childGetMetadata: PageSignUpVendor.component.getMetadata,
        childMsg: msg.value
      });

    case 'pageSignUpProgramStaff':
      return updateAppChildPage({
        state,
        mapChildMsg: value => ({ tag: 'pageSignUpProgramStaff', value }),
        childStatePath: ['pages', 'signUpProgramStaff'],
        childUpdate: PageSignUpProgramStaff.component.update,
        childGetMetadata: PageSignUpProgramStaff.component.getMetadata,
        childMsg: msg.value
      });

    case 'pageSignOut':
      return updateAppChildPage({
        state,
        mapChildMsg: value => ({ tag: 'pageSignOut', value }),
        childStatePath: ['pages', 'signOut'],
        childUpdate: PageSignOut.component.update,
        childGetMetadata: PageSignOut.component.getMetadata,
        childMsg: msg.value
      });

    case 'pageChangePassword':
      return updateAppChildPage({
        state,
        mapChildMsg: value => ({ tag: 'pageChangePassword', value }),
        childStatePath: ['pages', 'changePassword'],
        childUpdate: PageChangePassword.component.update,
        childGetMetadata: PageChangePassword.component.getMetadata,
        childMsg: msg.value
      });

    case 'pageResetPassword':
      return updateAppChildPage({
        state,
        mapChildMsg: value => ({ tag: 'pageResetPassword', value }),
        childStatePath: ['pages', 'resetPassword'],
        childUpdate: PageResetPassword.component.update,
        childGetMetadata: PageResetPassword.component.getMetadata,
        childMsg: msg.value
      });

    case 'pageForgotPassword':
      return updateAppChildPage({
        state,
        mapChildMsg: value => ({ tag: 'pageForgotPassword', value }),
        childStatePath: ['pages', 'forgotPassword'],
        childUpdate: PageForgotPassword.component.update,
        childGetMetadata: PageForgotPassword.component.getMetadata,
        childMsg: msg.value
      });

    case 'pageTermsAndConditions':
      return updateAppChildPage({
        state,
        mapChildMsg: value => ({ tag: 'pageTermsAndConditions', value }),
        childStatePath: ['pages', 'termsAndConditions'],
        childUpdate: PageTermsAndConditions.component.update,
        childGetMetadata: PageTermsAndConditions.component.getMetadata,
        childMsg: msg.value
      });

    case 'pageProfile':
      return updateAppChildPage({
        state,
        mapChildMsg: value => ({ tag: 'pageProfile', value }),
        childStatePath: ['pages', 'profile'],
        childUpdate: PageProfile.component.update,
        childGetMetadata: PageProfile.component.getMetadata,
        childMsg: msg.value
      });

    case 'pageUserList':
      return updateAppChildPage({
        state,
        mapChildMsg: value => ({ tag: 'pageUserList', value }),
        childStatePath: ['pages', 'userList'],
        childUpdate: PageUserList.component.update,
        childGetMetadata: PageUserList.component.getMetadata,
        childMsg: msg.value
      });

    case 'pageRequestForInformationCreate':
      return updateAppChildPage({
        state,
        mapChildMsg: value => ({ tag: 'pageRequestForInformationCreate', value }),
        childStatePath: ['pages', 'requestForInformationCreate'],
        childUpdate: PageRequestForInformationCreate.component.update,
        childGetMetadata: PageRequestForInformationCreate.component.getMetadata,
        childMsg: msg.value
      });

    case 'pageRequestForInformationEdit':
      return updateAppChildPage({
        state,
        mapChildMsg: value => ({ tag: 'pageRequestForInformationEdit', value }),
        childStatePath: ['pages', 'requestForInformationEdit'],
        childUpdate: PageRequestForInformationEdit.component.update,
        childGetMetadata: PageRequestForInformationEdit.component.getMetadata,
        childMsg: msg.value
      });

    case 'pageRequestForInformationView':
      return updateAppChildPage({
        state,
        mapChildMsg: value => ({ tag: 'pageRequestForInformationView', value }),
        childStatePath: ['pages', 'requestForInformationView'],
        childUpdate: PageRequestForInformationView.component.update,
        childGetMetadata: PageRequestForInformationView.component.getMetadata,
        childMsg: msg.value
      });

    case 'pageRequestForInformationPreview':
      return updateAppChildPage({
        state,
        mapChildMsg: value => ({ tag: 'pageRequestForInformationPreview', value }),
        childStatePath: ['pages', 'requestForInformationPreview'],
        childUpdate: PageRequestForInformationPreview.component.update,
        childGetMetadata: PageRequestForInformationPreview.component.getMetadata,
        childMsg: msg.value
      });

    case 'pageRequestForInformationRespond':
      return updateAppChildPage({
        state,
        mapChildMsg: value => ({ tag: 'pageRequestForInformationRespond', value }),
        childStatePath: ['pages', 'requestForInformationRespond'],
        childUpdate: PageRequestForInformationRespond.component.update,
        childGetMetadata: PageRequestForInformationRespond.component.getMetadata,
        childMsg: msg.value
      });

    case 'pageRequestForInformationList':
      return updateAppChildPage({
        state,
        mapChildMsg: value => ({ tag: 'pageRequestForInformationList', value }),
        childStatePath: ['pages', 'requestForInformationList'],
        childUpdate: PageRequestForInformationList.component.update,
        childGetMetadata: PageRequestForInformationList.component.getMetadata,
        childMsg: msg.value
      });

    case 'pageMarkdown':
      return updateAppChildPage({
        state,
        mapChildMsg: value => ({ tag: 'pageMarkdown', value }),
        childStatePath: ['pages', 'markdown'],
        childUpdate: PageMarkdown.component.update,
        childGetMetadata: PageMarkdown.component.getMetadata,
        childMsg: msg.value
      });

    case 'pageNotice':
      return updateAppChildPage({
        state,
        mapChildMsg: value => ({ tag: 'pageNotice', value }),
        childStatePath: ['pages', 'notice'],
        childUpdate: PageNotice.component.update,
        childGetMetadata: PageNotice.component.getMetadata,
        childMsg: msg.value
      });

    case 'pageFeedback':
      return updateAppChildPage({
        state,
        mapChildMsg: value => ({ tag: 'pageFeedback', value }),
        childStatePath: ['pages', 'feedback'],
        childUpdate: PageFeedback.component.update,
        childGetMetadata: PageFeedback.component.getMetadata,
        childMsg: msg.value
      });

    // Handle these framework Msgs so we get compile-time guarantees
    // that all of our possible Msgs have been handled.
    case '@newUrl':
    case '@replaceUrl':
    case '@newRoute':
    case '@replaceRoute':
      return [state];
  }
};

export default update;
