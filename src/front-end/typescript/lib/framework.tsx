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

// Returns a tuple representing sync and async state mutations.
export type Update<State, Msg> = (state: RecordOf<State>, msg: Msg) => [RecordOf<State>, Promise<RecordOf<State>>?];

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

export interface Route {
  path: string;
  id: string;
}

export interface RouteMsgData {
  params: object;
  id: string;
}

export type RouteMsg = ADT<'route', RouteMsgData>;

export type Routes = Route[];

export type NavigateMsg = ADT<'navigate', string>;

export type AppMsg<Msg> = Msg | RouteMsg | NavigateMsg;

export interface App<State, Msg> extends Component<null, State, AppMsg<Msg>> {
  routes: Routes;
}

export type Dispatch<Msg> = (msg: Msg) => void;

export type StateSubscription<State, Msg> = (state: RecordOf<State>, dispatch: Dispatch<Msg>) => void;

export type StateSubscribe<State, Msg> = (fn: StateSubscription<State, Msg>) => boolean;

export type StateUnsubscribe<State, Msg> = (fn: StateSubscription<State, Msg>) => boolean;

export interface StateManager<State, Msg> {
  dispatch: Dispatch<Msg>;
  subscribe: StateSubscribe<State, Msg>;
  unsubscribe: StateUnsubscribe<State, Msg>;
  getState(): State;
}

export function initializeRouter<Msg>(routes: Routes, dispatch: Dispatch<AppMsg<Msg>>): void {
  // Bind all routes for pushState.
  routes.forEach(({ path, id }) => {
    page(path, ctx => {
      dispatch({
        tag: 'route',
        data: {
          params: get(ctx, 'params', {}),
          id
        }
      });
    });
  });
  // Start the router.
  page();
}

export function navigate(path: string): void {
  page(path);
}

export async function start<State, Msg extends ADT<any, any>>(app: App<State, Msg>, element: HTMLElement, debug: boolean): Promise<StateManager<State, AppMsg<Msg>>> {
  // Initialize state.
  // We do not need the RecordFactory, so we create the Record immediately.
  let state = Record(await app.init(null))({});
  // Set up subscription state.
  const subscriptions: Array<StateSubscription<State, AppMsg<Msg>>> = [];
  const subscribe: StateSubscribe<State, AppMsg<Msg>> = fn => (subscriptions.push(fn) && true) || false;
  const unsubscribe: StateUnsubscribe<State, AppMsg<Msg>> = fn => (remove(subscriptions, a => a === fn) && true) || false;
  // Set up state accessor function.
  const getState = () => state;
  // Initialize state mutation promise chain.
  // i.e. Mutate state sequentially in a single thread.
  let promise = Promise.resolve();
  // Set up dispatch function to queue state mutations.
  const dispatch: Dispatch<AppMsg<Msg>> = msg => {
    // tslint:disable:next-line no-console
    if (debug) { console.log('dispatch', msg); }
    promise = promise
      .then(() => {
        if (msg.tag === 'navigate') {
          navigate(msg.data);
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
  const render = (state: RecordOf<State>, dispatch: Dispatch<AppMsg<Msg>>): void => {
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
  initializeRouter(app.routes, dispatch);
  // Return StateManager.
  return {
    dispatch,
    subscribe,
    unsubscribe,
    getState
  };
};
