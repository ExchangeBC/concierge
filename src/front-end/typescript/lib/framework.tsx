import { Record, RecordOf } from 'immutable';
import { defaults, get, remove } from 'lodash';
import page from 'page';
import { default as React, ReactElement } from 'react';
import ReactDom from 'react-dom';
import { ADT, AuthLevel } from 'shared/lib/types';

export type Immutable<State> = RecordOf<State>;

export function immutable<State>(state: State): Immutable<State> {
  return Record(state)();
}

export type Init<Params, State> = (params: Params) => Promise<State>;

// Update returns a tuple representing sync and async state mutations.
type UpdateReturnValue<State, Msg> = [Immutable<State>, ((state: Immutable<State>, dispatch: Dispatch<Msg>) => Promise<Immutable<State>>)?];

export type Update<State, Msg> = (state: Immutable<State>, msg: Msg) => UpdateReturnValue<State, Msg>;

interface UpdateChildParams<ParentState, ParentMsg, ChildState, ChildMsg> {
  state: Immutable<ParentState>;
  childStatePath: string[];
  childUpdate: Update<ChildState, ChildMsg>;
  childMsg: ChildMsg;
  mapChildMsg(msg: ChildMsg): ParentMsg,
}

export function updateAppChild<PS, PM, CS, CM, Page, UserType>(params: UpdateChildParams<PS, AppMsg<PM, Page, UserType>, CS, ComponentMsg<CM, Page>>): UpdateReturnValue<PS, AppMsg<PM, Page, UserType>> {
  const { childStatePath, childUpdate, childMsg, mapChildMsg } = params;
  let { state } = params;
  const childState = state.getIn(childStatePath);
  if (!childState) { return [state]; }
  const [newChildState, newAsyncChildState] = childUpdate(childState, childMsg);
  state = state.setIn(childStatePath, newChildState);
  let asyncStateUpdate;
  if (newAsyncChildState) {
    asyncStateUpdate = async (state: Immutable<PS>, dispatch: Dispatch<AppMsg<PM, Page, UserType>>) => {
      const mappedDispatch = mapAppDispatch(dispatch, mapChildMsg);
      return state.setIn(childStatePath, await newAsyncChildState(state.getIn(childStatePath), mappedDispatch));
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
    asyncStateUpdate = async (state: Immutable<PS>, dispatch: Dispatch<ComponentMsg<PM, Page>>) => {
      const mappedDispatch = mapComponentDispatch(dispatch, mapChildMsg);
      return state.setIn(childStatePath, await newAsyncChildState(state.getIn(childStatePath), mappedDispatch));
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

/**
 * The optional `Props` type parameter enables you
 * to define views that take additional props in a
 * type-safe manner.
 */

export interface Component<Params, State, Msg, Props extends ComponentViewProps<State, Msg> = ComponentViewProps<State, Msg>> {
  init: Init<Params, State>;
  update: Update<State, Msg>;
  view: View<Props>;
}

export interface RouteAuthDefinition<Page, UserType> {
  level: AuthLevel<UserType>;
  signOut: boolean;
  redirect(incomingPage: Page): Page;
}

export interface RouteDefinition<Page, UserType> {
  path: string;
  pageId: string;
  auth?: RouteAuthDefinition<Page, UserType>;
}

export interface PageMetadata {
  title: string;
}

export interface Router<State, Page, UserType> {
  fallbackPage: Page;
  routes: Array<RouteDefinition<Page, UserType>>;
  locationToPage(pageId: string, params: object, state: Immutable<State>): Page;
  pageToUrl(page: Page): string;
  pageToMetadata(page: Page): PageMetadata;
}

export interface IncomingPageMsgValue<Page, UserType> {
  page: Page;
  auth: RouteAuthDefinition<Page, UserType>;
}

export type BeforeIncomingPageMsg = ADT<'@beforeIncomingPage'>;

export type IncomingPageMsg<Page, UserType> = ADT<'@incomingPage', IncomingPageMsgValue<Page, UserType>>;

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

export type AppMsg<Msg, Page, UserType> = ComponentMsg<Msg, Page> | BeforeIncomingPageMsg | IncomingPageMsg<Page, UserType>;

export interface App<State, Msg, Page, UserType> extends Component<null, State, AppMsg<Msg, Page, UserType>> {
  router: Router<State, Page, UserType>;
}

export type Dispatch<Msg> = (msg: Msg) => Promise<any>;

export function mapAppDispatch<ParentMsg, ChildMsg, Page, UserType>(dispatch: Dispatch<AppMsg<ParentMsg, Page, UserType>>, fn: (childMsg: ComponentMsg<ChildMsg, Page>) => AppMsg<ParentMsg, Page, UserType>): Dispatch<ComponentMsg<ChildMsg, Page>> {
  return childMsg => {
    if ((childMsg as GlobalMsg<Page>).tag === '@newUrl' || (childMsg as GlobalMsg<Page>).tag === '@replaceUrl') {
      return dispatch(childMsg as GlobalMsg<Page>);
    } else {
      return dispatch(fn(childMsg));
    }
  };
}

export function mapComponentDispatch<ParentMsg, ChildMsg, Page>(dispatch: Dispatch<ComponentMsg<ParentMsg, Page>>, fn: (childMsg: ComponentMsg<ChildMsg, Page>) => ComponentMsg<ParentMsg, Page>): Dispatch<ComponentMsg<ChildMsg, Page>> {
  return childMsg => {
    if ((childMsg as GlobalMsg<Page>).tag === '@newUrl' || (childMsg as GlobalMsg<Page>).tag === '@replaceUrl') {
      return dispatch(childMsg as GlobalMsg<Page>);
    } else {
      return dispatch(fn(childMsg));
    }
  };
}

export type StateSubscription<State, Msg> = (state: Immutable<State>, dispatch: Dispatch<Msg>) => void;

export type StateSubscribe<State, Msg> = (fn: StateSubscription<State, Msg>) => boolean;

export type StateUnsubscribe<State, Msg> = (fn: StateSubscription<State, Msg>) => boolean;

export type MsgSubscription<Msg> = (msg: Msg) => void;

export type MsgSubscribe<Msg> = (fn: MsgSubscription<Msg>) => boolean;

export type MsgUnsubscribe<Msg> = (fn: MsgSubscription<Msg>) => boolean;

export interface StateManager<State, Msg> {
  dispatch: Dispatch<Msg>;
  stateSubscribe: StateSubscribe<State, Msg>;
  stateUnsubscribe: StateUnsubscribe<State, Msg>;
  msgSubscribe: MsgSubscribe<Msg>;
  msgUnsubscribe: MsgUnsubscribe<Msg>;
  getState(): Immutable<State>;
}

export function initializeRouter<State, Msg, Page, UserType>(router: Router<State, Page, UserType>, stateManager: StateManager<State, AppMsg<Msg, Page, UserType>>): void {
  // Bind all routes for pushState.
  router.routes.forEach(({ path, pageId, auth }) => {
    const authDefinition = defaults(auth, {
      level: { tag: 'any', value: undefined },
      redirect: () => router.fallbackPage,
      signOut: false
    });
    page(path, ctx => {
      // Do nothing if a hash is present in the path
      // only if it isn't the initial load.
      if (!ctx.init && ctx.hash) { return; }
      // We need to determine the page via locationToPage
      // after running beforeIncomingPage since state updates
      // can be asynchronous.
      stateManager.dispatch({
        tag: '@beforeIncomingPage',
        value: undefined
      }).then(() => {
        const parsedPage = router.locationToPage(pageId, get(ctx, 'params', {}), stateManager.getState());
        return stateManager
          .dispatch({
            tag: '@incomingPage',
            value: {
              auth: authDefinition,
              page: parsedPage
            }
          })
          .then(() => setPageMetadata(router.pageToMetadata(parsedPage)));
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

export function setPageMetadata(metadata: PageMetadata): void {
  document.title = metadata.title;
}

export async function start<State, Msg extends ADT<any, any>, Page, UserType>(app: App<State, Msg, Page, UserType>, element: HTMLElement, debug: boolean): Promise<StateManager<State, AppMsg<Msg, Page, UserType>>> {
  // Initialize state.
  // We do not need the RecordFactory, so we create the Record immediately.
  let state = Record(await app.init(null))({});
  // Set up subscription state.
  const stateSubscriptions: Array<StateSubscription<State, AppMsg<Msg, Page, UserType>>> = [];
  const msgSubscriptions: Array<MsgSubscription<AppMsg<Msg, Page, UserType>>> = [];
  const stateSubscribe: StateSubscribe<State, AppMsg<Msg, Page, UserType>> = fn => (stateSubscriptions.push(fn) && true) || false;
  const stateUnsubscribe: StateUnsubscribe<State, AppMsg<Msg, Page, UserType>> = fn => (remove(stateSubscriptions, a => a === fn) && true) || false;
  const msgSubscribe: MsgSubscribe<AppMsg<Msg, Page, UserType>> = fn => (msgSubscriptions.push(fn) && true) || false;
  const msgUnsubscribe: MsgUnsubscribe<AppMsg<Msg, Page, UserType>> = fn => (remove(msgSubscriptions, a => a === fn) && true) || false;
  // Set up state accessor function.
  const getState = () => state;
  // Initialize state mutation promise chain.
  // i.e. Mutate state sequentially in a single thread.
  let promise = Promise.resolve();
  // Set up dispatch function to queue state mutations.
  const dispatch: Dispatch<AppMsg<Msg, Page, UserType>> = msg => {
    // Synchronous state changes should happen outside a promise chain
    // in the main thread. Otherwise real-time UI changes don't happen
    // (e.g. form input) causing a bad UX.
    notifyMsgSubscriptions(msg);
    switch (msg.tag) {
      case '@redirect':
        runReplaceUrl(msg.value);
        break;
      case '@newUrl':
        runNewUrl(app.router.pageToUrl(msg.value));
        break;
      case '@replaceUrl':
        runReplaceUrl(app.router.pageToUrl(msg.value));
        break;
    }
    const [newState, promiseState] = app.update(state, msg);
    state = newState;
    notifyStateSubscriptions();
    // Asynchronous changes should be sequenced inside
    // a promise chain.
    if (promiseState) {
      // We want to run async state updates after
      // the current "tick" to ensure all
      // sync updates are processed first.
      setTimeout(() => {
        promise = promise
          .then(() => promiseState(state, dispatch))
          .then(newState => {
            // Update state with its asynchronous change.
            state = newState;
            notifyStateSubscriptions();
          });
      }, 0);
    }
    return promise;
  };
  // Render the view whenever state changes.
  const render = (state: Immutable<State>, dispatch: Dispatch<AppMsg<Msg, Page, UserType>>): void => {
    ReactDom.render(
      <app.view state={state} dispatch={dispatch} />,
      element
    );
  };
  stateSubscribe(render);
  // Set up function to notify msg subscriptions.
  function notifyMsgSubscriptions(msg: AppMsg<Msg, Page, UserType>): void {
    msgSubscriptions.forEach(fn => fn(msg));
    // tslint:disable:next-line no-console
    if (debug) { console.log('msg dispatched', msg); }
  }
  // Set up function to notify state subscriptions.
  function notifyStateSubscriptions(): void {
    stateSubscriptions.forEach(fn => fn(state, dispatch));
    // tslint:disable:next-line no-console
    if (debug) { console.log('state updated', state.toJSON()); }
  }
  // Trigger state initialization notification.
  notifyStateSubscriptions();
  // Create the StateManager.
  const stateManager = {
    dispatch,
    stateSubscribe,
    stateUnsubscribe,
    msgSubscribe,
    msgUnsubscribe,
    getState
  };
  // Initialize the router.
  initializeRouter(app.router, stateManager);
  // Return StateManager.
  return stateManager;
};
