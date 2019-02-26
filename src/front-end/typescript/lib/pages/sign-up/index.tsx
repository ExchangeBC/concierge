import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentView, Dispatch, immutable, Immutable, Init, mapComponentDispatch, Update, updateChild, View } from 'front-end/lib/framework';
import * as AccountInformation from 'front-end/lib/pages/sign-up/account-information';
import * as VendorProfile from 'front-end/lib/pages/sign-up/vendor-profile';
import { flatten, reduce } from 'lodash';
import { default as React } from 'react';
import { Alert, Button, Col, Container, Row, Spinner } from 'reactstrap';
import { ADT } from 'shared/lib/types';

export interface State {
  loading: number;
  content: {
    title: string;
    description: string;
  };
  accountInformation: Immutable<AccountInformation.State>;
  vendorProfile: Immutable<VendorProfile.State>;
}

type InnerMsg
  = ADT<'accountInformation', AccountInformation.Msg>
  | ADT<'vendorProfile', VendorProfile.Msg>
  | ADT<'createAccount'>
  | ADT<'startLoading'>
  | ADT<'stopLoading'>;

export type Msg = ComponentMsg<InnerMsg, Page>;

export const init: Init<null, State> = async () => {
  return {
    loading: 0,
    content: {
      title: 'Create Account',
      description: 'Create account to gain access to all features of the Concierge Web Application.'
    },
    accountInformation: immutable(await AccountInformation.init(undefined)),
    vendorProfile: immutable(await VendorProfile.init(undefined))
  };
};

export const update: Update<State, Msg> = (state, msg) => {
  // const json = state.toJSON();
  switch (msg.tag) {
    case 'accountInformation':
      return updateChild({
        state,
        childStatePath: ['accountInformation'],
        childUpdate: AccountInformation.update,
        childMsg: msg.value
      });
    case 'vendorProfile':
      return updateChild({
        state,
        childStatePath: ['vendorProfile'],
        childUpdate: VendorProfile.update,
        childMsg: msg.value
      });
    case 'createAccount':
      return [
        update(state, { tag: 'startLoading', value: undefined })[0]
      ];
    case 'startLoading':
      return [state.set('loading', state.loading + 1)];
    case 'stopLoading':
      return [state.set('loading', Math.max(state.loading - 1, 0))];
    default:
      return [state];
  }
};

function validationErrorsToStrings(state: State): string[] {
  return flatten([
    AccountInformation.getValidationErrors(state.accountInformation),
    VendorProfile.getValidationErrors(state.vendorProfile)
  ]);
}

function hasErrors(state: State): boolean {
  const objectIsValid = (obj: object) => reduce(obj, (acc, v: string[]) => {
    return acc && !v.length
  }, true);
  return !objectIsValid(state.accountInformation.validationErrors) || !objectIsValid(state.vendorProfile.validationErrors);
}

function isValid(state: State): boolean {
  const info = state.accountInformation;
  const providedRequiredFields = !!(info.email.value && info.password.value && info.confirmPassword.value);
  return providedRequiredFields && !hasErrors(state);
}

const CreateAccountChild: View<{ isLoading: boolean }> = ({ isLoading }) => {
  if (isLoading) {
    return (<Spinner color='light' size='sm' />);
  } else {
    return (<div>Create Account</div>);
  }
};

export const ConditionalErrors: ComponentView<State, Msg> = ({ state }) => {
  if (hasErrors(state)) {
    const errors = validationErrorsToStrings(state)
      .map((s, i) => (
        <div key={i}>
          {s}
        </div>
      ));
    return (
      <Row className='mt-3'>
        <Col xs='12'>
          <Alert color='danger'>
            {errors}
          </Alert>
        </Col>
      </Row>
    );
  } else {
    return null;
  }
};

export const Buttons: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const createAccount = () => dispatch({ tag: 'createAccount', value: undefined });
  const isLoading = state.loading > 0;
  const isDisabled = isLoading || !isValid(state);
  return (
    <div className='fixed-bottom'>
      <Container>
        <Row>
          <Col xs='12' className='button-wrapper'>
            <a href='/'>
              <Button color='secondary' disabled={isDisabled}>Cancel</Button>
            </a>
            <Button color='primary' onClick={createAccount} disabled={isDisabled}>
              <CreateAccountChild isLoading={isLoading} />
            </Button>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export const view: ComponentView<State, Msg> = props => {
  const { state, dispatch } = props;
  const dispatchAccountInformation: Dispatch<AccountInformation.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'accountInformation' as 'accountInformation', value }));
  const dispatchVendorProfile: Dispatch<VendorProfile.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'vendorProfile' as 'vendorProfile', value }));
  return (
    <div>
      <Row>
        <Col xs='12'>
          <h1>{state.content.title}</h1>
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='8'>
          <p>
            {state.content.description}
            <br />
            Already have an account?
            <a href='/sign-in' className='ml-2'>
              Sign in here.
            </a>
          </p>
        </Col>
      </Row>
      <ConditionalErrors state={state} dispatch={dispatch} />
      <Row className='mt-3'>
        <Col xs='12' md='4'>
          <AccountInformation.view state={state.accountInformation} dispatch={dispatchAccountInformation} />
        </Col>
        <Col md='1' className='vertical-line'></Col>
        <Col xs='12' md='7'>
          <VendorProfile.view state={state.vendorProfile} dispatch={dispatchVendorProfile} />
        </Col>
      </Row>
      <Buttons {...props} />
    </div>
  );
};

export const component: Component<null, State, Msg> = {
  init,
  update,
  view
};
