import { Component, ComponentView, Init, Update } from 'front-end/lib/framework';
import React from 'react';
import { ADT } from 'shared/lib/types';

export interface State {
  empty: true;
};

export interface Params {
  empty: true;
}

export type Msg
  = ADT<'noop'>;

export const init: Init<Params, State> = async ({ empty }) => ({
  empty
});

export const update: Update<State, Msg> = ({ state, msg }) => {
    switch (msg.tag) {
      default:
        return [state];
    }
};

export const view: ComponentView<State, Msg> = props => {
  //const { state, dispatch } = props;
  return (<div>RTE</div>);
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
