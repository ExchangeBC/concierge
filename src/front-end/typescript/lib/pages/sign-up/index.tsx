import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentView, Dispatch, immutable, Immutable, Init, mapComponentDispatch, Update, updateComponentChild, View } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import * as AccountInformation from 'front-end/lib/pages/sign-up/account-information';
import * as VendorProfile from 'front-end/lib/pages/sign-up/vendor-profile';
import { isArray } from 'lodash';
import { default as React } from 'react';
import { Button, Col, Container, Row, Spinner } from 'reactstrap';
import { ADT } from 'shared/lib/types';

export interface State {
  loading: number;
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
    accountInformation: immutable(await AccountInformation.init(undefined)),
    vendorProfile: immutable(await VendorProfile.init(undefined))
  };
};

export const update: Update<State, Msg> = (state, msg) => {
  // const json = state.toJSON();
  switch (msg.tag) {
    case 'accountInformation':
      return updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'accountInformation', value }),
        childStatePath: ['accountInformation'],
        childUpdate: AccountInformation.update,
        childMsg: msg.value
      });
    case 'vendorProfile':
      return updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'vendorProfile', value }),
        childStatePath: ['vendorProfile'],
        childUpdate: VendorProfile.update,
        childMsg: msg.value
      });
    case 'createAccount':
      return [
        update(state, { tag: 'startLoading', value: undefined })[0],
        async dispatch => {
          const { email, password } = AccountInformation.getValues(state.accountInformation);
          const user = {
            email,
            password,
            acceptedTerms: false,
            profile: VendorProfile.getValues(state.vendorProfile)
          };
          const result = await api.createUser(user);
          switch (result.tag) {
            case 'valid':
              dispatch({ tag:
                '@newUrl',
                value: { tag: 'say', value: { message: 'Sign Up Successful' }}
              });
              return state;
            case 'invalid':
              const profileErrors = result.value.profile;
              if (profileErrors && !isArray(profileErrors) && profileErrors as VendorProfile.ValidationErrors) {
                state = state.set('vendorProfile', VendorProfile.setErrors(state.vendorProfile, profileErrors));
              }
              return state
                .set('accountInformation', AccountInformation.setErrors(state.accountInformation, result.value));
          }
        }
      ];
    case 'startLoading':
      return [state.set('loading', state.loading + 1)];
    case 'stopLoading':
      return [state.set('loading', Math.max(state.loading - 1, 0))];
    default:
      return [state];
  }
};

function isInvalid(state: State): boolean {
  return !AccountInformation.isValid(state.accountInformation) || !VendorProfile.isValid(state.vendorProfile);
}

function isValid(state: State): boolean {
  const info = state.accountInformation;
  const providedRequiredFields = !!(info.email.value && info.password.value && info.confirmPassword.value);
  return providedRequiredFields && !isInvalid(state);
}

const CreateAccountChild: View<{ isLoading: boolean }> = ({ isLoading }) => {
  if (isLoading) {
    return (<Spinner color='light' size='sm' />);
  } else {
    return (<div>Create Account</div>);
  }
};

export const Buttons: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const createAccount = () => dispatch({ tag: 'createAccount', value: undefined });
  const isLoading = state.loading > 0;
  const isDisabled = isLoading || !isValid(state);
  return (
    <div className='fixed-bottom bg-light py-3 border-top'>
      <Container>
        <Row>
          <Col xs='12' className='d-flex justify-content-xs-center justify-content-md-end align-items-center'>
            <a href='/' className='mr-3'>
              <Button color='secondary' disabled={isLoading}>Cancel</Button>
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
          <h1>Create an Account</h1>
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='8'>
          <p>
            Create an account to gain access to all features of the Concierge Web Application.
            <br />
            Already have an account?
            <a href='/sign-in' className='ml-2'>
              Sign in here.
            </a>
          </p>
        </Col>
      </Row>
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
