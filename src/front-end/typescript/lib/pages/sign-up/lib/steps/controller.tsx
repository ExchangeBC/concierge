import { Route, SharedState } from 'front-end/lib/app/types';
import { emptyPageBreadcrumbs, GlobalComponentMsg, Immutable, mapGlobalComponentDispatch, noPageModal, PageAlerts, PageComponent, PageMetadata, UpdateChildParams, updateGlobalComponentChild, UpdateReturnValue } from 'front-end/lib/framework';
import { StepActionMsg, StepComponent, StepMsg } from 'front-end/lib/pages/sign-up/lib/steps/step';
import React from 'react';
import { ADT } from 'shared/lib/types';

export type StepId
  = 'zero'
  | 'one'
  | 'two';

interface StepState<Params, State, Msg> {
  component: StepComponent<Params, State, Msg>;
  state: Immutable<State>;
}

export interface Steps<P0, S0, M0, P1, S1, M1, P2, S2, M2> {
  zero: StepState<P0, S0, M0>;
  one: StepState<P1, S1, M1>;
  two: StepState<P2, S2, M2>;
};

export interface State<P0, S0, M0, P1, S1, M1, P2, S2, M2> {
  pageMetadata: PageMetadata;
  pageAlerts: PageAlerts;
  currentStep: StepId;
  steps: Steps<P0, S0, M0, P1, S1, M1, P2, S2, M2>;
}

type InnerMsg<M0, M1, M2>
  = ADT<'updateStepZero', StepMsg<M0>>
  | ADT<'updateStepOne', StepMsg<M1>>
  | ADT<'updateStepTwo', StepMsg<M2>>;

export type Msg<M0, M1, M2> = GlobalComponentMsg<InnerMsg<M0, M1, M2>, Route>;

export type Hook<P0, S0, M0, P1, S1, M1, P2, S2, M2> = (state: Immutable<State<P0, S0, M0, P1, S1, M1, P2, S2, M2>>) => UpdateReturnValue<State<P0, S0, M0, P1, S1, M1, P2, S2, M2>, Msg<M0, M1, M2>>;

export type Component<P0, S0, M0, P1, S1, M1, P2, S2, M2, RouteParams> = PageComponent<RouteParams, SharedState, State<P0, S0, M0, P1, S1, M1, P2, S2, M2>, Msg<M0, M1, M2>>;

export interface StepsControllerParams<P0, S0, M0, P1, S1, M1, P2, S2, M2, RouteParams> {
  init: Component<P0, S0, M0, P1, S1, M1, P2, S2, M2, RouteParams>['init'];
  onNext: Hook<P0, S0, M0, P1, S1, M1, P2, S2, M2>;
  onBack: Hook<P0, S0, M0, P1, S1, M1, P2, S2, M2>;
  onCancel: Hook<P0, S0, M0, P1, S1, M1, P2, S2, M2>;
  onFail: Hook<P0, S0, M0, P1, S1, M1, P2, S2, M2>;
}

interface UpdateStepChildParams<P0, S0, M0, P1, S1, M1, P2, S2, M2, CS, CM> extends UpdateChildParams<State<P0, S0, M0, P1, S1, M1, P2, S2, M2>, Msg<M0, M1, M2>, CS, StepMsg<CM>> {
  onNext: Hook<P0, S0, M0, P1, S1, M1, P2, S2, M2>;
  onBack: Hook<P0, S0, M0, P1, S1, M1, P2, S2, M2>;
  onCancel: Hook<P0, S0, M0, P1, S1, M1, P2, S2, M2>;
  onFail: Hook<P0, S0, M0, P1, S1, M1, P2, S2, M2>;
}

function updateStepChild<P0, S0, M0, P1, S1, M1, P2, S2, M2, CS, CM>(params: UpdateStepChildParams<P0, S0, M0, P1, S1, M1, P2, S2, M2, CS, StepActionMsg | CM>): UpdateReturnValue<State<P0, S0, M0, P1, S1, M1, P2, S2, M2>, Msg<M0, M1, M2>> {
  switch ((params.childMsg as StepActionMsg).tag) {
    case '$next':
      return params.onNext(params.state);
    case '$back':
      return params.onBack(params.state);
    case '$cancel':
      return params.onCancel(params.state);
    case '$fail':
      return params.onFail(params.state);
    default:
      return updateGlobalComponentChild(params);
  }
}

function makeUpdate<P0, S0, M0, P1, S1, M1, P2, S2, M2, RouteParams>(params: StepsControllerParams<P0, S0, M0, P1, S1, M1, P2, S2, M2, RouteParams>): Component<P0, S0, M0, P1, S1, M1, P2, S2, M2, RouteParams>['update'] {
  return ({ state, msg }) => {
    const defaultParams = {
      state,
      onNext: params.onNext,
      onBack: params.onBack,
      onCancel: params.onCancel,
      onFail: params.onFail
    };
    switch (msg.tag) {
      case 'updateStepZero':
        return updateStepChild({
          ...defaultParams,
          childStatePath: ['steps', 'zero', 'state'],
          childUpdate: state.steps.zero.component.update,
          childMsg: msg.value,
          mapChildMsg: value => ({ tag: 'updateStepZero', value })
        });
      case 'updateStepOne':
        return updateStepChild({
          ...defaultParams,
          childStatePath: ['steps', 'one', 'state'],
          childUpdate: state.steps.one.component.update,
          childMsg: msg.value,
          mapChildMsg: value => ({ tag: 'updateStepOne', value })
        });
      case 'updateStepTwo':
        return updateStepChild({
          ...defaultParams,
          childStatePath: ['steps', 'two', 'state'],
          childUpdate: state.steps.two.component.update,
          childMsg: msg.value,
          mapChildMsg: value => ({ tag: 'updateStepTwo', value })
        });
      default:
        return [state];
    }
  };
}

function makeView<P0, S0, M0, P1, S1, M1, P2, S2, M2, RouteParams>(params: StepsControllerParams<P0, S0, M0, P1, S1, M1, P2, S2, M2, RouteParams>): Component<P0, S0, M0, P1, S1, M1, P2, S2, M2, RouteParams>['view'] {
  return ({ state, dispatch }) => {
    switch (state.currentStep) {
      case 'zero':
        return (
          <state.steps.zero.component.view
            state={state.steps.zero.state}
            dispatch={mapGlobalComponentDispatch(dispatch, value => ({ tag: 'updateStepZero', value }))} />
        );
      case 'one':
        return (
          <state.steps.one.component.view
            state={state.steps.one.state}
            dispatch={mapGlobalComponentDispatch(dispatch, value => ({ tag: 'updateStepOne', value }))} />
        );
      case 'two':
        return (
          <state.steps.two.component.view
            state={state.steps.two.state}
            dispatch={mapGlobalComponentDispatch(dispatch, value => ({ tag: 'updateStepTwo', value }))} />
        );
    }
  };
}

function makeViewBottomBar<P0, S0, M0, P1, S1, M1, P2, S2, M2, RouteParams>(params: StepsControllerParams<P0, S0, M0, P1, S1, M1, P2, S2, M2, RouteParams>): Component<P0, S0, M0, P1, S1, M1, P2, S2, M2, RouteParams>['viewBottomBar'] {
  return ({ state, dispatch }) => {
    switch (state.currentStep) {
      case 'zero':
        return (
          <state.steps.zero.component.viewBottomBar
            state={state.steps.zero.state}
            dispatch={mapGlobalComponentDispatch(dispatch, value => ({ tag: 'updateStepZero', value }))} />
        );
      case 'one':
        return (
          <state.steps.one.component.viewBottomBar
            state={state.steps.one.state}
            dispatch={mapGlobalComponentDispatch(dispatch, value => ({ tag: 'updateStepOne', value }))} />
        );
      case 'two':
        return (
          <state.steps.two.component.viewBottomBar
            state={state.steps.two.state}
            dispatch={mapGlobalComponentDispatch(dispatch, value => ({ tag: 'updateStepTwo', value }))} />
        );
    }
  };
}

export function makeComponent<P0, S0, M0, P1, S1, M1, P2, S2, M2, RouteParams>(params: StepsControllerParams<P0, S0, M0, P1, S1, M1, P2, S2, M2, RouteParams>): Component<P0, S0, M0, P1, S1, M1, P2, S2, M2, RouteParams> {
  return {
    init: params.init,
    update: makeUpdate(params),
    view: makeView(params),
    viewBottomBar: makeViewBottomBar(params),
    getAlerts(state) {
      return state.pageAlerts;
    },
    getMetadata(state) {
      return state.pageMetadata;
    },
    getBreadcrumbs: emptyPageBreadcrumbs,
    getModal: noPageModal
  };
}
