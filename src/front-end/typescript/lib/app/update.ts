import { Msg, State } from 'front-end/lib/app/types';
import { immutable, Update, updateChild } from 'front-end/lib/framework';
import * as PageLanding from 'front-end/lib/pages/landing';
import * as PageLoading from 'front-end/lib/pages/loading';
import * as PageSay from 'front-end/lib/pages/say';
import * as PageSignUp from 'front-end/lib/pages/sign-up';

const update: Update<State, Msg> = (state, msg) => {
  switch (msg.tag) {

    case '@incomingPage':
      return [
        state,
        (async () => {
          // Clear the current active page's state.
          const currentActivePage = state.getIn(['activePage', 'tag']);
          state = state
            .setIn(['pages', currentActivePage], undefined)
            .set('activePage', msg.value);
          // Set the new active page's state.
          // TODO why does the type system not care if these values aren't immutable?
          switch (msg.value.tag) {
            case 'landing':
              return state.setIn(['pages', 'landing'], immutable(await PageLanding.init(undefined)));
            case 'loading':
              return state.setIn(['pages', 'loading'], immutable(await PageLoading.init(null)));
            case 'signUp':
              return state.setIn(['pages', 'signUp'], immutable(await PageSignUp.init(null)));
            case 'say':
              return state.setIn(['pages', 'say'], immutable(await PageSay.init(msg.value.value)));
            default:
              return state;
          }
        })()
      ];

    case 'pageLandingMsg':
      return updateChild({
        state,
        childStatePath: ['pages', 'landing'],
        childUpdate: PageLanding.update,
        childMsg: msg.value
      });

    case 'pageLoadingMsg':
      return updateChild({
        state,
        childStatePath: ['pages', 'loading'],
        childUpdate: PageLoading.update,
        childMsg: msg.value
      });

    case 'pageSignUpMsg':
      return updateChild({
        state,
        childStatePath: ['pages', 'signUp'],
        childUpdate: PageSignUp.update,
        childMsg: msg.value
      });

    case 'pageSayMsg':
      return updateChild({
        state,
        childStatePath: ['pages', 'say'],
        childUpdate: PageSay.update,
        childMsg: msg.value
      });

    default:
      return [state];
  }
};

export default update;
