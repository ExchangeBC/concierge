import { Msg, Route, Session, State } from 'front-end/lib/app/types';
import { Dispatch, Immutable, initAppChildPage, PageModal, Update, updateAppChildPage } from 'front-end/lib/framework';
import { getSession } from 'front-end/lib/http/api';
import * as PageChangePassword from 'front-end/lib/pages/change-password';
import * as PageFeedback from 'front-end/lib/pages/feedback';
import * as PageForgotPassword from 'front-end/lib/pages/forgot-password';
import * as PageLanding from 'front-end/lib/pages/landing';
import * as PageMarkdown from 'front-end/lib/pages/markdown';
import * as PageNotice from 'front-end/lib/pages/notice';
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
import * as PageUserList from 'front-end/lib/pages/user/list';
import * as PageUserView from 'front-end/lib/pages/user/view';
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
  const defaultPageInitParams = {
    state,
    dispatch,
    getSharedState(state: Immutable<State>) {
      return state.shared;
    },
    setModal(state: Immutable<State>, modal: PageModal<Msg>) {
      state = state.setIn(['modal', 'open'], !!modal);
      return modal
        ? state.setIn(['modal', 'content'], modal)
        : state;
    }
  };

  switch (route.tag) {

    case 'landing':
      return await initAppChildPage({
        ...defaultPageInitParams,
        childStatePath: ['pages', 'landing'],
        childRouteParams: route.value,
        childInit: PageLanding.component.init,
        childGetMetadata: PageLanding.component.getMetadata,
        childGetModal: PageLanding.component.getModal,
        mapChildMsg(value) {
          return { tag: 'pageLanding' as 'pageLanding', value };
        }
      });

    case 'signIn':
      return await initAppChildPage({
        ...defaultPageInitParams,
        childStatePath: ['pages', 'signIn'],
        childRouteParams: route.value,
        childInit: PageSignIn.component.init,
        childGetMetadata: PageSignIn.component.getMetadata,
        childGetModal: PageSignIn.component.getModal,
        mapChildMsg(value) {
          return { tag: 'pageSignIn' as 'pageSignIn', value };
        }
      });

    case 'signUpBuyer':
      return await initAppChildPage({
        ...defaultPageInitParams,
        childStatePath: ['pages', 'signUpBuyer'],
        childRouteParams: route.value,
        childInit: PageSignUpBuyer.component.init,
        childGetMetadata: PageSignUpBuyer.component.getMetadata,
        childGetModal: PageSignUpBuyer.component.getModal,
        mapChildMsg(value) {
          return { tag: 'pageSignUpBuyer' as 'pageSignUpBuyer', value };
        }
      });

    case 'signUpVendor':
      return await initAppChildPage({
        ...defaultPageInitParams,
        childStatePath: ['pages', 'signUpVendor'],
        childRouteParams: route.value,
        childInit: PageSignUpVendor.component.init,
        childGetMetadata: PageSignUpVendor.component.getMetadata,
        childGetModal: PageSignUpVendor.component.getModal,
        mapChildMsg(value) {
          return { tag: 'pageSignUpVendor' as 'pageSignUpVendor', value };
        }
      });

    case 'signUpProgramStaff':
      return await initAppChildPage({
        ...defaultPageInitParams,
        childStatePath: ['pages', 'signUpProgramStaff'],
        childRouteParams: route.value,
        childInit: PageSignUpProgramStaff.component.init,
        childGetMetadata: PageSignUpProgramStaff.component.getMetadata,
        childGetModal: PageSignUpProgramStaff.component.getModal,
        mapChildMsg(value) {
          return { tag: 'pageSignUpProgramStaff' as 'pageSignUpProgramStaff', value };
        }
      });

    case 'signOut':
      return await initAppChildPage({
        ...defaultPageInitParams,
        childStatePath: ['pages', 'signOut'],
        childRouteParams: route.value,
        childInit: PageSignOut.component.init,
        childGetMetadata: PageSignOut.component.getMetadata,
        childGetModal: PageSignOut.component.getModal,
        mapChildMsg(value) {
          return { tag: 'pageSignOut' as 'pageSignOut', value };
        }
      });

    case 'changePassword':
      return await initAppChildPage({
        ...defaultPageInitParams,
        childStatePath: ['pages', 'changePassword'],
        childRouteParams: route.value,
        childInit: PageChangePassword.component.init,
        childGetMetadata: PageChangePassword.component.getMetadata,
        childGetModal: PageChangePassword.component.getModal,
        mapChildMsg(value) {
          return { tag: 'pageChangePassword' as 'pageChangePassword', value };
        }
      });

    case 'resetPassword':
      return await initAppChildPage({
        ...defaultPageInitParams,
        childStatePath: ['pages', 'resetPassword'],
        childRouteParams: route.value,
        childInit: PageResetPassword.component.init,
        childGetMetadata: PageResetPassword.component.getMetadata,
        childGetModal: PageResetPassword.component.getModal,
        mapChildMsg(value) {
          return { tag: 'pageResetPassword' as 'pageResetPassword', value };
        }
      });

    case 'forgotPassword':
      return await initAppChildPage({
        ...defaultPageInitParams,
        childStatePath: ['pages', 'forgotPassword'],
        childRouteParams: route.value,
        childInit: PageForgotPassword.component.init,
        childGetMetadata: PageForgotPassword.component.getMetadata,
        childGetModal: PageForgotPassword.component.getModal,
        mapChildMsg(value) {
          return { tag: 'pageForgotPassword' as 'pageForgotPassword', value };
        }
      });

    case 'termsAndConditions':
      return await initAppChildPage({
        ...defaultPageInitParams,
        childStatePath: ['pages', 'termsAndConditions'],
        childRouteParams: route.value,
        childInit: PageTermsAndConditions.component.init,
        childGetMetadata: PageTermsAndConditions.component.getMetadata,
        childGetModal: PageTermsAndConditions.component.getModal,
        mapChildMsg(value) {
          return { tag: 'pageTermsAndConditions' as 'pageTermsAndConditions', value };
        }
      });

    case 'userView':
      return await initAppChildPage({
        ...defaultPageInitParams,
        childStatePath: ['pages', 'userView'],
        childRouteParams: route.value,
        childInit: PageUserView.component.init,
        childGetMetadata: PageUserView.component.getMetadata,
        childGetModal: PageUserView.component.getModal,
        mapChildMsg(value) {
          return { tag: 'pageUserView' as 'pageUserView', value };
        }
      });

    case 'userList':
      return await initAppChildPage({
        ...defaultPageInitParams,
        childStatePath: ['pages', 'userList'],
        childRouteParams: route.value,
        childInit: PageUserList.component.init,
        childGetMetadata: PageUserList.component.getMetadata,
        childGetModal: PageUserList.component.getModal,
        mapChildMsg(value) {
          return { tag: 'pageUserList' as 'pageUserList', value };
        }
      });

    case 'requestForInformationCreate':
      return await initAppChildPage({
        ...defaultPageInitParams,
        childStatePath: ['pages', 'requestForInformationCreate'],
        childRouteParams: route.value,
        childInit: PageRequestForInformationCreate.component.init,
        childGetMetadata: PageRequestForInformationCreate.component.getMetadata,
        childGetModal: PageRequestForInformationCreate.component.getModal,
        mapChildMsg(value) {
          return { tag: 'pageRequestForInformationCreate' as 'pageRequestForInformationCreate', value };
        }
      });

    case 'requestForInformationEdit':
      return await initAppChildPage({
        ...defaultPageInitParams,
        childStatePath: ['pages', 'requestForInformationEdit'],
        childRouteParams: route.value,
        childInit: PageRequestForInformationEdit.component.init,
        childGetMetadata: PageRequestForInformationEdit.component.getMetadata,
        childGetModal: PageRequestForInformationEdit.component.getModal,
        mapChildMsg(value) {
          return { tag: 'pageRequestForInformationEdit' as 'pageRequestForInformationEdit', value };
        }
      });

    case 'requestForInformationView':
      return await initAppChildPage({
        ...defaultPageInitParams,
        childStatePath: ['pages', 'requestForInformationView'],
        childRouteParams: route.value,
        childInit: PageRequestForInformationView.component.init,
        childGetMetadata: PageRequestForInformationView.component.getMetadata,
        childGetModal: PageRequestForInformationView.component.getModal,
        mapChildMsg(value) {
          return { tag: 'pageRequestForInformationView' as 'pageRequestForInformationView', value };
        }
      });

    case 'requestForInformationPreview':
      return await initAppChildPage({
        ...defaultPageInitParams,
        childStatePath: ['pages', 'requestForInformationPreview'],
        childRouteParams: route.value,
        childInit: PageRequestForInformationPreview.component.init,
        childGetMetadata: PageRequestForInformationPreview.component.getMetadata,
        childGetModal: PageRequestForInformationPreview.component.getModal,
        mapChildMsg(value) {
          return { tag: 'pageRequestForInformationPreview' as 'pageRequestForInformationPreview', value };
        }
      });

    case 'requestForInformationRespond':
      return await initAppChildPage({
        ...defaultPageInitParams,
        childStatePath: ['pages', 'requestForInformationRespond'],
        childRouteParams: route.value,
        childInit: PageRequestForInformationRespond.component.init,
        childGetMetadata: PageRequestForInformationRespond.component.getMetadata,
        childGetModal: PageRequestForInformationRespond.component.getModal,
        mapChildMsg(value) {
          return { tag: 'pageRequestForInformationRespond' as 'pageRequestForInformationRespond', value };
        }
      });

    case 'requestForInformationList':
      return await initAppChildPage({
        ...defaultPageInitParams,
        childStatePath: ['pages', 'requestForInformationList'],
        childRouteParams: route.value,
        childInit: PageRequestForInformationList.component.init,
        childGetMetadata: PageRequestForInformationList.component.getMetadata,
        childGetModal: PageRequestForInformationList.component.getModal,
        mapChildMsg(value) {
          return { tag: 'pageRequestForInformationList' as 'pageRequestForInformationList', value };
        }
      });

    case 'markdown':
      return await initAppChildPage({
        ...defaultPageInitParams,
        childStatePath: ['pages', 'markdown'],
        childRouteParams: route.value,
        childInit: PageMarkdown.component.init,
        childGetMetadata: PageMarkdown.component.getMetadata,
        childGetModal: PageMarkdown.component.getModal,
        mapChildMsg(value) {
          return { tag: 'pageMarkdown' as 'pageMarkdown', value };
        }
      });

    case 'notice':
      return await initAppChildPage({
        ...defaultPageInitParams,
        childStatePath: ['pages', 'notice'],
        childRouteParams: route.value,
        childInit: PageNotice.component.init,
        childGetMetadata: PageNotice.component.getMetadata,
        childGetModal: PageNotice.component.getModal,
        mapChildMsg(value) {
          return { tag: 'pageNotice' as 'pageNotice', value };
        }
      });

    case 'feedback':
      return await initAppChildPage({
        ...defaultPageInitParams,
        childStatePath: ['pages', 'feedback'],
        childRouteParams: route.value,
        childInit: PageFeedback.component.init,
        childGetMetadata: PageFeedback.component.getMetadata,
        childGetModal: PageFeedback.component.getModal,
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
  const defaultPageUpdateParams = {
    state,
    setModal(state: Immutable<State>, modal: PageModal<Msg>) {
      state = state.setIn(['modal', 'open'], !!modal);
      return modal
        ? state.setIn(['modal', 'content'], modal)
        : state;
    }
  };

  switch (msg.tag) {

    case 'noop':
      return [state];

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

    case 'toggleModal':
      return [state.setIn(['modal', 'open'], !state.modal.open)];

    case 'pageLanding':
      return updateAppChildPage({
        ...defaultPageUpdateParams,
        mapChildMsg: value => ({ tag: 'pageLanding', value }),
        childStatePath: ['pages', 'landing'],
        childUpdate: PageLanding.component.update,
        childGetMetadata: PageLanding.component.getMetadata,
        childGetModal: PageLanding.component.getModal,
        childMsg: msg.value
      });

    case 'pageSignIn':
      return updateAppChildPage({
        ...defaultPageUpdateParams,
        mapChildMsg: value => ({ tag: 'pageSignIn', value }),
        childStatePath: ['pages', 'signIn'],
        childUpdate: PageSignIn.component.update,
        childGetMetadata: PageSignIn.component.getMetadata,
        childGetModal: PageSignIn.component.getModal,
        childMsg: msg.value
      });

    case 'pageSignUpBuyer':
      return updateAppChildPage({
        ...defaultPageUpdateParams,
        mapChildMsg: value => ({ tag: 'pageSignUpBuyer', value }),
        childStatePath: ['pages', 'signUpBuyer'],
        childUpdate: PageSignUpBuyer.component.update,
        childGetMetadata: PageSignUpBuyer.component.getMetadata,
        childGetModal: PageSignUpBuyer.component.getModal,
        childMsg: msg.value
      });

    case 'pageSignUpVendor':
      return updateAppChildPage({
        ...defaultPageUpdateParams,
        mapChildMsg: value => ({ tag: 'pageSignUpVendor', value }),
        childStatePath: ['pages', 'signUpVendor'],
        childUpdate: PageSignUpVendor.component.update,
        childGetMetadata: PageSignUpVendor.component.getMetadata,
        childGetModal: PageSignUpVendor.component.getModal,
        childMsg: msg.value
      });

    case 'pageSignUpProgramStaff':
      return updateAppChildPage({
        ...defaultPageUpdateParams,
        mapChildMsg: value => ({ tag: 'pageSignUpProgramStaff', value }),
        childStatePath: ['pages', 'signUpProgramStaff'],
        childUpdate: PageSignUpProgramStaff.component.update,
        childGetMetadata: PageSignUpProgramStaff.component.getMetadata,
        childGetModal: PageSignUpProgramStaff.component.getModal,
        childMsg: msg.value
      });

    case 'pageSignOut':
      return updateAppChildPage({
        ...defaultPageUpdateParams,
        mapChildMsg: value => ({ tag: 'pageSignOut', value }),
        childStatePath: ['pages', 'signOut'],
        childUpdate: PageSignOut.component.update,
        childGetMetadata: PageSignOut.component.getMetadata,
        childGetModal: PageSignOut.component.getModal,
        childMsg: msg.value
      });

    case 'pageChangePassword':
      return updateAppChildPage({
        ...defaultPageUpdateParams,
        mapChildMsg: value => ({ tag: 'pageChangePassword', value }),
        childStatePath: ['pages', 'changePassword'],
        childUpdate: PageChangePassword.component.update,
        childGetMetadata: PageChangePassword.component.getMetadata,
        childGetModal: PageChangePassword.component.getModal,
        childMsg: msg.value
      });

    case 'pageResetPassword':
      return updateAppChildPage({
        ...defaultPageUpdateParams,
        mapChildMsg: value => ({ tag: 'pageResetPassword', value }),
        childStatePath: ['pages', 'resetPassword'],
        childUpdate: PageResetPassword.component.update,
        childGetMetadata: PageResetPassword.component.getMetadata,
        childGetModal: PageResetPassword.component.getModal,
        childMsg: msg.value
      });

    case 'pageForgotPassword':
      return updateAppChildPage({
        ...defaultPageUpdateParams,
        mapChildMsg: value => ({ tag: 'pageForgotPassword', value }),
        childStatePath: ['pages', 'forgotPassword'],
        childUpdate: PageForgotPassword.component.update,
        childGetMetadata: PageForgotPassword.component.getMetadata,
        childGetModal: PageForgotPassword.component.getModal,
        childMsg: msg.value
      });

    case 'pageTermsAndConditions':
      return updateAppChildPage({
        ...defaultPageUpdateParams,
        mapChildMsg: value => ({ tag: 'pageTermsAndConditions', value }),
        childStatePath: ['pages', 'termsAndConditions'],
        childUpdate: PageTermsAndConditions.component.update,
        childGetMetadata: PageTermsAndConditions.component.getMetadata,
        childGetModal: PageTermsAndConditions.component.getModal,
        childMsg: msg.value
      });

    case 'pageUserView':
      return updateAppChildPage({
        ...defaultPageUpdateParams,
        mapChildMsg: value => ({ tag: 'pageUserView', value }),
        childStatePath: ['pages', 'userView'],
        childUpdate: PageUserView.component.update,
        childGetMetadata: PageUserView.component.getMetadata,
        childGetModal: PageUserView.component.getModal,
        childMsg: msg.value
      });

    case 'pageUserList':
      return updateAppChildPage({
        ...defaultPageUpdateParams,
        mapChildMsg: value => ({ tag: 'pageUserList', value }),
        childStatePath: ['pages', 'userList'],
        childUpdate: PageUserList.component.update,
        childGetMetadata: PageUserList.component.getMetadata,
        childGetModal: PageUserList.component.getModal,
        childMsg: msg.value
      });

    case 'pageRequestForInformationCreate':
      return updateAppChildPage({
        ...defaultPageUpdateParams,
        mapChildMsg: value => ({ tag: 'pageRequestForInformationCreate', value }),
        childStatePath: ['pages', 'requestForInformationCreate'],
        childUpdate: PageRequestForInformationCreate.component.update,
        childGetMetadata: PageRequestForInformationCreate.component.getMetadata,
        childGetModal: PageRequestForInformationCreate.component.getModal,
        childMsg: msg.value
      });

    case 'pageRequestForInformationEdit':
      return updateAppChildPage({
        ...defaultPageUpdateParams,
        mapChildMsg: value => ({ tag: 'pageRequestForInformationEdit', value }),
        childStatePath: ['pages', 'requestForInformationEdit'],
        childUpdate: PageRequestForInformationEdit.component.update,
        childGetMetadata: PageRequestForInformationEdit.component.getMetadata,
        childGetModal: PageRequestForInformationEdit.component.getModal,
        childMsg: msg.value
      });

    case 'pageRequestForInformationView':
      return updateAppChildPage({
        ...defaultPageUpdateParams,
        mapChildMsg: value => ({ tag: 'pageRequestForInformationView', value }),
        childStatePath: ['pages', 'requestForInformationView'],
        childUpdate: PageRequestForInformationView.component.update,
        childGetMetadata: PageRequestForInformationView.component.getMetadata,
        childGetModal: PageRequestForInformationView.component.getModal,
        childMsg: msg.value
      });

    case 'pageRequestForInformationPreview':
      return updateAppChildPage({
        ...defaultPageUpdateParams,
        mapChildMsg: value => ({ tag: 'pageRequestForInformationPreview', value }),
        childStatePath: ['pages', 'requestForInformationPreview'],
        childUpdate: PageRequestForInformationPreview.component.update,
        childGetMetadata: PageRequestForInformationPreview.component.getMetadata,
        childGetModal: PageRequestForInformationPreview.component.getModal,
        childMsg: msg.value
      });

    case 'pageRequestForInformationRespond':
      return updateAppChildPage({
        ...defaultPageUpdateParams,
        mapChildMsg: value => ({ tag: 'pageRequestForInformationRespond', value }),
        childStatePath: ['pages', 'requestForInformationRespond'],
        childUpdate: PageRequestForInformationRespond.component.update,
        childGetMetadata: PageRequestForInformationRespond.component.getMetadata,
        childGetModal: PageRequestForInformationRespond.component.getModal,
        childMsg: msg.value
      });

    case 'pageRequestForInformationList':
      return updateAppChildPage({
        ...defaultPageUpdateParams,
        mapChildMsg: value => ({ tag: 'pageRequestForInformationList', value }),
        childStatePath: ['pages', 'requestForInformationList'],
        childUpdate: PageRequestForInformationList.component.update,
        childGetMetadata: PageRequestForInformationList.component.getMetadata,
        childGetModal: PageRequestForInformationList.component.getModal,
        childMsg: msg.value
      });

    case 'pageMarkdown':
      return updateAppChildPage({
        ...defaultPageUpdateParams,
        mapChildMsg: value => ({ tag: 'pageMarkdown', value }),
        childStatePath: ['pages', 'markdown'],
        childUpdate: PageMarkdown.component.update,
        childGetMetadata: PageMarkdown.component.getMetadata,
        childGetModal: PageMarkdown.component.getModal,
        childMsg: msg.value
      });

    case 'pageNotice':
      return updateAppChildPage({
        ...defaultPageUpdateParams,
        mapChildMsg: value => ({ tag: 'pageNotice', value }),
        childStatePath: ['pages', 'notice'],
        childUpdate: PageNotice.component.update,
        childGetMetadata: PageNotice.component.getMetadata,
        childGetModal: PageNotice.component.getModal,
        childMsg: msg.value
      });

    case 'pageFeedback':
      return updateAppChildPage({
        ...defaultPageUpdateParams,
        mapChildMsg: value => ({ tag: 'pageFeedback', value }),
        childStatePath: ['pages', 'feedback'],
        childUpdate: PageFeedback.component.update,
        childGetMetadata: PageFeedback.component.getMetadata,
        childGetModal: PageFeedback.component.getModal,
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
