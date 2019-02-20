import React from 'react';
import { Page } from '../app/router';
import { ADT, Component, ComponentMsg, ComponentView, Init, replaceUrl, Update } from '../lib/framework';

export interface Params {
  message: string;
}

export interface State {
  message: string;
}

export type Msg = ComponentMsg<ADT<'setMessage', string>, Page>;

export const init: Init<Params, State> = async ({ message }) => {
  return {
    message
  };
};

export const update: Update<State, Msg> = (state, msg) => {
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
    dispatch(replaceUrl({ tag: 'say' as 'say', data: { message } }));
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
