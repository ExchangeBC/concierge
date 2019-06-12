import { makePageMetadata } from 'front-end/lib';
import { emptyPageAlerts, immutable } from 'front-end/lib/framework';
import * as StepsController from 'front-end/lib/pages/sign-up/lib/steps/controller';
import * as StepOne from 'front-end/lib/pages/sign-up/program-staff/steps/one';

export type State = StepsController.State<StepOne.Params, StepOne.State, StepOne.InnerMsg, StepOne.Params, StepOne.State, StepOne.InnerMsg, StepOne.Params, StepOne.State, StepOne.InnerMsg>;

export type Msg = StepsController.Msg<StepOne.InnerMsg, StepOne.InnerMsg, StepOne.InnerMsg>;

export type RouteParams = null;

type Component = StepsController.Component<StepOne.Params, StepOne.State, StepOne.InnerMsg, StepOne.Params, StepOne.State, StepOne.InnerMsg, StepOne.Params, StepOne.State, StepOne.InnerMsg, RouteParams>;

type ControllerHook = StepsController.Hook<StepOne.Params, StepOne.State, StepOne.InnerMsg, StepOne.Params, StepOne.State, StepOne.InnerMsg, StepOne.Params, StepOne.State, StepOne.InnerMsg>;

const init: Component['init'] = async () => {
  return {
    pageMetadata: makePageMetadata('Create an account'),
    pageAlerts: emptyPageAlerts(),
    currentStep: 'one',
    steps: {
      zero: { component: StepOne.component, state: immutable(await StepOne.component.init(null)) },
      one: { component: StepOne.component, state: immutable(await StepOne.component.init(null)) },
      two: { component: StepOne.component, state: immutable(await StepOne.component.init(null)) }
    }
  };
};

const onNext: ControllerHook = state => {
  switch (state.currentStep) {
    case 'zero':
      return [state.set('currentStep', 'one')];
    case 'one':
      return [state.set('currentStep', 'two')];
    case 'two':
      return [state.set('currentStep', 'zero')];
  }
};

const onBack: ControllerHook = state => {
  switch (state.currentStep) {
    case 'zero':
      return [state.set('currentStep', 'two')];
    case 'one':
      return [state.set('currentStep', 'zero')];
    case 'two':
      return [state.set('currentStep', 'one')];
  }
};

const onCancel: ControllerHook = state => {
  return [
    state,
    (state, dispatch) => dispatch({
      tag: '@newRoute',
      value: { tag: 'landing', value: null }
    })
  ];
};

const onFail: ControllerHook = state => {
  return [state];
};

export const component: Component = StepsController.makeComponent({
  init,
  onNext,
  onBack,
  onCancel,
  onFail
});
