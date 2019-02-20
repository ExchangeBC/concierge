import React from 'react';
import { Page } from '../app/types';
import { Component, ComponentMsg, ComponentView, Init, Update } from '../lib/framework';

export interface State {
  value: null;
}

export type Msg = ComponentMsg<null, Page>;

export const init: Init<null, State> = async () => {
  return {
    value: null
  };
};

export const update: Update<State, Msg> = (state, msg) => {
  return [state];
};

export const view: ComponentView<State, Msg> = () => {
  return (
    <div>Loading</div>
  );
};

export const component: Component<null, State, Msg> = {
  init,
  update,
  view
};
