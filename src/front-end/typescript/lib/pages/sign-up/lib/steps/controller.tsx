import { Route, SharedState } from 'front-end/lib/app/types';
import { ComponentViewProps, emptyPageBreadcrumbs, GlobalComponentMsg, Immutable, mapGlobalComponentDispatch, noPageModal, PageAlerts, PageComponent, PageMetadata, updateGlobalComponentChild, UpdateReturnValue } from 'front-end/lib/framework';
import { StepComponent, StepMsg } from 'front-end/lib/pages/sign-up/lib/steps/step';
import Icon from 'front-end/lib/views/icon';
import FixedBar from 'front-end/lib/views/layout/fixed-bar';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import React from 'react';
import { ADT } from 'shared/lib/types';

export const FAILURE_ERROR_MESSAGE = 'Please fix the errors noted in each step and try submitting the form again.';

// Shared.

interface StepState<Params, State, Msg> {
  component: StepComponent<Params, State, Msg>;
  state: Immutable<State>;
}

type CommonMsg = ADT<'next'> | ADT<'back'> | ADT<'cancel'> | ADT<'fail'>;

// Two Steps.

export type StepId2 = 'zero' | 'one';

export interface Steps2<P0, S0, M0, P1, S1, M1> {
  zero: StepState<P0, S0, M0>;
  one: StepState<P1, S1, M1>;
}

export interface State2<P0, S0, M0, P1, S1, M1> {
  loading: 0;
  pageMetadata: PageMetadata;
  pageAlerts: PageAlerts;
  currentStep: StepId2;
  steps: Steps2<P0, S0, M0, P1, S1, M1>;
}

type InnerMsg2<M0, M1> = ADT<'updateStepZero', StepMsg<M0>> | ADT<'updateStepOne', StepMsg<M1>> | CommonMsg;

export type Msg2<M0, M1> = GlobalComponentMsg<InnerMsg2<M0, M1>, Route>;

export type Hook2<P0, S0, M0, P1, S1, M1> = (state: Immutable<State2<P0, S0, M0, P1, S1, M1>>) => UpdateReturnValue<State2<P0, S0, M0, P1, S1, M1>, Msg2<M0, M1>>;

export type Component2<P0, S0, M0, P1, S1, M1, RouteParams> = PageComponent<RouteParams, SharedState, State2<P0, S0, M0, P1, S1, M1>, Msg2<M0, M1>>;

export interface StepsControllerParams2<P0, S0, M0, P1, S1, M1, RouteParams> {
  init: Component2<P0, S0, M0, P1, S1, M1, RouteParams>['init'];
  onNext: Hook2<P0, S0, M0, P1, S1, M1>;
  onBack: Hook2<P0, S0, M0, P1, S1, M1>;
  onCancel: Hook2<P0, S0, M0, P1, S1, M1>;
  onFail: Hook2<P0, S0, M0, P1, S1, M1>;
}

function makeUpdate2<P0, S0, M0, P1, S1, M1, RouteParams>(params: StepsControllerParams2<P0, S0, M0, P1, S1, M1, RouteParams>): Component2<P0, S0, M0, P1, S1, M1, RouteParams>['update'] {
  return ({ state, msg }) => {
    switch (msg.tag) {
      case 'updateStepZero':
        return updateGlobalComponentChild({
          state,
          childStatePath: ['steps', 'zero', 'state'],
          childUpdate: state.steps.zero.component.update,
          childMsg: msg.value,
          mapChildMsg: (value) => ({ tag: 'updateStepZero', value })
        });
      case 'updateStepOne':
        return updateGlobalComponentChild({
          state,
          childStatePath: ['steps', 'one', 'state'],
          childUpdate: state.steps.one.component.update,
          childMsg: msg.value,
          mapChildMsg: (value) => ({ tag: 'updateStepOne', value })
        });
      case 'next':
        return params.onNext(state);
      case 'back':
        return params.onBack(state);
      case 'cancel':
        return params.onCancel(state);
      case 'fail':
        return params.onFail(state);
      default:
        return [state];
    }
  };
}

function makeView2<P0, S0, M0, P1, S1, M1, RouteParams>(params: StepsControllerParams2<P0, S0, M0, P1, S1, M1, RouteParams>): Component2<P0, S0, M0, P1, S1, M1, RouteParams>['view'] {
  return ({ state, dispatch }) => {
    switch (state.currentStep) {
      case 'zero':
        return <state.steps.zero.component.view state={state.steps.zero.state} dispatch={mapGlobalComponentDispatch(dispatch, (value) => ({ tag: 'updateStepZero', value }))} />;
      case 'one':
        return <state.steps.one.component.view state={state.steps.one.state} dispatch={mapGlobalComponentDispatch(dispatch, (value) => ({ tag: 'updateStepOne', value }))} />;
    }
  };
}

function makeViewBottomBar2<P0, S0, M0, P1, S1, M1, RouteParams>(params: StepsControllerParams2<P0, S0, M0, P1, S1, M1, RouteParams>): Component2<P0, S0, M0, P1, S1, M1, RouteParams>['viewBottomBar'] {
  function ViewFixedBar<P, S, M>(props: { step: StepState<P, S, M> } & ComponentViewProps<State2<P0, S0, M0, P1, S1, M1>, Msg2<M0, M1>>) {
    const { step, state, dispatch } = props;
    const isValid = step.component.isValid(step.state);
    const isLoading = step.component.isLoading(step.state) || state.loading > 0;
    const isDisabled = !isValid || isLoading;
    const nextOnClick = () => !isDisabled && dispatch({ tag: 'next', value: undefined });
    const backOnClick = () => dispatch({ tag: 'back', value: undefined });
    const cancelOnClick = () => dispatch({ tag: 'cancel', value: undefined });
    const { next, back, cancel } = step.component.actionLabels;
    return (
      <FixedBar>
        <LoadingButton color="primary" onClick={nextOnClick} loading={isLoading} disabled={isDisabled} className="text-nowrap">
          {next}
        </LoadingButton>
        <Link onClick={cancelOnClick} color="secondary" disabled={isLoading} className={`mx-${back ? 'md-' : ''}3 order-3 order-md-2`}>
          {cancel}
        </Link>
        {back ? (
          <Link onClick={backOnClick} color="secondary" disabled={isLoading} className="mr-md-auto d-flex flex-nowrap align-items-center order-2 order-md-3 mx-3 mx-md-0">
            <Icon name="chevron-left" color="secondary" className="d-none d-md-block" />
            {back}
          </Link>
        ) : null}
      </FixedBar>
    );
  }

  return (props) => {
    switch (props.state.currentStep) {
      case 'zero':
        return <ViewFixedBar step={props.state.steps.zero} {...props} />;
      case 'one':
        return <ViewFixedBar step={props.state.steps.one} {...props} />;
    }
  };
}

export function makeComponent2<P0, S0, M0, P1, S1, M1, RouteParams>(params: StepsControllerParams2<P0, S0, M0, P1, S1, M1, RouteParams>): Component2<P0, S0, M0, P1, S1, M1, RouteParams> {
  return {
    init: params.init,
    update: makeUpdate2(params),
    view: makeView2(params),
    viewBottomBar: makeViewBottomBar2(params),
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

// Three Steps.

export type StepId3 = 'zero' | 'one' | 'two';

export interface Steps3<P0, S0, M0, P1, S1, M1, P2, S2, M2> {
  zero: StepState<P0, S0, M0>;
  one: StepState<P1, S1, M1>;
  two: StepState<P2, S2, M2>;
}

export interface State3<P0, S0, M0, P1, S1, M1, P2, S2, M2> {
  loading: 0;
  pageMetadata: PageMetadata;
  pageAlerts: PageAlerts;
  currentStep: StepId3;
  steps: Steps3<P0, S0, M0, P1, S1, M1, P2, S2, M2>;
}

type InnerMsg3<M0, M1, M2> = ADT<'updateStepZero', StepMsg<M0>> | ADT<'updateStepOne', StepMsg<M1>> | ADT<'updateStepTwo', StepMsg<M2>> | CommonMsg;

export type Msg3<M0, M1, M2> = GlobalComponentMsg<InnerMsg3<M0, M1, M2>, Route>;

export type Hook3<P0, S0, M0, P1, S1, M1, P2, S2, M2> = (state: Immutable<State3<P0, S0, M0, P1, S1, M1, P2, S2, M2>>) => UpdateReturnValue<State3<P0, S0, M0, P1, S1, M1, P2, S2, M2>, Msg3<M0, M1, M2>>;

export type Component3<P0, S0, M0, P1, S1, M1, P2, S2, M2, RouteParams> = PageComponent<RouteParams, SharedState, State3<P0, S0, M0, P1, S1, M1, P2, S2, M2>, Msg3<M0, M1, M2>>;

export interface StepsControllerParams3<P0, S0, M0, P1, S1, M1, P2, S2, M2, RouteParams> {
  init: Component3<P0, S0, M0, P1, S1, M1, P2, S2, M2, RouteParams>['init'];
  onNext: Hook3<P0, S0, M0, P1, S1, M1, P2, S2, M2>;
  onBack: Hook3<P0, S0, M0, P1, S1, M1, P2, S2, M2>;
  onCancel: Hook3<P0, S0, M0, P1, S1, M1, P2, S2, M2>;
  onFail: Hook3<P0, S0, M0, P1, S1, M1, P2, S2, M2>;
}

function makeUpdate3<P0, S0, M0, P1, S1, M1, P2, S2, M2, RouteParams>(params: StepsControllerParams3<P0, S0, M0, P1, S1, M1, P2, S2, M2, RouteParams>): Component3<P0, S0, M0, P1, S1, M1, P2, S2, M2, RouteParams>['update'] {
  return ({ state, msg }) => {
    switch (msg.tag) {
      case 'updateStepZero':
        return updateGlobalComponentChild({
          state,
          childStatePath: ['steps', 'zero', 'state'],
          childUpdate: state.steps.zero.component.update,
          childMsg: msg.value,
          mapChildMsg: (value) => ({ tag: 'updateStepZero', value })
        });
      case 'updateStepOne':
        return updateGlobalComponentChild({
          state,
          childStatePath: ['steps', 'one', 'state'],
          childUpdate: state.steps.one.component.update,
          childMsg: msg.value,
          mapChildMsg: (value) => ({ tag: 'updateStepOne', value })
        });
      case 'updateStepTwo':
        return updateGlobalComponentChild({
          state,
          childStatePath: ['steps', 'two', 'state'],
          childUpdate: state.steps.two.component.update,
          childMsg: msg.value,
          mapChildMsg: (value) => ({ tag: 'updateStepTwo', value })
        });
      case 'next':
        return params.onNext(state);
      case 'back':
        return params.onBack(state);
      case 'cancel':
        return params.onCancel(state);
      case 'fail':
        return params.onFail(state);
      default:
        return [state];
    }
  };
}

function makeView3<P0, S0, M0, P1, S1, M1, P2, S2, M2, RouteParams>(params: StepsControllerParams3<P0, S0, M0, P1, S1, M1, P2, S2, M2, RouteParams>): Component3<P0, S0, M0, P1, S1, M1, P2, S2, M2, RouteParams>['view'] {
  return ({ state, dispatch }) => {
    switch (state.currentStep) {
      case 'zero':
        return <state.steps.zero.component.view state={state.steps.zero.state} dispatch={mapGlobalComponentDispatch(dispatch, (value) => ({ tag: 'updateStepZero', value }))} />;
      case 'one':
        return <state.steps.one.component.view state={state.steps.one.state} dispatch={mapGlobalComponentDispatch(dispatch, (value) => ({ tag: 'updateStepOne', value }))} />;
      case 'two':
        return <state.steps.two.component.view state={state.steps.two.state} dispatch={mapGlobalComponentDispatch(dispatch, (value) => ({ tag: 'updateStepTwo', value }))} />;
    }
  };
}

function makeViewBottomBar3<P0, S0, M0, P1, S1, M1, P2, S2, M2, RouteParams>(params: StepsControllerParams3<P0, S0, M0, P1, S1, M1, P2, S2, M2, RouteParams>): Component3<P0, S0, M0, P1, S1, M1, P2, S2, M2, RouteParams>['viewBottomBar'] {
  function ViewFixedBar<P, S, M>(props: { step: StepState<P, S, M> } & ComponentViewProps<State3<P0, S0, M0, P1, S1, M1, P2, S2, M2>, Msg3<M0, M1, M2>>) {
    const { step, state, dispatch } = props;
    const isValid = step.component.isValid(step.state);
    const isLoading = step.component.isLoading(step.state) || state.loading > 0;
    const isDisabled = !isValid || isLoading;
    const nextOnClick = () => !isDisabled && dispatch({ tag: 'next', value: undefined });
    const backOnClick = () => dispatch({ tag: 'back', value: undefined });
    const cancelOnClick = () => dispatch({ tag: 'cancel', value: undefined });
    const { next, back, cancel } = step.component.actionLabels;
    return (
      <FixedBar>
        <LoadingButton color="primary" onClick={nextOnClick} loading={isLoading} disabled={isDisabled} className="text-nowrap">
          {next}
        </LoadingButton>
        <Link onClick={cancelOnClick} color="secondary" disabled={isLoading} className="mx-md-3 order-3 order-md-2">
          {cancel}
        </Link>
        {back ? (
          <Link onClick={backOnClick} color="secondary" disabled={isLoading} className="mr-md-auto d-flex flex-nowrap align-items-center order-2 order-md-3 mx-3 mx-md-0">
            <Icon name="chevron-left" color="secondary" className="d-none d-md-block" />
            {back}
          </Link>
        ) : null}
      </FixedBar>
    );
  }

  return (props) => {
    switch (props.state.currentStep) {
      case 'zero':
        return <ViewFixedBar step={props.state.steps.zero} {...props} />;
      case 'one':
        return <ViewFixedBar step={props.state.steps.one} {...props} />;
      case 'two':
        return <ViewFixedBar step={props.state.steps.two} {...props} />;
    }
  };
}

export function makeComponent3<P0, S0, M0, P1, S1, M1, P2, S2, M2, RouteParams>(params: StepsControllerParams3<P0, S0, M0, P1, S1, M1, P2, S2, M2, RouteParams>): Component3<P0, S0, M0, P1, S1, M1, P2, S2, M2, RouteParams> {
  return {
    init: params.init,
    update: makeUpdate3(params),
    view: makeView3(params),
    viewBottomBar: makeViewBottomBar3(params),
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
