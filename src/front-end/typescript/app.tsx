import React from 'react';
import { App, ComponentView, Init, Msg, Update } from './lib/framework';

const DEFAULT_TEXT = 'Hello, world.';

interface AppState {
  text: string;
}

type AppMsg = Msg<'updateText', string> | Msg<'resetText'>;

export const init: Init<AppState> = async () => {
  return {
    text: DEFAULT_TEXT
  };
};

export const update: Update<AppState, AppMsg> = (state, msg) => {
  switch (msg.tag) {
    case 'updateText':
      return [state.set('text', msg.data)];
    case 'resetText':
      return [state.set('text', DEFAULT_TEXT)];
    default:
      return [state];
  }
};

export const view: ComponentView<AppState, AppMsg> = ({ state, dispatch }) => {
  const jsState = state.toJS();
  return (
    <div>
      <h1>{jsState.text}</h1>
      <button onClick={() => dispatch({ tag: 'updateText', data: 'Hi, world.' })}>
        {`Say "hi"`}
      </button>
      <button onClick={() => dispatch({ tag: 'resetText', data: undefined })}>
        {`Say "hello"`}
      </button>
    </div>
  );
};

export const app: App<AppState, AppMsg> = {
  init,
  update,
  view,
  routes: []
};
