import { Record, RecordOf } from 'immutable';
import { defaults, get, remove } from 'lodash';
import page from 'page';
import { default as React, ReactElement } from 'react';
import ReactDOM from 'react-dom';
import { ADT } from 'shared/lib/types';

export type Immutable<State> = RecordOf<State>;

export function immutable<State>(state: State): Immutable<State> {
  return Record(state)();
}

export type Init<Params, State> = (params: Params) => Promise<State>;

// Update returns a tuple representing sync and async state mutations.
type UpdateReturnValue<State, Msg> = [Immutable<State>, ((dispatch: Dispatch<Msg>) => Promise<Immutable<State>>)?];

export type Update<State, Msg> = (state: Immutable<State>, msg: Msg) => UpdateReturnValue<State, Msg>;

interface UpdateChildParams<ParentState, ParentMsg, ChildState, ChildMsg> {
  state: Immutable<ParentState>;
  childStatePath: string[];
  childUpdate: Update<ChildState, ChildMsg>;
  childMsg: ChildMsg;
  mapChildMsg(msg: ChildMsg): ParentMsg,
}

export function updateAppChild<PS, PM, CS, CM, Page>(params: UpdateChildParams<PS, AppMsg<PM, Page>, CS, ComponentMsg<CM, Page>>): UpdateReturnValue<PS, AppMsg<PM, Page>> {
  const { childStatePath, childUpdate, childMsg, mapChildMsg } = params;
  let { state } = params;
  const childState = state.getIn(childStatePath);
  if (!childState) { return [state]; }
  const [newChildState, newAsyncChildState] = childUpdate(childState, childMsg);
  state = state.setIn(childStatePath, newChildState);
  let asyncStateUpdate;
  if (newAsyncChildState) {
    asyncStateUpdate = async (dispatch: Dispatch<AppMsg<PM, Page>>) => {
      const mappedDispatch = mapAppDispatch(dispatch, mapChildMsg);
      return state.setIn(childStatePath, await newAsyncChildState(mappedDispatch));
    }
  }
  return [
    state,
    asyncStateUpdate
  ];
}

export function updateComponentChild<PS, PM, CS, CM, Page>(params: UpdateChildParams<PS, ComponentMsg<PM, Page>, CS, ComponentMsg<CM, Page>>): UpdateReturnValue<PS, ComponentMsg<PM, Page>> {
  const { childStatePath, childUpdate, childMsg, mapChildMsg } = params;
  let { state } = params;
  const childState = state.getIn(childStatePath);
  if (!childState) { return [state]; }
  const [newChildState, newAsyncChildState] = childUpdate(childState, childMsg);
  state = state.setIn(childStatePath, newChildState);
  let asyncStateUpdate;
  if (newAsyncChildState) {
    asyncStateUpdate = async (dispatch: Dispatch<ComponentMsg<PM, Page>>) => {
      const mappedDispatch = mapComponentDispatch(dispatch, mapChildMsg);
      return state.setIn(childStatePath, await newAsyncChildState(mappedDispatch));
    }
  }
  return [
    state,
    asyncStateUpdate
  ];
}

export type View<Props> = (props: Props) => ReactElement<Props> | null;

export interface ComponentViewProps<State, Msg> {
  state: Immutable<State>;
  dispatch: Dispatch<Msg>;
}

export type ComponentView<State, Msg> = View<ComponentViewProps<State, Msg>>;

export interface Component<Params, State, Msg> {
  init: Init<Params, State>;
  update: Update<State, Msg>;
  view: ComponentView<State, Msg>;
}

// TODO refactor type naming in this module for this type to be useful.
export type PageComponent<Params, State, Msg, Page> = Component<Params, State, ComponentMsg<Msg, Page>>;

export interface RouteAuthDefinition {
  level: AuthLevel;
  redirect: string;
  signOut: boolean;
}

export interface RouteDefinition {
  path: string;
  pageId: string;
  auth?: RouteAuthDefinition;
}

export interface Router<Page> {
  routes: RouteDefinition[];
  locationToPage(pageId: string, params: object): Page;
  pageToUrl(page: Page): string;
}

export enum AuthLevel {
  Any = 'ANY',
  SignedIn = 'SIGNED_IN',
  SignedOut = 'SIGNED_OUT'
}

export interface IncomingPageMsgValue<Page> {
  page: Page;
  auth: RouteAuthDefinition;
}

export type IncomingPageMsg<Page> = ADT<'@incomingPage', IncomingPageMsgValue<Page>>;

export type RedirectMsg = ADT<'@redirect', string>;

export function redirect(path: string): RedirectMsg {
  return {
    tag: '@redirect',
    value: path
  };
}

export type NewUrlMsg<Page> = ADT<'@newUrl', Page>;

export function newUrl<Page>(page: Page): NewUrlMsg<Page> {
  return {
    tag: '@newUrl',
    value: page
  };
}

export type ReplaceUrlMsg<Page> = ADT<'@replaceUrl', Page>;

export function replaceUrl<Page>(page: Page): ReplaceUrlMsg<Page> {
  return {
    tag: '@replaceUrl',
    value: page
  };
}

export type GlobalMsg<Page> = NewUrlMsg<Page> | ReplaceUrlMsg<Page> | RedirectMsg;

export type ComponentMsg<Msg, Page> = Msg | GlobalMsg<Page>;

export type AppMsg<Msg, Page> = ComponentMsg<Msg, Page> | IncomingPageMsg<Page>;

export interface App<State, Msg, Page> extends Component<null, State, AppMsg<Msg, Page>> {
  router: Router<Page>;
}

export type Dispatch<Msg> = (msg: Msg) => void;

export function mapAppDispatch<ParentMsg, ChildMsg, Page>(dispatch: Dispatch<AppMsg<ParentMsg, Page>>, fn: (childMsg: ComponentMsg<ChildMsg, Page>) => AppMsg<ParentMsg, Page>): Dispatch<ComponentMsg<ChildMsg, Page>> {
  return childMsg => {
    if ((childMsg as GlobalMsg<Page>).tag === '@newUrl' || (childMsg as GlobalMsg<Page>).tag === '@replaceUrl') {
      dispatch(childMsg as GlobalMsg<Page>);
    } else {
      dispatch(fn(childMsg));
    }
  };
}

export function mapComponentDispatch<ParentMsg, ChildMsg, Page>(dispatch: Dispatch<ComponentMsg<ParentMsg, Page>>, fn: (childMsg: ComponentMsg<ChildMsg, Page>) => ComponentMsg<ParentMsg, Page>): Dispatch<ComponentMsg<ChildMsg, Page>> {
  return childMsg => {
    if ((childMsg as GlobalMsg<Page>).tag === '@newUrl' || (childMsg as GlobalMsg<Page>).tag === '@replaceUrl') {
      dispatch(childMsg as GlobalMsg<Page>);
    } else {
      dispatch(fn(childMsg));
    }
  };
}

export type StateSubscription<State, Msg> = (state: Immutable<State>, dispatch: Dispatch<Msg>) => void;

export type StateSubscribe<State, Msg> = (fn: StateSubscription<State, Msg>) => boolean;

export type StateUnsubscribe<State, Msg> = (fn: StateSubscription<State, Msg>) => boolean;

export interface StateManager<State, Msg> {
  dispatch: Dispatch<Msg>;
  subscribe: StateSubscribe<State, Msg>;
  unsubscribe: StateUnsubscribe<State, Msg>;
  getState(): State;
}

export function initializeRouter<Msg, Page>(router: Router<Page>, dispatch: Dispatch<AppMsg<Msg, Page>>): void {
  // Bind all routes for pushState.
  router.routes.forEach(({ path, pageId, auth }) => {
    const authDefinition = defaults(auth, {
      level: AuthLevel.Any,
      redirect: '/',
      signOut: false
    });
    page(path, ctx => {
      dispatch({
        tag: '@incomingPage',
        value: {
          auth: authDefinition,
          page: router.locationToPage(pageId, get(ctx, 'params', {}))
        }
      });
    });
  });
  // Start the router.
  page();
}

export function runNewUrl(path: string): void {
  page(path);
}

export function runReplaceUrl(path: string): void {
  page.redirect(path);
}

export async function start<State, Msg extends ADT<any, any>, Page>(app: App<State, Msg, Page>, element: HTMLElement, debug: boolean): Promise<StateManager<State, AppMsg<Msg, Page>>> {
  // Initialize state.
  // We do not need the RecordFactory, so we create the Record immediately.
  let state = Record(await app.init(null))({});
  // Set up subscription state.
  const subscriptions: Array<StateSubscription<State, AppMsg<Msg, Page>>> = [];
  const subscribe: StateSubscribe<State, AppMsg<Msg, Page>> = fn => (subscriptions.push(fn) && true) || false;
  const unsubscribe: StateUnsubscribe<State, AppMsg<Msg, Page>> = fn => (remove(subscriptions, a => a === fn) && true) || false;
  // Set up state accessor function.
  const getState = () => state;
  // Initialize state mutation promise chain.
  // i.e. Mutate state sequentially in a single thread.
  let promise = Promise.resolve();
  // Set up dispatch function to queue state mutations.
  const dispatch: Dispatch<AppMsg<Msg, Page>> = msg => {
    // tslint:disable:next-line no-console
    if (debug) { console.log('dispatch', msg); }
    promise = promise
      .then(() => {
        switch (msg.tag) {
          case '@redirect':
            runReplaceUrl(msg.value);
            return state;
          case '@newUrl':
            runNewUrl(app.router.pageToUrl(msg.value));
            return state;
          case '@replaceUrl':
            runReplaceUrl(app.router.pageToUrl(msg.value));
            return state;
          default:
            break;
        }
        const [newState, promiseState] = app.update(state, msg);
        // Update state with its synchronous change.
        state = newState;
        if (promiseState) {
          notify();
          return promiseState(dispatch);
        } else {
          return newState;
        }
      })
      .then(newState => {
        // Update state with its asynchronous change.
        state = newState;
        notify();
      });
  };
  // Render the view whenever state changes.
  const render = (state: Immutable<State>, dispatch: Dispatch<AppMsg<Msg, Page>>): void => {
    ReactDOM.render(
      <app.view state={state} dispatch={dispatch} />,
      element
    );
  }
  subscribe(render);
  // Set up function to notify subscriptions.
  function notify(): void {
    subscriptions.forEach(fn => fn(state, dispatch));
    // tslint:disable:next-line no-console
    if (debug) { console.log('state updated', state.toJSON()); }
  }
  // Trigger state initialization notification.
  notify();
  // Initialize the router.
  initializeRouter(app.router, dispatch);
  // Return StateManager.
  return {
    dispatch,
    subscribe,
    unsubscribe,
    getState
  };
};
