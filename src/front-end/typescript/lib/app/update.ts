import { Msg, State } from 'front-end/lib/app/types';
import { Dispatch, Immutable, immutable, redirect, Update, updateAppChild } from 'front-end/lib/framework';
import { deleteSession, getSession, Session } from 'front-end/lib/http/api';
import * as PageChangePassword from 'front-end/lib/pages/change-password';
import * as PageForgotPassword from 'front-end/lib/pages/forgot-password';
import * as PageLanding from 'front-end/lib/pages/landing';
import * as PageNoticeChangePassword from 'front-end/lib/pages/notice/change-password';
import * as PageNoticeForgotPassword from 'front-end/lib/pages/notice/forgot-password';
import * as PageNoticeNotFound from 'front-end/lib/pages/notice/not-found';
import * as PageNoticeResetPassword from 'front-end/lib/pages/notice/reset-password';
import * as PageProfile from 'front-end/lib/pages/profile';
import * as PageRequestForInformationList from 'front-end/lib/pages/request-for-information-list';
import * as PageResetPassword from 'front-end/lib/pages/reset-password';
import * as PageSignIn from 'front-end/lib/pages/sign-in';
import * as PageSignOut from 'front-end/lib/pages/sign-out';
import * as PageSignUpBuyer from 'front-end/lib/pages/sign-up/buyer';
import * as PageSignUpProgramStaff from 'front-end/lib/pages/sign-up/program-staff';
import * as PageSignUpVendor from 'front-end/lib/pages/sign-up/vendor';
import * as PageTermsAndConditions from 'front-end/lib/pages/terms-and-conditions';
import * as PageUserList from 'front-end/lib/pages/user-list';
import { get } from 'lodash';
import { ValidOrInvalid } from 'shared/lib/validators';

function setSession(state: Immutable<State>, validated: ValidOrInvalid<Session, null>): Immutable<State> {
  return state.set('session', validated.tag === 'valid' ? validated.value : undefined);
};

async function signOut(state: Immutable<State>, dispatch: Dispatch<Msg>, path: string, signOut: boolean): Promise<Immutable<State>> {
  if (signOut) {
    state = setSession(state, await deleteSession());
  }
  dispatch(redirect(path));
  return state;
};

function startTransition(state: Immutable<State>): Immutable<State> {
  return state.set('inTransition', true);
}

function endTransition(state: Immutable<State>): Immutable<State> {
  return state.set('inTransition', false);
}

const update: Update<State, Msg> = (state, msg) => {
  switch (msg.tag) {

    case '@beforeIncomingPage':
      return [
        state,
        async () => {
          // Refresh the front-end's view of the current session.
          return setSession(state, await getSession());
        }
      ];

    case '@incomingPage':
      state = startTransition(state);
      return [
        state,
        async dispatch => {
          state = endTransition(state);
          const outgoingPage = state.activePage;
          const auth = msg.value.auth;
          switch (auth.level.tag) {
            case 'any':
              break;
            case 'signedIn':
              if (!get(state.session, 'user')) {
                return signOut(state, dispatch, auth.redirect, auth.signOut);
              } else {
                break;
              }
            case 'signedOut':
              if (get(state.session, 'user')) {
                return signOut(state, dispatch, auth.redirect, auth.signOut);
              } else {
                break;
              }
            case 'userType':
              if (!auth.level.value.includes(get(state.session, ['user', 'type']))) {
                return signOut(state, dispatch, auth.redirect, auth.signOut);
              } else {
                break;
              }
          }
          // Scroll to the top-left of the page for page changes.
          if (window.scrollTo) { window.scrollTo(0, 0); }
          state = state
            .set('activePage', msg.value.page)
            // We switch this flag to true so the view function knows to display the page.
            .set('ready', true);
          // Set the new active page's state.
          switch (msg.value.page.tag) {
            case 'landing':
              state = state.setIn(['pages', 'landing'], immutable(await PageLanding.init(null)));
              break;
            case 'signIn':
              state = state.setIn(['pages', 'signIn'], immutable(await PageSignIn.init(null)));
              break;
            case 'signUpBuyer':
              state = state.setIn(['pages', 'signUpBuyer'], immutable(await PageSignUpBuyer.init(msg.value.page.value)));
              break;
            case 'signUpVendor':
              state = state.setIn(['pages', 'signUpVendor'], immutable(await PageSignUpVendor.init(msg.value.page.value)));
              break;
            case 'signUpProgramStaff':
              state = state.setIn(['pages', 'signUpProgramStaff'], immutable(await PageSignUpProgramStaff.init(msg.value.page.value)));
              break;
            case 'signOut':
              state = state.setIn(['pages', 'signOut'], immutable(await PageSignOut.init(null)));
              break;
            case 'changePassword':
              state = state.setIn(['pages', 'changePassword'], immutable(await PageChangePassword.init(msg.value.page.value)));
              break;
            case 'resetPassword':
              state = state.setIn(['pages', 'resetPassword'], immutable(await PageResetPassword.init(msg.value.page.value)));
              break;
            case 'forgotPassword':
              state = state.setIn(['pages', 'forgotPassword'], immutable(await PageForgotPassword.init(null)));
              break;
            case 'profile':
              state = state.setIn(['pages', 'profile'], immutable(await PageProfile.init(msg.value.page.value)));
              break;
            case 'userList':
              state = state.setIn(['pages', 'userList'], immutable(await PageUserList.init(msg.value.page.value)));
              break;
            case 'requestForInformationList':
              state = state.setIn(['pages', 'requestForInformationList'], immutable(await PageRequestForInformationList.init(msg.value.page.value)));
              break;
            case 'termsAndConditions':
              state = state.setIn(['pages', 'termsAndConditions'], immutable(await PageTermsAndConditions.init(msg.value.page.value)));
              break;
            case 'noticeChangePassword':
              state = state.setIn(['pages', 'noticeChangePassword'], immutable(await PageNoticeChangePassword.init(null)));
              break;
            case 'noticeResetPassword':
              state = state.setIn(['pages', 'noticeResetPassword'], immutable(await PageNoticeResetPassword.init(null)));
              break;
            case 'noticeForgotPassword':
              state = state.setIn(['pages', 'noticeForgotPassword'], immutable(await PageNoticeForgotPassword.init(null)));
              break;
            case 'noticeNotFound':
              state = state.setIn(['pages', 'noticeNotFound'], immutable(await PageNoticeNotFound.init(null)));
              break;
          }
          // Unset the previous page's state.
          // Ensure we don't unintentionally overwrite the active page's state.
          if (outgoingPage.tag !== msg.value.page.tag) {
            return state.setIn(['pages', outgoingPage.tag], undefined);
          } else {
            return state;
          }
        }
      ];

    case 'toggleIsNavOpen':
      return [state.set('isNavOpen', msg.value === undefined ? !state.isNavOpen : msg.value)];

    // Delegate this message to the necessary pages.
    case 'updateFixedBarBottom':
      if (msg.value === state.fixedBarBottom) {
        return [state];
      }
      state = state.set('fixedBarBottom', msg.value);
      if (state.pages.signUpBuyer) {
        state = state.setIn(['pages', 'signUpBuyer'], PageSignUpBuyer.update(state.pages.signUpBuyer, msg)[0]);
      }
      if (state.pages.signUpVendor) {
        state = state.setIn(['pages', 'signUpVendor'], PageSignUpVendor.update(state.pages.signUpVendor, msg)[0]);
      }
      if (state.pages.signUpProgramStaff) {
        state = state.setIn(['pages', 'signUpProgramStaff'], PageSignUpProgramStaff.update(state.pages.signUpProgramStaff, msg)[0]);
      }
      if (state.pages.termsAndConditions) {
        state = state.setIn(['pages', 'termsAndConditions'], PageTermsAndConditions.update(state.pages.termsAndConditions, msg)[0]);
      }
      return [state];

    case 'pageLanding':
      return updateAppChild({
        state,
        mapChildMsg: value => ({ tag: 'pageLanding', value }),
        childStatePath: ['pages', 'landing'],
        childUpdate: PageLanding.update,
        childMsg: msg.value
      });

    case 'pageSignIn':
      return updateAppChild({
        state,
        mapChildMsg: value => ({ tag: 'pageSignIn', value }),
        childStatePath: ['pages', 'signIn'],
        childUpdate: PageSignIn.update,
        childMsg: msg.value
      });

    case 'pageSignUpBuyer':
      return updateAppChild({
        state,
        mapChildMsg: value => ({ tag: 'pageSignUpBuyer', value }),
        childStatePath: ['pages', 'signUpBuyer'],
        childUpdate: PageSignUpBuyer.update,
        childMsg: msg.value
      });

    case 'pageSignUpVendor':
      return updateAppChild({
        state,
        mapChildMsg: value => ({ tag: 'pageSignUpVendor', value }),
        childStatePath: ['pages', 'signUpVendor'],
        childUpdate: PageSignUpVendor.update,
        childMsg: msg.value
      });

    case 'pageSignUpProgramStaff':
      return updateAppChild({
        state,
        mapChildMsg: value => ({ tag: 'pageSignUpProgramStaff', value }),
        childStatePath: ['pages', 'signUpProgramStaff'],
        childUpdate: PageSignUpProgramStaff.update,
        childMsg: msg.value
      });

    case 'pageSignOut':
      return updateAppChild({
        state,
        mapChildMsg: value => ({ tag: 'pageSignOut', value }),
        childStatePath: ['pages', 'signOut'],
        childUpdate: PageSignOut.update,
        childMsg: msg.value
      });

    case 'pageChangePassword':
      return updateAppChild({
        state,
        mapChildMsg: value => ({ tag: 'pageChangePassword', value }),
        childStatePath: ['pages', 'changePassword'],
        childUpdate: PageChangePassword.update,
        childMsg: msg.value
      });

    case 'pageResetPassword':
      return updateAppChild({
        state,
        mapChildMsg: value => ({ tag: 'pageResetPassword', value }),
        childStatePath: ['pages', 'resetPassword'],
        childUpdate: PageResetPassword.update,
        childMsg: msg.value
      });

    case 'pageForgotPassword':
      return updateAppChild({
        state,
        mapChildMsg: value => ({ tag: 'pageForgotPassword', value }),
        childStatePath: ['pages', 'forgotPassword'],
        childUpdate: PageForgotPassword.update,
        childMsg: msg.value
      });

    case 'pageProfile':
      return updateAppChild({
        state,
        mapChildMsg: value => ({ tag: 'pageProfile', value }),
        childStatePath: ['pages', 'profile'],
        childUpdate: PageProfile.update,
        childMsg: msg.value
      });

    case 'pageUserList':
      return updateAppChild({
        state,
        mapChildMsg: value => ({ tag: 'pageUserList', value }),
        childStatePath: ['pages', 'userList'],
        childUpdate: PageUserList.update,
        childMsg: msg.value
      });

    case 'pageRequestForInformationList':
      return updateAppChild({
        state,
        mapChildMsg: value => ({ tag: 'pageRequestForInformationList', value }),
        childStatePath: ['pages', 'requestForInformationList'],
        childUpdate: PageRequestForInformationList.update,
        childMsg: msg.value
      });

    case 'pageTermsAndConditions':
      return updateAppChild({
        state,
        mapChildMsg: value => ({ tag: 'pageTermsAndConditions', value }),
        childStatePath: ['pages', 'termsAndConditions'],
        childUpdate: PageTermsAndConditions.update,
        childMsg: msg.value
      });

    case 'pageNoticeChangePassword':
      return updateAppChild({
        state,
        mapChildMsg: value => ({ tag: 'pageNoticeChangePassword', value }),
        childStatePath: ['pages', 'noticeChangePassword'],
        childUpdate: PageNoticeChangePassword.update,
        childMsg: msg.value
      });

    case 'pageNoticeResetPassword':
      return updateAppChild({
        state,
        mapChildMsg: value => ({ tag: 'pageNoticeResetPassword', value }),
        childStatePath: ['pages', 'noticeResetPassword'],
        childUpdate: PageNoticeResetPassword.update,
        childMsg: msg.value
      });

    case 'pageNoticeForgotPassword':
      return updateAppChild({
        state,
        mapChildMsg: value => ({ tag: 'pageNoticeForgotPassword', value }),
        childStatePath: ['pages', 'noticeForgotPassword'],
        childUpdate: PageNoticeForgotPassword.update,
        childMsg: msg.value
      });

    case 'pageNoticeNotFound':
      return updateAppChild({
        state,
        mapChildMsg: value => ({ tag: 'pageNoticeNotFound', value }),
        childStatePath: ['pages', 'noticeNotFound'],
        childUpdate: PageNoticeNotFound.update,
        childMsg: msg.value
      });

    default:
      return [state];
  }
};

export default update;
