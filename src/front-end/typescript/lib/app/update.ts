import { Msg, State } from 'front-end/lib/app/types';
import { AuthLevel, immutable, redirect, Update, updateAppChild } from 'front-end/lib/framework';
import { deleteSession, getSession, Session } from 'front-end/lib/http/api';
import * as PageChangePassword from 'front-end/lib/pages/change-password';
import * as PageLanding from 'front-end/lib/pages/landing';
import * as PageLoading from 'front-end/lib/pages/loading';
import * as PageSay from 'front-end/lib/pages/say';
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
          const currentPageTag = state.getIn(['activePage', 'tag']);
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
            case 'loading':
              state = state.setIn(['pages', 'loading'], immutable(await PageLoading.init(null)));
              break;
            case 'signIn':
              state = state.setIn(['pages', 'signIn'], immutable(await PageSignIn.init(null)));
              break;
            case 'signUpBuyer':
              let signUpBuyerParams = {};
              if (currentPageTag === 'signUpVendor' && state.pages.signUpVendor) {
                signUpBuyerParams = {
                  accountInformation: state.pages.signUpVendor.accountInformation.set('userType', UserType.Buyer)
                };
              }
              state = state.setIn(['pages', 'signUpBuyer'], immutable(await PageSignUpBuyer.init(signUpBuyerParams)));
              break;
            case 'signUpVendor':
              let signUpVendorParams = {};
              if (currentPageTag === 'signUpBuyer' && state.pages.signUpBuyer) {
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
            case 'say':
              state = state.setIn(['pages', 'say'], immutable(await PageSay.init(msg.value.page.value)));
              break;
            default:
              break;
          }
          // Unset the previous page's state.
          return state.setIn(['pages', currentPageTag], undefined);
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

    case 'pageLoading':
      return updateAppChild({
        state,
        mapChildMsg: value => ({ tag: 'pageLoading', value }),
        childStatePath: ['pages', 'loading'],
        childUpdate: PageLoading.update,
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

    case 'pageSay':
      return updateAppChild({
        state,
        mapChildMsg: value => ({ tag: 'pageSay', value }),
        childStatePath: ['pages', 'say'],
        childUpdate: PageSay.update,
        childMsg: msg.value
      });

    // TODO remove
    default:
      return [state];
  }
};

export default update;
