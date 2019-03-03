import { Page } from 'front-end/lib/app/types';
import * as SelectMulti from 'front-end/lib/components/input/select-multi';
import { ProfileComponent, ProfileInitParams } from 'front-end/lib/components/profiles/types';
import { ComponentMsg, ComponentView, Dispatch, immutable, Immutable, Init, mapComponentDispatch, Update, updateComponentChild } from 'front-end/lib/framework';
import FormSectionHeading from 'front-end/lib/views/form-section-heading';
import * as Select from 'front-end/lib/views/input/select';
import * as ShortText from 'front-end/lib/views/input/short-text';
import { reduce } from 'lodash';
import { default as React } from 'react';
import { Col, Row } from 'reactstrap';
import AVAILABLE_CATEGORIES from 'shared/data/categories';
import AVAILABLE_INDUSTRY_SECTORS from 'shared/data/industry-sectors';
import { ADT, UserType } from 'shared/lib/types';
import { BuyerProfile, parsePhoneType, PhoneType } from 'shared/lib/types';
import { ValidOrInvalid } from 'shared/lib/validators';
import { BuyerProfileValidationErrors, validateBuyerProfile } from 'shared/lib/validators/buyer-profile';

export type ValidationErrors = BuyerProfileValidationErrors;

export interface State {
  disabled: boolean;
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
  areasOfInterest: Immutable<SelectMulti.State>;
}

export function getName(state: Immutable<State>): string | null {
  const firstName = state.firstName.value;
  const lastName = state.lastName.value;
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  } else if (firstName) {
    return firstName;
  } else {
    return null;
  }
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
    areasOfInterest: SelectMulti.getValues(state.areasOfInterest)
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
    .set('areasOfInterest', SelectMulti.setValues(state.areasOfInterest, profile.areasOfInterest || []));
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
    .set('areasOfInterest', SelectMulti.setErrors(state.areasOfInterest, errors.areasOfInterest || []));
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
  | ADT<'areasOfInterest', SelectMulti.Msg>;

export type Msg = ComponentMsg<InnerMsg, Page>;

export type Params = ProfileInitParams<BuyerProfile>;

export const init: Init<Params, State> = async ({ profile, disabled = false }) => {
  const state = {
    disabled,
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
      label: 'Province',
      placeholder: 'Province'
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
        disabled,
        fields: []
      }
    })),
    areasOfInterest: immutable(await SelectMulti.init({
      options: AVAILABLE_CATEGORIES.toJS().map(value => ({ label: value, value })),
      unselectedLabel: 'Select Area of Interest',
      formFieldMulti: {
        idNamespace: 'buyer-areas-of-interest',
        label: 'Area(s) of Interest',
        labelClassName: 'h3 mb-3',
        disabled,
        fields: []
      }
    }))
  };
  if (!profile) {
    return state;
  } else {
    return setValues(immutable(state), profile).toJS();
  }
};

export const update: Update<State, Msg> = (state, msg) => {
  switch (msg.tag) {
    case 'firstName':
      return [validateAndUpdate(state, 'firstName', msg.value)];
    case 'lastName':
      return [validateAndUpdate(state, 'lastName', msg.value)];
    case 'positionTitle':
      return [validateAndUpdate(state, 'positionTitle', msg.value)];
    case 'publicSectorEntity':
      return [validateAndUpdate(state, 'publicSectorEntity', msg.value)];
    case 'branch':
      return [validateAndUpdate(state, 'branch', msg.value)];
    case 'contactStreetAddress':
      return [validateAndUpdate(state, 'contactStreetAddress', msg.value)];
    case 'contactCity':
      return [validateAndUpdate(state, 'contactCity', msg.value)];
    case 'contactProvince':
      return [validateAndUpdate(state, 'contactProvince', msg.value)];
    case 'contactPostalCode':
      return [validateAndUpdate(state, 'contactPostalCode', msg.value)];
    case 'contactCountry':
      return [validateAndUpdate(state, 'contactCountry', msg.value)];
    case 'contactPhoneNumber':
      return [validateAndUpdate(state, 'contactPhoneNumber', msg.value)];
    case 'contactPhoneCountryCode':
      return [validateAndUpdate(state, 'contactPhoneCountryCode', msg.value)];
    case 'contactPhoneType':
      return [validateAndUpdate(state, 'contactPhoneType', msg.value)];
    case 'industrySectors':
      state = updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'industrySectors', value }),
        childStatePath: ['industrySectors'],
        childUpdate: SelectMulti.update,
        childMsg: msg.value
      })[0];
      return [validateAndUpdate(state)];
    case 'areasOfInterest':
      state = updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'areasOfInterest', value }),
        childStatePath: ['areasOfInterest'],
        childUpdate: SelectMulti.update,
        childMsg: msg.value
      })[0];
      return [validateAndUpdate(state)];
    default:
      return [state];
  }
};

function validateAndUpdate(state: Immutable<State>, key?: string, value?: string): Immutable<State> {
  if (key && value !== undefined) {
    state = state.setIn([key, 'value'], value);
  }
  const validation = validateBuyerProfile(getValues(state));
  return persistValidations(state, validation);
}

function persistValidations(state: Immutable<State>, validation: ValidOrInvalid<BuyerProfile, ValidationErrors>): Immutable<State> {
  switch (validation.tag) {
    case 'valid':
      state = setValues(state, validation.value);
      return setErrors(state, {});
    case 'invalid':
      return setErrors(state, validation.value);
  }
}

export const PersonalInformation: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const onChangeShortText = (tag: any) => ShortText.makeOnChange(dispatch, e => ({ tag, value: e.currentTarget.value }));
  return (
    <div className='mt-3 mt-md-0'>
      <FormSectionHeading text='Personal Information' />
      <Row>
        <Col xs='12' md='5'>
          <ShortText.view
            state={state.firstName}
            disabled={state.disabled}
            onChange={onChangeShortText('firstName')} />
        </Col>
        <Col xs='12' md='5'>
          <ShortText.view
            state={state.lastName}
            disabled={state.disabled}
            onChange={onChangeShortText('lastName')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='7'>
          <ShortText.view
            state={state.positionTitle}
            disabled={state.disabled}
            onChange={onChangeShortText('positionTitle')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='7'>
          <ShortText.view
            state={state.publicSectorEntity}
            disabled={state.disabled}
            onChange={onChangeShortText('publicSectorEntity')} />
        </Col>
        <Col xs='12' md='5'>
          <ShortText.view
            state={state.branch}
            disabled={state.disabled}
            onChange={onChangeShortText('branch')} />
        </Col>
      </Row>
    </div>
  );
};

export const ContactInformation: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const onChangeShortText = (tag: any) => ShortText.makeOnChange(dispatch, e => ({ tag, value: e.currentTarget.value }));
  const onChangeSelect = (tag: any) => Select.makeOnChange(dispatch, e => ({ tag, value: e.currentTarget.value }));
  return (
    <div className='mt-3'>
      <FormSectionHeading text='Contact Information (Optional)' />
      <Row>
        <Col xs='12'>
          <ShortText.view
            state={state.contactStreetAddress}
            disabled={state.disabled}
            onChange={onChangeShortText('contactStreetAddress')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='7'>
          <ShortText.view
            state={state.contactCity}
            disabled={state.disabled}
            onChange={onChangeShortText('contactCity')} />
        </Col>
        <Col xs='12' md='5'>
          <ShortText.view
            state={state.contactProvince}
            disabled={state.disabled}
            onChange={onChangeShortText('contactProvince')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='4'>
          <ShortText.view
            state={state.contactPostalCode}
            disabled={state.disabled}
            onChange={onChangeShortText('contactPostalCode')} />
        </Col>
        <Col xs='12' md='6'>
          <ShortText.view
            state={state.contactCountry}
            disabled={state.disabled}
            onChange={onChangeShortText('contactCountry')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='4'>
          <ShortText.view
            state={state.contactPhoneNumber}
            disabled={state.disabled}
            onChange={onChangeShortText('contactPhoneNumber')} />
        </Col>
        <Col xs='12' md='4'>
          <ShortText.view
            state={state.contactPhoneCountryCode}
            disabled={state.disabled}
            onChange={onChangeShortText('contactPhoneCountryCode')} />
        </Col>
        <Col xs='12' md='4'>
          <Select.view
            state={state.contactPhoneType}
            disabled={state.disabled}
            onChange={onChangeSelect('contactPhoneType')} />
        </Col>
      </Row>
    </div>
  );
};

export const IndustrySectors: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const dispatchIndustrySectors: Dispatch<SelectMulti.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'industrySectors' as 'industrySectors', value }));
  return (
    <Row className='mt-3'>
      <Col xs='12' lg='10' xl='8'>
        <SelectMulti.view state={state.industrySectors} dispatch={dispatchIndustrySectors} />
      </Col>
    </Row>
  );
};

export const AreasOfInterest: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const dispatchAreasOfInterest: Dispatch<SelectMulti.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'areasOfInterest' as 'areasOfInterest', value }));
  return (
    <Row className='mt-3'>
      <Col xs='12' lg='10' xl='8'>
        <SelectMulti.view state={state.areasOfInterest} dispatch={dispatchAreasOfInterest} />
      </Col>
    </Row>
  );
};

export const view: ComponentView<State, Msg> = props => {
  return (
    <div>
      <PersonalInformation {...props} />
      <ContactInformation {...props} />
      <IndustrySectors {...props} />
      <AreasOfInterest {...props} />
    </div>
  );
};

export const component: ProfileComponent<State, InnerMsg, BuyerProfile> = {
  init,
  update,
  view,
  getName,
  getValues,
  setValues,
  setErrors,
  isValid,
  userType: UserType.Buyer
};
