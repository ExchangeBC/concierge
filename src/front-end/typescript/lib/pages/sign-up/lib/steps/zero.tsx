import { ComponentView, Dispatch, immutable, Immutable, Init, mapComponentDispatch, Update, updateComponentChild } from 'front-end/lib/framework';
import * as AccountInformation from 'front-end/lib/pages/sign-up/components/account-information';
import { IsLoading, IsValid, makeView, StepComponent, StepMsg } from 'front-end/lib/pages/sign-up/lib/steps/step';
import React from 'react';
import { Col, Row } from 'reactstrap';
import { CreateValidationErrors } from 'shared/lib/resources/user';
import { ADT, UserType, userTypeToTitleCase } from 'shared/lib/types';

export interface State {
  accountInformation: Immutable<AccountInformation.State>;
}

export type InnerMsg
  = ADT<'noop'>
  | ADT<'accountInformation', AccountInformation.Msg>;

export type Msg = StepMsg<InnerMsg>;

export type Params = null;

const init: Init<Params, State> = async () => {
  return {
    accountInformation: immutable(await AccountInformation.init(null))
  };
};

const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'accountInformation':
      return updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'accountInformation' as const, value }),
        childStatePath: ['accountInformation'],
        childUpdate: AccountInformation.update,
        childMsg: msg.value
      });
    default:
      return [state];
  }
};

const isValid: IsValid<State> = (state) => AccountInformation.isValid(state.accountInformation);

const isLoading: IsLoading<State> = (state) => false;

function view(params: MakeComponentParams): ComponentView<State, Msg> {
  return makeView({
    title: `Create a ${userTypeToTitleCase(params.userType)} Account`,
    stepIndicator: params.stepIndicator,
    view({ state, dispatch }) {
      const dispatchAccountInformation: Dispatch<AccountInformation.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'accountInformation' as const, value }));
      return (
        <Row>
          <Col xs='12' md='4'>
            <AccountInformation.view state={state.accountInformation} dispatch={dispatchAccountInformation} />
          </Col>
        </Row>
      );
    }
  });
}

export interface MakeComponentParams {
  userType: UserType;
  stepIndicator: string
  backLabel?: string
}

export function makeComponent(params: MakeComponentParams): StepComponent<Params, State, InnerMsg> {
  return {
    init,
    update,
    view: view(params),
    isValid,
    isLoading,
    actionLabels: {
      next: 'Next',
      cancel: 'Cancel',
      back: params.backLabel
    }
  };
}

export function setErrors(state: Immutable<State>, errors: CreateValidationErrors): Immutable<State> {
  return state.set('accountInformation', AccountInformation.setErrors(state.accountInformation, errors));
}
