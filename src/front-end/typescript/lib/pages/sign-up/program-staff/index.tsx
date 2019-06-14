import { makeStartLoading, makeStopLoading, UpdateState } from 'front-end/lib';
import { makePageMetadata } from 'front-end/lib';
import { emptyPageAlerts, immutable, newRoute } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import * as AccountInformation from 'front-end/lib/pages/sign-up/components/account-information';
import * as StepsController from 'front-end/lib/pages/sign-up/lib/steps/controller';
import * as StepZero from 'front-end/lib/pages/sign-up/lib/steps/zero';
import * as StepOne from 'front-end/lib/pages/sign-up/program-staff/steps/one';
import { UserType, userTypeToTitleCase } from 'shared/lib/types';

export type State = StepsController.State2<StepZero.Params, StepZero.State, StepZero.InnerMsg, StepOne.Params, StepOne.State, StepOne.InnerMsg>;

export type Msg = StepsController.Msg2<StepZero.InnerMsg, StepOne.InnerMsg>;

export type RouteParams = null;

type Component = StepsController.Component2<StepZero.Params, StepZero.State, StepZero.InnerMsg, StepOne.Params, StepOne.State, StepOne.InnerMsg, RouteParams>;

type ControllerHook = StepsController.Hook2<StepZero.Params, StepZero.State, StepZero.InnerMsg, StepOne.Params, StepOne.State, StepOne.InnerMsg>;

const StepZeroComponent = StepZero.makeComponent({
  userType: UserType.ProgramStaff,
  stepIndicator: 'Step 1 of 2'
});

const init: Component['init'] = async () => {
  return {
    loading: 0,
    pageMetadata: makePageMetadata(`Create a ${userTypeToTitleCase(UserType.ProgramStaff)} Account`),
    pageAlerts: emptyPageAlerts(),
    currentStep: 'zero',
    steps: {
      zero: { component: StepZeroComponent, state: immutable(await StepZeroComponent.init(null)) },
      one: { component: StepOne.component, state: immutable(await StepOne.component.init(null)) }
    }
  };
};

const startLoading: UpdateState<State> = makeStartLoading('loading');
const stopLoading: UpdateState<State> = makeStopLoading('loading');

const onNext: ControllerHook = state => {
  switch (state.currentStep) {
    case 'zero':
      return [state.set('currentStep', 'one')];
    case 'one':
      return [
        startLoading(state).set('pageAlerts', emptyPageAlerts()),
        async (state, dispatch) => {
          const { zero, one } = state.steps;
          const user = {
            ...AccountInformation.getValues(zero.state.accountInformation),
            acceptedTerms: false,
            profile: {
              type: UserType.ProgramStaff as UserType.ProgramStaff,
              firstName: one.state.firstName.value,
              lastName: one.state.lastName.value,
              positionTitle: one.state.positionTitle.value
            }
          };
          const result = await api.createUser(user);
          switch (result.tag) {
            case 'valid':
              dispatch(newRoute({
                tag: 'userList' as const,
                value: null
              }));
              return state;
            case 'invalid':
              return stopLoading(state)
                .setIn(['steps', 'zero', 'state'], StepZero.setErrors(zero.state, result.value))
                .setIn(['steps', 'one', 'state'], StepOne.setErrors(one.state, result.value))
                .set('currentStep', 'zero')
                .set('pageAlerts', {
                  ...emptyPageAlerts(),
                  errors: [StepsController.FAILURE_ERROR_MESSAGE]
                });
          }
        }
      ];
  }
};

const onBack: ControllerHook = state => {
  switch (state.currentStep) {
    case 'zero':
      return [state.set('currentStep', 'one')];
    case 'one':
      return [state.set('currentStep', 'zero')];
  }
};

const onCancel: ControllerHook = state => {
  return [
    state,
    async (state, dispatch) => {
      dispatch({
        tag: '@newRoute',
        value: { tag: 'userList', value: null }
      });
      return state;
    }
  ];
};

const onFail: ControllerHook = state => {
  return [state];
};

export const component: Component = StepsController.makeComponent2({
  init,
  onNext,
  onBack,
  onCancel,
  onFail
});
