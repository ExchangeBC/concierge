import { Record } from 'immutable';
import { get } from 'lodash';
import React from 'react';
import { ADT, App, AppMsg, ComponentView, Dispatch, Init, mapDispatch, Router, Update } from './lib/framework';
import * as PageLoading from './pages/loading';
import * as PageLoadingTwo from './pages/loading-two';
import * as PageSay from './pages/say';

/* TODO
 * - Better PageState and PageMsg types.
 * - Better PageMsg dispatching from App's view.
 * - Need `updateChild` helper method.
 * - Need `viewChild` helper method.
 * - Use enum for Route ID instead of a string. Possible to use ADT to encapsulate params.
 *   - type Page = ADT<'say', { message: string; }> | ...
 *   - type AppMsg = ADT<'foo'> | RouteMsg<Page>
 * - Tag PageMsgs more verbosely using the Elm style.
 */

type Page = ADT<'loading', null> | ADT<'loadingTwo', null> | ADT<'say', PageSay.Params>;

interface State {
  activePage: Page;
  pages: {
    loading?: PageLoading.State;
    loadingTwo?: PageLoadingTwo.State;
    say?: PageSay.State;
  };
}

type CustomMsg = ADT<'pageLoadingMsg', PageLoading.Msg> | ADT<'pageLoadingTwoMsg', PageLoadingTwo.Msg> | ADT<'pageSayMsg', PageSay.Msg>;

type Msg = AppMsg<CustomMsg, Page>;

export const init: Init<null, State> = async () => {
  return {
    activePage: { tag: 'loading', data: null },
    pages: {
      loading: await PageLoading.init(null)
    }
  };
};

export const update: Update<State, Msg> = (state, msg) => {
  switch (msg.tag) {

    case '@route':
      return [
        state,
        (async () => {
          // Clear the current active page's state.
          const currentActivePage = state.getIn(['activePage', 'tag']);
          state = state
            .setIn(['pages', currentActivePage], undefined)
            .set('activePage', msg.data);
          // Set the new active page's state.
          switch (msg.data.tag) {
            case 'loading':
              return state.setIn(['pages', 'loading'], await PageLoading.init(null));
            case 'loadingTwo':
              return state.setIn(['pages', 'loadingTwo'], await PageLoadingTwo.init(null));
            case 'say':
              return state.setIn(['pages', 'say'], await PageSay.init(msg.data.data));
            default:
              return state;
          }
        })()
      ];

    case 'pageLoadingMsg':
      const pageLoadingState = state.getIn(['pages', 'loading']);
      if (!pageLoadingState) { return [state]; }
      const [newLoadingState, asyncNewLoadingState] = PageLoading.update(Record(pageLoadingState)(), msg.data);
      state = state.setIn(['pages', 'loading'], newLoadingState.toJS());
      return [
        state,
        (async () => {
          const newLoadingState = await asyncNewLoadingState;
          if (!newLoadingState) { return state; }
          return state.setIn(['pages', 'loading'], newLoadingState.toJS());
        })()
      ];

    case 'pageLoadingTwoMsg':
      const pageLoadingTwoState = state.getIn(['pages', 'loadingTwo']);
      if (!pageLoadingTwoState) { return [state]; }
      const [newLoadingTwoState, asyncNewLoadingTwoState] = PageLoadingTwo.update(Record(pageLoadingTwoState)(), msg.data);
      state = state.setIn(['pages', 'loadingTwo'], newLoadingTwoState.toJS());
      return [
        state,
        (async () => {
          const newLoadingTwoState = await asyncNewLoadingTwoState;
          if (!newLoadingTwoState) { return state; }
          return state.setIn(['pages', 'loadingTwo'], newLoadingTwoState.toJS());
        })()
      ];

    case 'pageSayMsg':
      const pageSayState = state.getIn(['pages', 'say']);
      if (!pageSayState) { return [state]; }
      const [newSayState, asyncNewSayState] = PageSay.update(Record(pageSayState)(), msg.data);
      state = state.setIn(['pages', 'say'], newSayState.toJS());
      return [
        state,
        (async () => {
          const newSayState = await asyncNewSayState;
          if (!newSayState) { return state; }
          return state.setIn(['pages', 'say'], newSayState.toJS());
        })()
      ];

    default:
      return [state];
  }
};

const ViewActivePage: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const jsState = state.toJS();
  const dispatchLoading: Dispatch<PageLoading.Msg> = mapDispatch(dispatch, data => ({ tag: 'pageLoadingMsg' as 'pageLoadingMsg', data }));
  const dispatchLoadingTwo: Dispatch<PageLoadingTwo.Msg> = mapDispatch(dispatch, data => ({ tag: 'pageLoadingTwoMsg' as 'pageLoadingTwoMsg', data }));
  const dispatchSay: Dispatch<PageSay.Msg> = mapDispatch(dispatch, data => ({ tag: 'pageSayMsg' as 'pageSayMsg', data }));
  switch (jsState.activePage.tag) {
    case 'loading':
      return (<PageLoading.view dispatch={dispatchLoading} state={jsState.pages.loading} />);
    case 'loadingTwo':
      return (<PageLoadingTwo.view dispatch={dispatchLoadingTwo} state={jsState.pages.loadingTwo} />);
    case 'say':
      return (<PageSay.view dispatch={dispatchSay} state={jsState.pages.say} />);
    default:
      return (<div>Undefined Page: {jsState.activePage.tag}</div>);
  }
}

export const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  return (
    <div>
      <h1>Demo App With Routing</h1>
      <button onClick={() => dispatch({ tag: '@newUrl', data: '/say/hi' })}>
        {`Say "hi"`}
      </button>
      <button onClick={() => dispatch({ tag: '@newUrl', data: '/say/hello' })}>
        {`Say "hello"`}
      </button>
      <button onClick={() => dispatch({ tag: '@newUrl', data: '/loading' })}>
        Loading
      </button>
      <button onClick={() => dispatch({ tag: '@newUrl', data: '/loading-two' })}>
        Loading Two
      </button>
      <hr />
      <ViewActivePage state={state} dispatch={dispatch} />
    </div>
  );
};

export const router: Router<Page> = {

  routes: [
    {
      path: '/loading',
      pageId: 'loading'
    },
    {
      path: '/loading-two',
      pageId: 'loadingTwo'
    },
    {
      path: '/say/:message',
      pageId: 'say'
    },
    {
      path: '*',
      pageId: 'notFound'
    }
  ],

  toPage(pageId, params) {
    switch (pageId) {
      case 'loading':
        return {
          tag: 'loading',
          data: null
        };
      case 'loadingTwo':
        return {
          tag: 'loadingTwo',
          data: null
        };
      case 'say':
        return {
          tag: 'say',
          data: {
            message: get(params, 'message', '')
          }
        };
      default:
        return {
          tag: 'say',
          data: {
            message: 'Not Found'
          }
        };
    }
  }

};

export const app: App<State, Msg, Page> = {
  init,
  update,
  view,
  router
};
