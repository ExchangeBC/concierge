import React from 'react';
import { ADT, App, AppMsg, ComponentView, Dispatch, Init, mapDispatch, newUrl, Update, updateChild } from '../lib/framework';
import * as PageLoading from '../pages/loading';
import * as PageLoadingTwo from '../pages/loading-two';
import * as PageSay from '../pages/say';
import { Page, router } from './router';

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

    case '@incomingPage':
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
      return updateChild({
        state,
        childStatePath: ['pages', 'loading'],
        updateChild: PageLoading.update,
        childMsg: msg.data
      });

    case 'pageLoadingTwoMsg':
      return updateChild({
        state,
        childStatePath: ['pages', 'loadingTwo'],
        updateChild: PageLoadingTwo.update,
        childMsg: msg.data
      });

    case 'pageSayMsg':
      return updateChild({
        state,
        childStatePath: ['pages', 'say'],
        updateChild: PageSay.update,
        childMsg: msg.data
      });

    default:
      return [state];
  }
};

const ViewActivePage: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const jsState = state.toJS();
  const dispatchLoading: Dispatch<PageLoading.Msg> = mapDispatch(dispatch as Dispatch<Msg>, data => ({ tag: 'pageLoadingMsg' as 'pageLoadingMsg', data }));
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
      <button onClick={() => dispatch(newUrl({ tag: 'say' as 'say', data: { message: 'hi' }}))}>
        {`Say "hi"`}
      </button>
      <button onClick={() => dispatch(newUrl({ tag: 'say' as 'say', data: { message: 'hello' }}))}>
        {`Say "hello"`}
      </button>
      <button onClick={() => dispatch(newUrl({ tag: 'loading' as 'loading', data: null }))}>
        Loading
      </button>
      <button onClick={() => dispatch(newUrl({ tag: 'loadingTwo' as 'loadingTwo', data: null }))}>
        Loading Two
      </button>
      <hr />
      <ViewActivePage state={state} dispatch={dispatch} />
    </div>
  );
};

export const app: App<State, Msg, Page> = {
  init,
  update,
  view,
  router
};
