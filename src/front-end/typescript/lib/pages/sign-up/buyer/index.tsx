import { makeStartLoading, makeStopLoading, UpdateState } from 'front-end/lib';
import { makePageMetadata } from 'front-end/lib';
import router from 'front-end/lib/app/router';
import * as SelectMulti from 'front-end/lib/components/form-field-multi/select';
import { emptyPageAlerts, immutable, newRoute } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import * as StepOne from 'front-end/lib/pages/sign-up/buyer/steps/one';
import * as StepTwo from 'front-end/lib/pages/sign-up/buyer/steps/two';
import * as AccountInformation from 'front-end/lib/pages/sign-up/components/account-information';
import * as StepsController from 'front-end/lib/pages/sign-up/lib/steps/controller';
import * as StepZero from 'front-end/lib/pages/sign-up/lib/steps/zero';
import { UserType, userTypeToTitleCase } from 'shared/lib/types';

export type State = StepsController.State3<StepZero.Params, StepZero.State, StepZero.InnerMsg, StepOne.Params, StepOne.State, StepOne.InnerMsg, StepTwo.Params, StepTwo.State, StepTwo.InnerMsg>;

export type Msg = StepsController.Msg3<StepZero.InnerMsg, StepOne.InnerMsg, StepTwo.InnerMsg>;

export type RouteParams = null;

type Component = StepsController.Component3<StepZero.Params, StepZero.State, StepZero.InnerMsg, StepOne.Params, StepOne.State, StepOne.InnerMsg, StepTwo.Params, StepTwo.State, StepTwo.InnerMsg, RouteParams>;

type ControllerHook = StepsController.Hook3<StepZero.Params, StepZero.State, StepZero.InnerMsg, StepOne.Params, StepOne.State, StepOne.InnerMsg, StepTwo.Params, StepTwo.State, StepTwo.InnerMsg>;

const StepZeroComponent = StepZero.makeComponent({
  userType: UserType.Buyer,
  stepIndicator: 'Step 2 of 4',
  backLabel: 'Go Back'
});

const init: Component['init'] = async () => {
  return {
    loading: 0,
    pageMetadata: makePageMetadata(`Create a ${userTypeToTitleCase(UserType.Buyer)} Account`),
    pageAlerts: emptyPageAlerts(),
    currentStep: 'zero',
    steps: {
      zero: { component: StepZeroComponent, state: immutable(await StepZeroComponent.init(null)) },
      one: { component: StepOne.component, state: immutable(await StepOne.component.init(null)) },
      two: { component: StepTwo.component, state: immutable(await StepTwo.component.init(null)) }
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
      return [state.set('currentStep', 'two')];
    case 'two':
      return [
        startLoading(state).set('pageAlerts', emptyPageAlerts()),
        async (state, dispatch) => {
          const { zero, one, two } = state.steps;
          const accountInformation = AccountInformation.getValues(zero.state.accountInformation);
          const user = {
            ...accountInformation,
            acceptedTerms: false,
            profile: {
              type: UserType.Buyer as UserType.Buyer,
              firstName: one.state.firstName.value,
              lastName: one.state.lastName.value,
              positionTitle: one.state.positionTitle.value,
              publicSectorEntity: one.state.publicSectorEntity.value,
              branch: one.state.branch.value,
              contactCity: one.state.contactCity.value,
              industrySectors: SelectMulti.getValuesAsStrings(two.state.industrySectors),
              categories: SelectMulti.getValuesAsStrings(two.state.categories)
            }
          };
          const result = await api.createUser(user);
          switch (result.tag) {
            case 'valid':
              const rfiListUrl = router.routeToUrl({
                tag: 'requestForInformationList',
                value: null
              });
              dispatch(newRoute({
                tag: 'termsAndConditions' as const,
                value: {
                  redirectOnAccept: rfiListUrl,
                  redirectOnSkip: rfiListUrl
                }
              }));
              return null;
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
      return [
        state,
        async (state, dispatch) => {
          dispatch({
            tag: '@newRoute',
            value: { tag: 'signUp', value: null }
          });
          return null;
        }
      ];
    case 'one':
      return [state.set('currentStep', 'zero')];
    case 'two':
      return [state.set('currentStep', 'one')];
  }
};

const onCancel: ControllerHook = state => {
  return [
    state,
    async (state, dispatch) => {
      dispatch({
        tag: '@newRoute',
        value: { tag: 'landing', value: null }
      });
      return null;
    }
  ];
};

const onFail: ControllerHook = state => {
  return [state];
};

export const component: Component = StepsController.makeComponent3({
  init,
  onNext,
  onBack,
  onCancel,
  onFail
});
