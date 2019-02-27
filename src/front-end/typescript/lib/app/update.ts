import { Msg, State } from 'front-end/lib/app/types';
import { AuthLevel, immutable, redirect, Update, updateAppChild } from 'front-end/lib/framework';
import { deleteSession, getSession, Session } from 'front-end/lib/http/api';
import * as PageLanding from 'front-end/lib/pages/landing';
import * as PageLoading from 'front-end/lib/pages/loading';
import * as PageSay from 'front-end/lib/pages/say';
import * as PageSignOut from 'front-end/lib/pages/sign-out';
import * as PageSignUp from 'front-end/lib/pages/sign-up';
import { get } from 'lodash';
import { ValidOrInvalid } from 'shared/lib/validators';

const update: Update<State, Msg> = (state, msg) => {
  switch (msg.tag) {

    case '@incomingPage':
      return [
        state,
        async dispatch => {
          // Clear the current active page's state.
          const currentActivePage = state.getIn(['activePage', 'tag']);
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
            case AuthLevel.SignedOut:
              if (get(state.session, 'user')) {
                signOut(auth.redirect, auth.signOut);
                return state;
              }
          }
          state = state
            .setIn(['pages', currentActivePage], undefined)
            .set('activePage', msg.value.page)
            // We switch this flag to true so the view function knows to display the page.
            .set('ready', true);
          // Set the new active page's state.
          switch (msg.value.page.tag) {
            case 'landing':
              return state.setIn(['pages', 'landing'], immutable(await PageLanding.init(undefined)));
            case 'loading':
              return state.setIn(['pages', 'loading'], immutable(await PageLoading.init(null)));
            case 'signUp':
              return state.setIn(['pages', 'signUp'], immutable(await PageSignUp.init(null)));
            case 'signOut':
              return state.setIn(['pages', 'signOut'], immutable(await PageSignOut.init(null)));
            case 'say':
              return state.setIn(['pages', 'say'], immutable(await PageSay.init(msg.value.page.value)));
            default:
              return state;
          }
        }
      ];

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

    case 'pageSignUp':
      return updateAppChild({
        state,
        mapChildMsg: value => ({ tag: 'pageSignUp', value }),
        childStatePath: ['pages', 'signUp'],
        childUpdate: PageSignUp.update,
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

    case 'pageSay':
      return updateAppChild({
        state,
        mapChildMsg: value => ({ tag: 'pageSay', value }),
        childStatePath: ['pages', 'say'],
        childUpdate: PageSay.update,
        childMsg: msg.value
      });

    default:
      return [state];
  }
};

export default update;
