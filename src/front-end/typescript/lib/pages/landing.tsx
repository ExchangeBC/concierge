import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentView, Init, Update } from 'front-end/lib/framework';
import React from 'react';

export type Params = null;

export interface State {
  empty: true;
};

export type Msg = ComponentMsg<null, Page>;

export const init: Init<Params, State> = async () => {
  return { empty: true };
};

export const update: Update<State, Msg> = (state, msg) => {
  return [state];
};

export const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  return (
    <div></div>
  );
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
