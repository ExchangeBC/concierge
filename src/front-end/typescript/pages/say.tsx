import React from 'react';
import { ADT, Component, ComponentMsg, ComponentView, Init, Update } from '../lib/framework';

export interface Params {
  message: string;
}

export interface State {
  message: string;
}

export type Msg = ComponentMsg<ADT<'setMessage', string>>;

export const init: Init<Params, State> = async ({ message }) => {
  return {
    message
  };
};

export const update: Update<State, Msg> = (state, msg) => {
  // tslint:disable no-console
  console.log(state);
  switch (msg.tag) {
    case 'setMessage':
      return [state.set('message', msg.data)];
    default:
      return [state];
  }
};

export const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  function double() {
    const message = `${state.message} ${state.message}`;
    dispatch({ tag: 'setMessage', data: message });
    dispatch({ tag: '@replaceUrl', data: `/say/${message}` });
  }
  return (
    <div>
      <div>{state.message}</div>
      <br />
      <button onClick={double}>
        Double Message
      </button>
    </div>
  );
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
