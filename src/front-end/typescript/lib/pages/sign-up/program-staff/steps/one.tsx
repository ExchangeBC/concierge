import { ComponentView, Init, Update } from 'front-end/lib/framework';
import { IsLoading, IsValid, makeView, makeViewBottomBar, StepComponent, StepMsg } from 'front-end/lib/pages/sign-up/lib/steps/step';
import React from 'react';
import { ADT } from 'shared/lib/types';

export interface State {
  loading: number;
  message: string;
}

export type InnerMsg
  = ADT<'noop'>;

export type Msg = StepMsg<InnerMsg>;

export type Params = null;

const init: Init<Params, State> = async () => {
  return {
    loading: 0,
    message: 'Hello, world'
  };
};

const update: Update<State, Msg> = ({ state, msg }) => {
  return [state];
};

const isValid: IsValid<State> = (state) => true;

const isLoading: IsLoading<State> = (state) => false;

const view: ComponentView<State, Msg> = makeView({
  title: 'Title',
  stepIndicator: 'Step 1 of 3',
  view({ state, dispatch }) {
    return (<div>{state.message}</div>);
  }
});

const viewBottomBar: ComponentView<State, Msg> = makeViewBottomBar({
  isValid,
  isLoading,
  actionLabels: {
    next: 'Next',
    cancel: 'Cancel'
  }
});

export const component: StepComponent<Params, State, InnerMsg> = {
  init,
  update,
  view,
  viewBottomBar,
  isValid,
  isLoading
};

export default component;
