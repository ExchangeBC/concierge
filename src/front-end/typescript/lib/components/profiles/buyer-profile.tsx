import { Page } from 'front-end/lib/app/types';
import * as SelectMulti from 'front-end/lib/components/input/select-multi';
import { ProfileComponent, ProfileParams, ProfileView } from 'front-end/lib/components/profiles/types';
import { ComponentMsg, Dispatch, immutable, Immutable, Init, mapComponentDispatch, Update, updateComponentChild } from 'front-end/lib/framework';
import FormSectionHeading from 'front-end/lib/views/form-section-heading';
import * as Select from 'front-end/lib/views/input/select';
import * as ShortText from 'front-end/lib/views/input/short-text';
import { reduce } from 'lodash';
import { default as React } from 'react';
import { Col, Row } from 'reactstrap';
import AVAILABLE_CATEGORIES from 'shared/data/categories';
import AVAILABLE_INDUSTRY_SECTORS from 'shared/data/industry-sectors';
import { ADT, UserType } from 'shared/lib/types';
import { BuyerProfile, parsePhoneType, PhoneType, userTypeToTitleCase } from 'shared/lib/types';
import { ValidOrInvalid } from 'shared/lib/validators';
import { BuyerProfileValidationErrors, validateBuyerProfile } from 'shared/lib/validators/buyer-profile';

export type ValidationErrors = BuyerProfileValidationErrors;

export interface State {
  validationErrors: ValidationErrors;
  firstName: ShortText.State;
  lastName: ShortText.State;
  positionTitle: ShortText.State;
  publicSectorEntity: ShortText.State;
  branch: ShortText.State;
  contactStreetAddress: ShortText.State;
  contactCity: ShortText.State;
  contactProvince: ShortText.State;
  contactPostalCode: ShortText.State;
  contactCountry: ShortText.State;
  contactPhoneNumber: ShortText.State;
  contactPhoneCountryCode: ShortText.State;
  contactPhoneType: Select.State;
  industrySectors: Immutable<SelectMulti.State>;
  categories: Immutable<SelectMulti.State>;
}

export function getValues(state: Immutable<State>): BuyerProfile {
  return {
    type: UserType.Buyer as UserType.Buyer,
    firstName: state.firstName.value,
    lastName: state.lastName.value,
    positionTitle: state.positionTitle.value,
    publicSectorEntity: state.publicSectorEntity.value,
    branch: state.branch.value || undefined,
    contactStreetAddress: state.contactStreetAddress.value || undefined,
    contactCity: state.contactCity.value || undefined,
    contactProvince: state.contactProvince.value || undefined,
    contactPostalCode: state.contactPostalCode.value || undefined,
    contactCountry: state.contactCountry.value || undefined,
    contactPhoneNumber: state.contactPhoneNumber.value || undefined,
    contactPhoneCountryCode: state.contactPhoneCountryCode.value || undefined,
    contactPhoneType: parsePhoneType(state.contactPhoneType.value) || undefined,
    industrySectors: SelectMulti.getValues(state.industrySectors),
    categories: SelectMulti.getValues(state.categories)
  };
}

export function setValues(state: Immutable<State>, profile: BuyerProfile): Immutable<State> {
  return state
    .setIn(['firstName', 'value'], profile.firstName || '')
    .setIn(['lastName', 'value'], profile.lastName || '')
    .setIn(['positionTitle', 'value'], profile.positionTitle || '')
    .setIn(['publicSectorEntity', 'value'], profile.publicSectorEntity || '')
    .setIn(['branch', 'value'], profile.branch || '')
    .setIn(['contactStreetAddress', 'value'], profile.contactStreetAddress || '')
    .setIn(['contactCity', 'value'], profile.contactCity || '')
    .setIn(['contactProvince', 'value'], profile.contactProvince || '')
    .setIn(['contactPostalCode', 'value'], profile.contactPostalCode || '')
    .setIn(['contactCountry', 'value'], profile.contactCountry || '')
    .setIn(['contactPhoneNumber', 'value'], profile.contactPhoneNumber || '')
    .setIn(['contactPhoneCountryCode', 'value'], profile.contactPhoneCountryCode || '')
    .setIn(['contactPhoneType', 'value'], profile.contactPhoneType || '')
    .set('industrySectors', SelectMulti.setValues(state.industrySectors, profile.industrySectors || []))
    .set('categories', SelectMulti.setValues(state.categories, profile.categories || []));
}

export function setErrors(state: Immutable<State>, errors: ValidationErrors): Immutable<State> {
  return state
    .set('validationErrors', errors)
    // Don't show validation errors for empty required fields.
    .setIn(['firstName', 'errors'], state.firstName.value ? errors.firstName || [] : [])
    // All other fields are optional.
    .setIn(['lastName', 'errors'], state.lastName.value ? errors.lastName || [] : [])
    .setIn(['positionTitle', 'errors'], state.positionTitle.value ? errors.positionTitle || [] : [])
    .setIn(['publicSectorEntity', 'errors'], state.publicSectorEntity.value ? errors.publicSectorEntity || [] : [])
    .setIn(['branch', 'errors'], errors.branch || [])
    .setIn(['contactStreetAddress', 'errors'], errors.contactStreetAddress || [])
    .setIn(['contactCity', 'errors'], errors.contactCity || [])
    .setIn(['contactProvince', 'errors'], errors.contactProvince || [])
    .setIn(['contactPostalCode', 'errors'], errors.contactPostalCode || [])
    .setIn(['contactCountry', 'errors'], errors.contactCountry || [])
    .setIn(['contactPhoneNumber', 'errors'], errors.contactPhoneNumber || [])
    .setIn(['contactPhoneCountryCode', 'errors'], errors.contactPhoneCountryCode || [])
    .setIn(['contactPhoneType', 'errors'], errors.contactPhoneType || [])
    .set('industrySectors', SelectMulti.setErrors(state.industrySectors, errors.industrySectors || []))
    .set('categories', SelectMulti.setErrors(state.categories, errors.categories || []));
}

export function isValid(state: Immutable<State>): boolean {
  const providedRequiredFields = !!(state.firstName.value && state.lastName.value && state.positionTitle.value && state.publicSectorEntity.value);
  const noValidationErrors = reduce(state.validationErrors, (acc: boolean, v: string[] | string[][] | undefined, k: string) => {
    return acc && (!v || !v.length);
  }, true);
  return providedRequiredFields && noValidationErrors;
}

export type InnerMsg
  = ADT<'firstName', string>
  | ADT<'lastName', string>
  | ADT<'positionTitle', string>
  | ADT<'publicSectorEntity', string>
  | ADT<'branch', string>
  | ADT<'contactStreetAddress', string>
  | ADT<'contactCity', string>
  | ADT<'contactProvince', string>
  | ADT<'contactPostalCode', string>
  | ADT<'contactCountry', string>
  | ADT<'contactPhoneNumber', string>
  | ADT<'contactPhoneCountryCode', string>
  | ADT<'contactPhoneType', string>
  | ADT<'industrySectors', SelectMulti.Msg>
  | ADT<'categories', SelectMulti.Msg>
  | ADT<'validate'>;

export type Msg = ComponentMsg<InnerMsg, Page>;

export type Params = ProfileParams<BuyerProfile>;

export const init: Init<Params, State> = async ({ profile }) => {
  const state = {
    validationErrors: {},
    firstName: ShortText.init({
      id: 'buyer-profile-first-name',
      type: 'text',
      required: true,
      label: 'First Name',
      placeholder: 'First Name'
    }),
    lastName: ShortText.init({
      id: 'buyer-profile-last-name',
      type: 'text',
      required: true,
      label: 'Last Name',
      placeholder: 'Last Name'
    }),
    positionTitle: ShortText.init({
      id: 'buyer-profile-position-title',
      type: 'text',
      required: true,
      label: 'Position Title',
      placeholder: 'Position Title'
    }),
    publicSectorEntity: ShortText.init({
      id: 'buyer-profile-public-sector-entity',
      type: 'text',
      required: true,
      label: 'Public Sector Entity',
      placeholder: 'Public Sector Entity'
    }),
    branch: ShortText.init({
      id: 'buyer-profile-branch',
      type: 'text',
      required: false,
      label: 'Branch',
      placeholder: 'Branch'
    }),
    contactStreetAddress: ShortText.init({
      id: 'buyer-profile-contact-street-address',
      type: 'text',
      required: false,
      label: 'Street Address',
      placeholder: 'Street Address'
    }),
    contactCity: ShortText.init({
      id: 'buyer-profile-contact-city',
      type: 'email',
      required: false,
      label: 'City',
      placeholder: 'City'
    }),
    contactProvince: ShortText.init({
      id: 'buyer-profile-contact-province',
      type: 'email',
      required: false,
      label: 'Province/State',
      placeholder: 'Province/State'
    }),
    contactPostalCode: ShortText.init({
      id: 'buyer-profile-contact-postal-code',
      type: 'text',
      required: false,
      label: 'Postal/Zip Code',
      placeholder: 'Postal/Zip Code'
    }),
    contactCountry: ShortText.init({
      id: 'buyer-profile-contact-country',
      type: 'text',
      required: false,
      label: 'Country',
      placeholder: 'Country'
    }),
    contactPhoneNumber: ShortText.init({
      id: 'buyer-profile-contact-phone-number',
      type: 'text',
      required: false,
      label: 'Phone Number',
      placeholder: 'e.g. 888-888-8888'
    }),
    contactPhoneCountryCode: ShortText.init({
      id: 'buyer-profile-contact-phone-country-code',
      type: 'text',
      required: false,
      label: 'Country Code',
      placeholder: 'e.g. 1'
    }),
    contactPhoneType: Select.init({
      id: 'buyer-profile-contact-phone-type',
      value: '',
      required: false,
      label: 'Phone Type',
      unselectedLabel: 'Select Type',
      options: [
        { value: PhoneType.Office, label: 'Office' },
        { value: PhoneType.CellPhone, label: 'Cell Phone' }
      ]
    }),
    industrySectors: immutable(await SelectMulti.init({
      options: AVAILABLE_INDUSTRY_SECTORS.toJS().map(value => ({ label: value, value })),
      unselectedLabel: 'Select Industry Sector',
      formFieldMulti: {
        idNamespace: 'buyer-industry-sectors',
        label: 'Industry Sector(s)',
        labelClassName: 'h3 mb-3',
        fields: []
      }
    })),
    categories: immutable(await SelectMulti.init({
      options: AVAILABLE_CATEGORIES.toJS().map(value => ({ label: value, value })),
      unselectedLabel: 'Select an Area of Interest',
      formFieldMulti: {
        idNamespace: 'buyer-categories',
        label: 'Area(s) of Interest',
        labelClassName: 'h3 mb-3',
        fields: []
      }
    }))
  };
  if (!profile) {
    return state;
  } else {
    return setValues(immutable(state), profile).toJSON();
  }
};

export const update: Update<State, Msg> = (state, msg) => {
  switch (msg.tag) {
    case 'firstName':
      return [updateValue(state, 'firstName', msg.value)];
    case 'lastName':
      return [updateValue(state, 'lastName', msg.value)];
    case 'positionTitle':
      return [updateValue(state, 'positionTitle', msg.value)];
    case 'publicSectorEntity':
      return [updateValue(state, 'publicSectorEntity', msg.value)];
    case 'branch':
      return [updateValue(state, 'branch', msg.value)];
    case 'contactStreetAddress':
      return [updateValue(state, 'contactStreetAddress', msg.value)];
    case 'contactCity':
      return [updateValue(state, 'contactCity', msg.value)];
    case 'contactProvince':
      return [updateValue(state, 'contactProvince', msg.value)];
    case 'contactPostalCode':
      return [updateValue(state, 'contactPostalCode', msg.value)];
    case 'contactCountry':
      return [updateValue(state, 'contactCountry', msg.value)];
    case 'contactPhoneNumber':
      return [updateValue(state, 'contactPhoneNumber', msg.value)];
    case 'contactPhoneCountryCode':
      return [updateValue(state, 'contactPhoneCountryCode', msg.value)];
    case 'contactPhoneType':
      return [validateValues(updateValue(state, 'contactPhoneType', msg.value))];
    case 'industrySectors':
      state = updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'industrySectors', value }),
        childStatePath: ['industrySectors'],
        childUpdate: SelectMulti.update,
        childMsg: msg.value
      })[0];
      return [validateValues(state)];
    case 'categories':
      state = updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'categories', value }),
        childStatePath: ['categories'],
        childUpdate: SelectMulti.update,
        childMsg: msg.value
      })[0];
      return [validateValues(state)];
    case 'validate':
      return [validateValues(state)];
    default:
      return [state];
  }
};

function updateValue(state: Immutable<State>, key: string, value: string): Immutable<State> {
  return state.setIn([key, 'value'], value);
}

function validateValues(state: Immutable<State>): Immutable<State> {
  const validation = validateBuyerProfile(getValues(state));
  return persistValidations(state, validation);
}

function persistValidations(state: Immutable<State>, validation: ValidOrInvalid<BuyerProfile, ValidationErrors>): Immutable<State> {
  switch (validation.tag) {
    case 'valid':
      // We don't set values here because it may be causing mobile browsers to be janky.
      // state = setValues(state, validation.value);
      return setErrors(state, {});
    case 'invalid':
      return setErrors(state, validation.value);
  }
}

export const BuyerInformation: ProfileView<State, InnerMsg> = ({ state, dispatch, disabled = false }) => {
  const onChangeShortText = (tag: any) => ShortText.makeOnChange(dispatch, e => ({ tag, value: e.currentTarget.value }));
  const validate = () => dispatch({ tag: 'validate', value: undefined });
  return (
    <div className='mt-3 mt-md-0'>
      <FormSectionHeading text={`${userTypeToTitleCase(UserType.Buyer)} Information`} />
      <Row>
        <Col xs='12' md='5'>
          <ShortText.view
            state={state.firstName}
            disabled={disabled}
            onChangeDebounced={validate}
            onChange={onChangeShortText('firstName')} />
        </Col>
        <Col xs='12' md='5'>
          <ShortText.view
            state={state.lastName}
            disabled={disabled}
            onChangeDebounced={validate}
            onChange={onChangeShortText('lastName')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='7'>
          <ShortText.view
            state={state.positionTitle}
            disabled={disabled}
            onChangeDebounced={validate}
            onChange={onChangeShortText('positionTitle')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='7'>
          <ShortText.view
            state={state.publicSectorEntity}
            disabled={disabled}
            onChangeDebounced={validate}
            onChange={onChangeShortText('publicSectorEntity')} />
        </Col>
        <Col xs='12' md='5'>
          <ShortText.view
            state={state.branch}
            disabled={disabled}
            onChangeDebounced={validate}
            onChange={onChangeShortText('branch')} />
        </Col>
      </Row>
    </div>
  );
};

export const ContactInformation: ProfileView<State, InnerMsg> = ({ state, dispatch, disabled = false }) => {
  const onChangeShortText = (tag: any) => ShortText.makeOnChange(dispatch, e => ({ tag, value: e.currentTarget.value }));
  const onChangeSelect = (tag: any) => Select.makeOnChange(dispatch, e => ({ tag, value: e.currentTarget.value }));
  const validate = () => dispatch({ tag: 'validate', value: undefined });
  return (
    <div className='mt-3'>
      <FormSectionHeading text='Contact Information (Optional)' />
      <Row>
        <Col xs='12'>
          <ShortText.view
            state={state.contactStreetAddress}
            disabled={disabled}
            onChangeDebounced={validate}
            onChange={onChangeShortText('contactStreetAddress')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='7'>
          <ShortText.view
            state={state.contactCity}
            disabled={disabled}
            onChangeDebounced={validate}
            onChange={onChangeShortText('contactCity')} />
        </Col>
        <Col xs='12' md='5'>
          <ShortText.view
            state={state.contactProvince}
            disabled={disabled}
            onChangeDebounced={validate}
            onChange={onChangeShortText('contactProvince')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='4'>
          <ShortText.view
            state={state.contactPostalCode}
            disabled={disabled}
            onChangeDebounced={validate}
            onChange={onChangeShortText('contactPostalCode')} />
        </Col>
        <Col xs='12' md='6'>
          <ShortText.view
            state={state.contactCountry}
            disabled={disabled}
            onChangeDebounced={validate}
            onChange={onChangeShortText('contactCountry')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='4'>
          <ShortText.view
            state={state.contactPhoneNumber}
            disabled={disabled}
            onChangeDebounced={validate}
            onChange={onChangeShortText('contactPhoneNumber')} />
        </Col>
        <Col xs='12' md='4'>
          <ShortText.view
            state={state.contactPhoneCountryCode}
            disabled={disabled}
            onChangeDebounced={validate}
            onChange={onChangeShortText('contactPhoneCountryCode')} />
        </Col>
        <Col xs='12' md='4'>
          <Select.view
            state={state.contactPhoneType}
            disabled={disabled}
            onChange={onChangeSelect('contactPhoneType')} />
        </Col>
      </Row>
    </div>
  );
};

export const IndustrySectors: ProfileView<State, InnerMsg> = ({ state, dispatch, disabled = false }) => {
  const dispatchIndustrySectors: Dispatch<SelectMulti.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'industrySectors' as 'industrySectors', value }));
  return (
    <Row className='mt-3'>
      <Col xs='12' lg='10'>
        <SelectMulti.view state={state.industrySectors} dispatch={dispatchIndustrySectors} disabled={disabled} />
      </Col>
    </Row>
  );
};

export const Categories: ProfileView<State, InnerMsg> = ({ state, dispatch, disabled = false }) => {
  const dispatchCategories: Dispatch<SelectMulti.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'categories' as 'categories', value }));
  return (
    <Row className='mt-3'>
      <Col xs='12' lg='10'>
        <SelectMulti.view state={state.categories} dispatch={dispatchCategories} disabled={disabled} />
      </Col>
    </Row>
  );
};

export const view: ProfileView<State, InnerMsg> = props => {
  return (
    <div>
      <BuyerInformation {...props} />
      <ContactInformation {...props} />
      <IndustrySectors {...props} />
      <Categories {...props} />
    </div>
  );
};

export const component: ProfileComponent<State, InnerMsg, BuyerProfile> = {
  init,
  update,
  view,
  getValues,
  setValues,
  setErrors,
  isValid,
  userType: UserType.Buyer
};
