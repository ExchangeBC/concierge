import { Record } from 'immutable';
import { get } from 'lodash';
import React from 'react';
import { ADT, App, ComponentView, Init, NavigateMsg, RouteMsg, Routes, Update } from './lib/framework';
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

type PageState = PageLoading.State | PageLoadingTwo.State | PageSay.State;

type PageMsg = PageLoading.Msg | PageLoadingTwo.Msg | PageSay.Msg;

interface AppState {
  activeRouteId: string;
  page: PageState;
}

type AppMsg = ADT<'updatePage', PageMsg> | RouteMsg | NavigateMsg;

export const init: Init<null, AppState> = async () => {
  return {
    activeRouteId: 'loading',
    page: await PageLoading.component.init(null)
  };
};

export const update: Update<AppState, AppMsg> = (state, msg) => {
  switch (msg.tag) {
    case 'route':
      return [
        state,
        (async () => {
          switch (msg.data.id) {
            case 'loading':
              return state
                .set('page', await PageLoading.init(null))
                .set('activeRouteId', msg.data.id);
            case 'loading-two':
              return state
                .set('page', await PageLoadingTwo.init(null))
                .set('activeRouteId', msg.data.id);
            case 'say':
              return state
                .set('page', await PageSay.init({
                  message: get(msg, 'data.params.message', 'Default Message')
                }))
                .set('activeRouteId', msg.data.id);
            default:
              return state;
          }
        })()
      ];
    case 'updatePage':
      return [
        state,
        (async () => {
          let update = (state: any, msg: any) => [state.get('page')];
          switch (state.get('activeRouteId')) {
            case 'loading':
              update = PageLoading.update;
              break;
            case 'loading-two':
              update = PageLoadingTwo.update;
              break;
            case 'say':
              update = PageSay.update;
              break;
          }
          const [pageState, nextPageState] = update(Record(state.get('page'))(), msg.data);
          if (nextPageState) {
            return state.set('page', (await nextPageState).toJS());
          } else {
            return state.set('page', pageState.toJS());
          }
        })()
      ];
    default:
      return [state];
  }
};

export const view: ComponentView<AppState, AppMsg> = ({ state, dispatch }) => {
  const jsState = state.toJS();
  const dispatchPage = (msg: PageMsg) => {
    dispatch({
      tag: 'updatePage',
      data: msg
    });
  };
  const Page = () => {
    switch (jsState.activeRouteId) {
      case 'loading':
        return (<PageLoading.view dispatch={dispatchPage} state={jsState.page} />);
      case 'loading-two':
        return (<PageLoadingTwo.view dispatch={dispatchPage} state={jsState.page} />);
      case 'say':
        return (<PageSay.view dispatch={dispatchPage} state={jsState.page} />);
      default:
        return (<div>Undefined Page: {jsState.activeRouteId}</div>);
    }
  };
  return (
    <div>
      <h1>Demo App With Routing</h1>
      <button onClick={() => dispatch({ tag: 'navigate', data: '/say/hi' })}>
        {`Say "hi"`}
      </button>
      <button onClick={() => dispatch({ tag: 'navigate', data: '/say/hello' })}>
        {`Say "hello"`}
      </button>
      <button onClick={() => dispatch({ tag: 'navigate', data: '/loading' })}>
        Loading
      </button>
      <button onClick={() => dispatch({ tag: 'navigate', data: '/loading-two' })}>
        Loading Two
      </button>
      <hr />
      <Page />
    </div>
  );
};

export const routes: Routes = [
  {
    path: '/loading',
    id: 'loading'
  },
  {
    path: '/loading-two',
    id: 'loading-two'
  },
  {
    path: '/say/:message',
    id: 'say'
  }
];

export const app: App<AppState, AppMsg> = {
  init,
  update,
  view,
  routes
};
