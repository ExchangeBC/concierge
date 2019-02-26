import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentView, Init, replaceUrl, Update } from 'front-end/lib/framework';
import React from 'react';
import { ADT } from 'shared/lib/types';

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
      return [state.set('message', msg.value)];
    default:
      return [state];
  }
};

export const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  function double() {
    const message = `${state.message} ${state.message}`;
    dispatch({ tag: 'setMessage', value: message });
    dispatch(replaceUrl({ tag: 'say' as 'say', value: { message } }));
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
