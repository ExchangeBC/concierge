import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentView, Init, Update } from 'front-end/lib/framework';
import React from 'react';
import { ADT } from 'shared/lib/types';

export type Params = undefined;

export interface State {
  isOpen: boolean;
  content: {
    title: string;
  };
}

export type Msg = ComponentMsg<ADT<'toggleNav'>, Page>;

export const init: Init<Params, State> = async () => {
  return {
    isOpen: false,
    content: {
      title: 'BCGov Concierge'
    }
  };
};

export const update: Update<State, Msg> = (state, msg) => {
  switch (msg.tag) {
    case 'toggleNav':
      return [state.set('isOpen', !state.get('isOpen'))];
    default:
      return [state];
  }
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
