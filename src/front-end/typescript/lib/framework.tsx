import { Record, RecordOf } from 'immutable';
import { get, remove } from 'lodash';
import page from 'page';
import { default as React, StatelessComponent } from 'react';
import ReactDOM from 'react-dom';

// Set up a basic ADT representation for Msgs.
export interface ADT<Tag, Data = undefined> {
  tag: Tag;
  data: Data;
}

export type Init<Params, State> = (params: Params) => Promise<State>;

// Update returns a tuple representing sync and async state mutations.
type UpdateReturnValue<State> = [RecordOf<State>, Promise<RecordOf<State>>?];

export type Update<State, Msg> = (state: RecordOf<State>, msg: Msg) => UpdateReturnValue<State>;

interface UpdateChildParams<ParentState, ChildState, ChildMsg> {
  state: RecordOf<ParentState>;
  childStatePath: string[];
  updateChild: Update<ChildState, ChildMsg>;
  childMsg: ChildMsg;
}

export function updateChild<PS, CS, CM>(params: UpdateChildParams<PS, CS, CM>): UpdateReturnValue<PS> {
  const { childStatePath, updateChild, childMsg } = params;
  let { state } = params;
  const childState = state.getIn(childStatePath);
  if (!childState) { return [state]; }
  const [newChildState, newAsyncChildState] = updateChild(Record(childState)(), childMsg);
  state = state.setIn(childStatePath, newChildState.toJS());
  return [
    state,
    (async () => {
      const newChildState = await newAsyncChildState;
      if (!newChildState) { return state; }
      return state.setIn(childStatePath, newChildState.toJS());
    })()
  ];
}

export type View<Props> = StatelessComponent<Props>;

export interface ComponentViewProps<State, Msg> {
  state: RecordOf<State>;
  dispatch: Dispatch<Msg>;
}

export type ComponentView<State, Msg> = View<ComponentViewProps<State, Msg>>;

export interface Component<Params, State, Msg> {
  init: Init<Params, State>;
  update: Update<State, Msg>;
  view: ComponentView<State, Msg>;
}

export interface RouteDefinition {
  path: string;
  pageId: string;
}

export interface Router<Page> {
  routes: RouteDefinition[];
  locationToPage(pageId: string, params: object): Page;
  pageToUrl(page: Page): string;
}

export type IncomingPageMsg<Page> = ADT<'@incomingPage', Page>;

export type NewUrlMsg<Page> = ADT<'@newUrl', Page>;

export function newUrl<Page>(page: Page): NewUrlMsg<Page> {
  return {
    tag: '@newUrl',
    data: page
  };
}

export type ReplaceUrlMsg<Page> = ADT<'@replaceUrl', Page>;

export function replaceUrl<Page>(page: Page): ReplaceUrlMsg<Page> {
  return {
    tag: '@replaceUrl',
    data: page
  };
}

export type GlobalMsg<Page> = NewUrlMsg<Page> | ReplaceUrlMsg<Page>;

export type ComponentMsg<Msg, Page> = Msg | GlobalMsg<Page>;

export type AppMsg<Msg, Page> = ComponentMsg<Msg, Page> | IncomingPageMsg<Page>;

export interface App<State, Msg, Page> extends Component<null, State, AppMsg<Msg, Page>> {
  router: Router<Page>;
}

export type Dispatch<Msg> = (msg: Msg) => void;

export function mapDispatch<ParentMsg, ChildMsg, Page>(dispatch: Dispatch<AppMsg<ParentMsg, Page> | ComponentMsg<ParentMsg, Page>>, fn: (childMsg: ComponentMsg<ChildMsg, Page>) => AppMsg<ParentMsg, Page> | ComponentMsg<ParentMsg, Page>): Dispatch<ComponentMsg<ChildMsg, Page>> {
  return childMsg => {
    if ((childMsg as GlobalMsg<Page>).tag === '@newUrl' || (childMsg as GlobalMsg<Page>).tag === '@replaceUrl') {
      dispatch(childMsg as GlobalMsg<Page>);
    } else {
      dispatch(fn(childMsg));
    }
  };
}

export type StateSubscription<State, Msg> = (state: RecordOf<State>, dispatch: Dispatch<Msg>) => void;

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
  router.routes.forEach(({ path, pageId }) => {
    page(path, ctx => {
      dispatch({
        tag: '@incomingPage',
        data: router.locationToPage(pageId, get(ctx, 'params', {}))
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
        if (msg.tag === '@newUrl') {
          runNewUrl(app.router.pageToUrl(msg.data));
          return state;
        } else if (msg.tag === '@replaceUrl') {
          runReplaceUrl(app.router.pageToUrl(msg.data));
          return state;
        }
        const [newState, promiseState] = app.update(state, msg);
        // Update state with its synchronous change.
        state = newState;
        if (promiseState) {
          notify();
          return promiseState;
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
  const render = (state: RecordOf<State>, dispatch: Dispatch<AppMsg<Msg, Page>>): void => {
    ReactDOM.render(
      <app.view state={state} dispatch={dispatch} />,
      element
    );
  }
  subscribe(render);
  // Set up function to notify subscriptions.
  function notify(): void {
    subscriptions.forEach(fn => fn(state, dispatch));
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
