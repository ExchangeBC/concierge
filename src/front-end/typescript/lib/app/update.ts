import { Msg, State } from 'front-end/lib/app/types';
import { AuthLevel, immutable, redirect, Update, updateAppChild } from 'front-end/lib/framework';
import { deleteSession, getSession, Session } from 'front-end/lib/http/api';
import * as PageChangePassword from 'front-end/lib/pages/change-password';
import * as PageForgotPassword from 'front-end/lib/pages/forgot-password';
import * as PageLanding from 'front-end/lib/pages/landing';
import * as PageNoticeChangePassword from 'front-end/lib/pages/notice/change-password';
import * as PageNoticeForgotPassword from 'front-end/lib/pages/notice/forgot-password';
import * as PageNoticeNotFound from 'front-end/lib/pages/notice/not-found';
import * as PageNoticeResetPassword from 'front-end/lib/pages/notice/reset-password';
import * as PageResetPassword from 'front-end/lib/pages/reset-password';
import * as PageSignIn from 'front-end/lib/pages/sign-in';
import * as PageSignOut from 'front-end/lib/pages/sign-out';
import * as PageSignUpBuyer from 'front-end/lib/pages/sign-up/buyer';
import * as PageSignUpProgramStaff from 'front-end/lib/pages/sign-up/program-staff';
import * as PageSignUpVendor from 'front-end/lib/pages/sign-up/vendor';
import { get } from 'lodash';
import { UserType } from 'shared/lib/types';
import { ValidOrInvalid } from 'shared/lib/validators';

const update: Update<State, Msg> = (state, msg) => {
  switch (msg.tag) {

    case '@incomingPage':
      return [
        state,
        async dispatch => {
          // Clear the current active page's state.
          const outgoingPage = state.activePage;
          const setSession = (validated: ValidOrInvalid<Session, null>) => {
            state = state.set('session', validated.tag === 'valid' ? validated.value : undefined);
          };
          await setSession(await getSession());
          const signOut = async (path: string, signOut: boolean) => {
            if (signOut) {
              await setSession(await deleteSession());
            }
            dispatch(redirect(path));
          };
          const auth = msg.value.auth;
          switch (auth.level) {
            case AuthLevel.Any:
              break;
            case AuthLevel.SignedIn:
              if (!get(state.session, 'user')) {
                signOut(auth.redirect, auth.signOut);
                return state;
              }
              break;
            case AuthLevel.SignedOut:
              if (get(state.session, 'user')) {
                signOut(auth.redirect, auth.signOut);
                return state;
              }
              break;
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
              let signUpBuyerParams = {};
              if (outgoingPage.tag === 'signUpVendor' && state.pages.signUpVendor) {
                signUpBuyerParams = {
                  accountInformation: state.pages.signUpVendor.accountInformation.set('userType', UserType.Buyer)
                };
              }
              state = state.setIn(['pages', 'signUpBuyer'], immutable(await PageSignUpBuyer.init(signUpBuyerParams)));
              break;
            case 'signUpVendor':
              let signUpVendorParams = {};
              if (outgoingPage.tag === 'signUpBuyer' && state.pages.signUpBuyer) {
                signUpVendorParams = {
                  accountInformation: state.pages.signUpBuyer.accountInformation.set('userType', UserType.Vendor)
                };
              }
              state = state.setIn(['pages', 'signUpVendor'], immutable(await PageSignUpVendor.init(signUpVendorParams)));
              break;
            case 'signUpProgramStaff':
              state = state.setIn(['pages', 'signUpProgramStaff'], immutable(await PageSignUpProgramStaff.init({})));
              break;
            case 'signOut':
              state = state.setIn(['pages', 'signOut'], immutable(await PageSignOut.init(null)));
              break;
            case 'changePassword':
              state = state.setIn(['pages', 'changePassword'], immutable(await PageChangePassword.init({
                userId: get(state.session, ['user', 'id'], '')
              })));
              break;
            case 'resetPassword':
              state = state.setIn(['pages', 'resetPassword'], immutable(await PageResetPassword.init(msg.value.page.value)));
              break;
            case 'forgotPassword':
              state = state.setIn(['pages', 'forgotPassword'], immutable(await PageForgotPassword.init(null)));
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
            default:
              // Reset outgoing page, essentially do nothing.
              // TODO clean up this logic.
              return state.set('activePage', outgoingPage);
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

    // TODO remove
    default:
      return [state];
  }
};

export default update;
