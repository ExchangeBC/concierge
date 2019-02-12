import { Record, RecordOf } from 'immutable';
import { remove } from 'lodash';
// import page from 'page';
import { default as React, StatelessComponent } from 'react';
import ReactDOM from 'react-dom';

// Set up a basic ADT representation for Msgs.
export interface Msg<Tag, Data = undefined> {
  tag: Tag;
  data: Data;
}

export type Init<State> = () => Promise<State>;

// Returns a tuple representing sync and async state mutations.
export type Update<State, Msg> = (state: RecordOf<State>, msg: Msg) => [RecordOf<State>, Promise<RecordOf<State>>?];

export type View<Props> = StatelessComponent<Props>;

export interface ComponentViewProps<State, Msg> {
  state: RecordOf<State>;
  dispatch: Dispatch<Msg>;
}

export type ComponentView<State, Msg> = View<ComponentViewProps<State, Msg>>;

export interface Component<State, Msg> {
  init: Init<State>;
  update: Update<State, Msg>;
  view: ComponentView<State, Msg>;
}

export interface Route<State, Msg> {
  path: string;
  auth: boolean;
  component: Component<State, Msg>;
}

export type Routes<State, Msg> = Array<Route<State, Msg>>;

export interface App<State, Msg> extends Component<State, Msg> {
  routes: Routes<State, Msg>;
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

export async function start<State, Msg>(app: App<State, Msg>, element: HTMLElement, debug: boolean): Promise<StateManager<State, Msg>> {
  // Initialize state.
  // We do not need the RecordFactory, so we create the Record immediately.
  let state = Record(await app.init())({});
  // Set up subscription state.
  const subscriptions: Array<StateSubscription<State, Msg>> = [];
  const subscribe: StateSubscribe<State, Msg> = fn => (subscriptions.push(fn) && true) || false;
  const unsubscribe: StateUnsubscribe<State, Msg> = fn => (remove(subscriptions, a => a === fn) && true) || false;
  // Set up state accessor function.
  const getState = () => state;
  // Initialize state mutation promise chain.
  // i.e. Mutate state sequentially in a single thread.
  let promise = Promise.resolve();
  // Set up dispatch function to queue state mutations.
  const dispatch: Dispatch<Msg> = msg => {
    // tslint:disable:next-line no-console
    if (debug) { console.log('dispatch', msg); }
    promise = promise
      .then(() => {
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
  const render = (state: RecordOf<State>, dispatch: Dispatch<Msg>): void => {
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
  // Return StateManager.
  return {
    dispatch,
    subscribe,
    unsubscribe,
    getState
  };
};

// TODO Routing.
// Bind page routes.
/*routes.forEach(({ path, redirect, auth, Component }) => {
  page(path, ctx => {
    if (redirect) { page.redirect(redirect); } else { app.dispatch('view', { auth, Component, params: ctx.params }); }
  });
});

// Start the router.
page();*/
