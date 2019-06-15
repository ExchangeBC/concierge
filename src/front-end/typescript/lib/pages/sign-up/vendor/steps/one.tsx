import { ComponentView, Immutable, Init, Update } from 'front-end/lib/framework';
import { IsLoading, IsValid, makeView, StepComponent, StepMsg } from 'front-end/lib/pages/sign-up/lib/steps/step';
import * as Select from 'front-end/lib/views/form-field/select';
import * as ShortText from 'front-end/lib/views/form-field/short-text';
import { get } from 'lodash';
import React from 'react';
import { Col, Row } from 'reactstrap';
import AVAILABLE_HEAD_OFFICE_LOCATIONS from 'shared/data/head-office-locations';
import AVAILABLE_INDIGENOUS_OWNERSHIP from 'shared/data/indigenous-ownership';
import AVAILABLE_NUMBER_OF_EMPLOYEES from 'shared/data/number-of-employees';
import { CreateValidationErrors } from 'shared/lib/resources/user';
import { ADT } from 'shared/lib/types';
import { getInvalidValue, mapValid, validateBusinessName, validateContactName, validateHeadOfficeLocation, validateIndigenousOwnership, validateNumberOfEmployees, Validation } from 'shared/lib/validators';
import { businessCityIsRequired, validateBusinessCity } from 'shared/lib/validators/vendor-profile';

export interface State {
  businessName: ShortText.State;
  businessCity: ShortText.State;
  contactName: ShortText.State;
  numberOfEmployees: Select.State;
  indigenousOwnership: Select.State;
  headOfficeLocation: Select.State;
}

type FormFieldKeys
  = 'businessName'
  | 'businessCity'
  | 'contactName'
  | 'numberOfEmployees'
  | 'indigenousOwnership'
  | 'headOfficeLocation';

export type InnerMsg
  = ADT<'onChangeBusinessName', string>
  | ADT<'onChangeBusinessCity', string>
  | ADT<'onChangeContactName', string>
  | ADT<'onChangeNumberOfEmployees', Select.Value>
  | ADT<'onChangeIndigenousOwnership', Select.Value>
  | ADT<'onChangeHeadOfficeLocation', Select.Value>
  | ADT<'validateBusinessName'>
  | ADT<'validateBusinessCity'>
  | ADT<'validateContactName'>
  | ADT<'validateNumberOfEmployees'>
  | ADT<'validateIndigenousOwnership'>
  | ADT<'validateHeadOfficeLocation'>;

export type Msg = StepMsg<InnerMsg>;

export type Params = null;

const init: Init<Params, State> = async () => {
  return {
    businessName: ShortText.init({
      id: 'vendor-profile-business-name',
      type: 'text',
      required: true,
      label: 'Business Name',
      placeholder: 'Business Name'
    }),
    businessCity: ShortText.init({
      id: 'vendor-profile-business-city',
      type: 'text',
      required: false,
      label: 'City',
      placeholder: 'City'
    }),
    contactName: ShortText.init({
      id: 'vendor-profile-contact-name',
      type: 'text',
      required: true,
      label: 'Contact Name',
      placeholder: 'Contact Name'
    }),
    numberOfEmployees: Select.init({
      id: 'vendor-profile-number-of-employees',
      required: true,
      label: 'Number of Employees',
      placeholder: 'Select Number of Employees',
      options: AVAILABLE_NUMBER_OF_EMPLOYEES.toJS().map(value => ({ label: value, value }))
    }),
    indigenousOwnership: Select.init({
      id: 'vendor-profile-indigenous-ownership',
      required: true,
      label: 'Indigenous Ownership',
      placeholder: 'Select Indigenous Ownership',
      options: AVAILABLE_INDIGENOUS_OWNERSHIP.toJS().map(value => ({ label: value, value }))
    }),
    headOfficeLocation: Select.init({
      id: 'vendor-profile-head-office-location',
      required: true,
      label: 'Head Office Location',
      placeholder: 'Select Head Office Location',
      options: AVAILABLE_HEAD_OFFICE_LOCATIONS.toJS().map(value => ({ label: value, value }))
    })
  };
};

const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'onChangeBusinessName':
      return [updateValue(state, 'businessName', msg.value)];
    case 'onChangeBusinessCity':
      return [updateValue(state, 'businessCity', msg.value)];
    case 'onChangeContactName':
      return [updateValue(state, 'contactName', msg.value)];
    case 'onChangeNumberOfEmployees':
      return [validateValue(updateValue(state, 'numberOfEmployees', msg.value), 'numberOfEmployees', validateOption(validateNumberOfEmployees))];
    case 'onChangeIndigenousOwnership':
      return [validateValue(updateValue(state, 'indigenousOwnership', msg.value), 'indigenousOwnership', validateOption(validateIndigenousOwnership))];
    case 'onChangeHeadOfficeLocation':
      state = updateValue(state, 'headOfficeLocation', msg.value);
      state = validateValue(state, 'headOfficeLocation', validateOption(validateHeadOfficeLocation));
      state = state.setIn(['businessCity', 'required'], businessCityIsRequired(get(msg.value, 'value', '')));
      state = validateValue(state, 'businessCity', makeValidateBusinessCity(state));
      return [state];
    case 'validateBusinessName':
      return [validateValue(state, 'businessName', validateBusinessName)];
    case 'validateBusinessCity':
      return [validateValue(state, 'businessCity', makeValidateBusinessCity(state))];
    case 'validateContactName':
      return [validateValue(state, 'contactName', validateContactName)];
    default:
      return [state];
  }
};

function makeValidateBusinessCity(state: Immutable<State>): (raw: string) => Validation<string> {
  return v => mapValid(validateBusinessCity(v, get(state.headOfficeLocation.value, 'value', '')), w => w || '');
}

function validateOption(validate: (_: string) => Validation<unknown>): (option: Select.Value) => Validation<Select.Value> {
  return option => {
    const raw = option ? option.value : '';
    return mapValid(validate(raw), () => option);
  };
}

function updateValue<K extends FormFieldKeys>(state: Immutable<State>, key: K, value: State[K]['value']): Immutable<State> {
  return state.setIn([key, 'value'], value);
}

function validateValue<K extends FormFieldKeys>(state: Immutable<State>, key: K, validate: (value: State[K]['value']) => Validation<State[K]['value']>): Immutable<State> {
  const validation = validate(state.getIn([key, 'value']));
  return state.setIn([key, 'errors'], getInvalidValue(validation, []));
}

const isValid: IsValid<State> = (state) => {
  return !!(
    !state.businessName.errors.length &&
    !state.businessCity.errors.length &&
    !state.contactName.errors.length &&
    !state.numberOfEmployees.errors.length &&
    !state.indigenousOwnership.errors.length &&
    !state.headOfficeLocation.errors.length &&
    state.businessName.value &&
    state.contactName.value &&
    state.numberOfEmployees.value &&
    state.indigenousOwnership.value &&
    state.headOfficeLocation.value
  );
};

const isLoading: IsLoading<State> = (state) => false;

const view: ComponentView<State, Msg> = makeView({
  title: 'Business Information',
  stepIndicator: 'Step 3 of 4',
  view({ state, dispatch }) {
    const onChangeShortText = (tag: any) => ShortText.makeOnChange(dispatch, value => ({ tag, value }));
    const onChangeDebounced = (tag: any) => () => dispatch({ tag, value: undefined });
    const onChangeSelect = (tag: any) => Select.makeOnChange(dispatch, value => ({ tag, value }));
    return (
      <div>
        <Row>
          <Col xs='12' md='7'>
            <ShortText.view
              state={state.businessName}
              onChangeDebounced={onChangeDebounced('validateBusinessName')}
              onChange={onChangeShortText('onChangeBusinessName')}
              autoFocus />
          </Col>
        </Row>
        <Row>
          <Col xs='12' md='7'>
            <ShortText.view
              state={state.contactName}
              onChangeDebounced={onChangeDebounced('validateContactName')}
              onChange={onChangeShortText('onChangeContactName')} />
          </Col>
        </Row>
        <Row>
          <Col xs='12' md='5' lg='4'>
            <Select.view
              state={state.numberOfEmployees}
              onChange={onChangeSelect('onChangeNumberOfEmployees')} />
          </Col>
        </Row>
        <Row>
          <Col xs='12' md='5' lg='4'>
            <Select.view
              state={state.indigenousOwnership}
              onChange={onChangeSelect('onChangeIndigenousOwnership')} />
          </Col>
        </Row>
        <Row>
          <Col xs='12' md='5' lg='4'>
            <Select.view
              state={state.headOfficeLocation}
              onChange={onChangeSelect('onChangeHeadOfficeLocation')} />
          </Col>
          <Col xs='12' md='4' lg='3'>
            <ShortText.view
              state={state.businessCity}
              onChangeDebounced={onChangeDebounced('validateBusinessCity')}
              onChange={onChangeShortText('onChangeBusinessCity')} />
          </Col>
        </Row>
      </div>
    );
  }
});

export const component: StepComponent<Params, State, InnerMsg> = {
  init,
  update,
  view,
  isValid,
  isLoading,
  actionLabels: {
    next: 'Next',
    cancel: 'Cancel',
    back: 'Go Back'
  }
};

export default component;

export function setErrors(state: Immutable<State>, errors: CreateValidationErrors): Immutable<State> {
  return state
    .setIn(['businessName', 'errors'], get(errors.profile, 'businessName', []))
    .setIn(['businessCity', 'errors'], get(errors.profile, 'businessCity', []))
    .setIn(['contactName', 'errors'], get(errors.profile, 'contactName', []))
    .setIn(['numberOfEmployees', 'errors'], get(errors.profile, 'numberOfEmployees', []))
    .setIn(['indigenousOwnership', 'errors'], get(errors.profile, 'indigenousOwnership', []))
    .setIn(['headOfficeLocation', 'errors'], get(errors.profile, 'headOfficeLocation', []));
}
