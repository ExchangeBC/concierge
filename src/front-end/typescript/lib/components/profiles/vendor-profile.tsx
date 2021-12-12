import * as SelectMulti from 'front-end/lib/components/form-field-multi/select';
import { ProfileComponent, ProfileParams, ProfileView } from 'front-end/lib/components/profiles/types';
import { Dispatch, immutable, Immutable, Init, mapComponentDispatch, Update, updateComponentChild } from 'front-end/lib/framework';
import * as Select from 'front-end/lib/views/form-field/select';
import * as ShortText from 'front-end/lib/views/form-field/short-text';
import FormSectionHeading from 'front-end/lib/views/form-section-heading';
import { get, reduce } from 'lodash';
import { default as React } from 'react';
import { Col, Row } from 'reactstrap';
import AVAILABLE_CATEGORIES from 'shared/data/categories';
import AVAILABLE_HEAD_OFFICE_LOCATIONS from 'shared/data/head-office-locations';
import AVAILABLE_INDIGENOUS_OWNERSHIP from 'shared/data/indigenous-ownership';
import AVAILABLE_INDUSTRY_SECTORS from 'shared/data/industry-sectors';
import AVAILABLE_NUMBER_OF_EMPLOYEES from 'shared/data/number-of-employees';
import AVAILABLE_SIGN_UP_REASONS from 'shared/data/sign-up-reasons';
import { ADT, UserType } from 'shared/lib/types';
import { BusinessType, parseBusinessType, parsePhoneType, PhoneType, VendorProfile } from 'shared/lib/types';
import { ValidOrInvalid } from 'shared/lib/validators';
import { validateVendorProfile, VendorProfileValidationErrors } from 'shared/lib/validators/vendor-profile';
import { businessCityIsRequired } from 'shared/lib/validators/vendor-profile';

export type ValidationErrors = VendorProfileValidationErrors;

export interface State {
  validationErrors: ValidationErrors;
  businessName: ShortText.State;
  businessType: Select.State;
  businessNumber: ShortText.State;
  businessStreetAddress: ShortText.State;
  businessCity: ShortText.State;
  businessProvince: ShortText.State;
  businessPostalCode: ShortText.State;
  businessCountry: ShortText.State;
  contactName: ShortText.State;
  contactPositionTitle: ShortText.State;
  contactEmail: ShortText.State;
  contactPhoneNumber: ShortText.State;
  contactPhoneCountryCode: ShortText.State;
  contactPhoneType: Select.State;
  industrySectors: Immutable<SelectMulti.State>;
  categories: Immutable<SelectMulti.State>;
  numberOfEmployees: Select.State;
  indigenousOwnership: Select.State;
  headOfficeLocation: Select.State;
  signUpReason: Select.State;
}

type FormFieldKeys = 'businessName' | 'businessType' | 'businessNumber' | 'businessStreetAddress' | 'businessCity' | 'businessProvince' | 'businessPostalCode' | 'businessCountry' | 'contactName' | 'contactPositionTitle' | 'contactEmail' | 'contactPhoneNumber' | 'contactPhoneCountryCode' | 'contactPhoneType' | 'numberOfEmployees' | 'indigenousOwnership' | 'headOfficeLocation' | 'signUpReason';

export function getValues(state: Immutable<State>): VendorProfile {
  return {
    type: UserType.Vendor as UserType.Vendor,
    businessName: state.businessName.value,
    businessType: (state.businessType.value && parseBusinessType(state.businessType.value.value)) || undefined,
    businessNumber: state.businessNumber.value || undefined,
    businessStreetAddress: state.businessStreetAddress.value || undefined,
    businessCity: state.businessCity.value || undefined,
    businessProvince: state.businessProvince.value || undefined,
    businessPostalCode: state.businessPostalCode.value || undefined,
    businessCountry: state.businessCountry.value || undefined,
    contactName: state.contactName.value || '',
    contactPositionTitle: state.contactPositionTitle.value || undefined,
    contactEmail: state.contactEmail.value || undefined,
    contactPhoneNumber: state.contactPhoneNumber.value || undefined,
    contactPhoneCountryCode: state.contactPhoneCountryCode.value || undefined,
    contactPhoneType: (state.contactPhoneType.value && parsePhoneType(state.contactPhoneType.value.value)) || undefined,
    industrySectors: SelectMulti.getValuesAsStrings(state.industrySectors),
    categories: SelectMulti.getValuesAsStrings(state.categories),
    numberOfEmployees: (state.numberOfEmployees.value && state.numberOfEmployees.value.value) || undefined,
    indigenousOwnership: (state.indigenousOwnership.value && state.indigenousOwnership.value.value) || undefined,
    headOfficeLocation: (state.headOfficeLocation.value && state.headOfficeLocation.value.value) || undefined,
    signUpReason: (state.signUpReason.value && state.signUpReason.value.value) || undefined
  };
}

export function setValues(state: Immutable<State>, profile: VendorProfile): Immutable<State> {
  const industrySectors = profile.industrySectors.length ? profile.industrySectors : [undefined];
  const categories = profile.categories.length ? profile.categories : [undefined];
  state = state
    .setIn(['businessName', 'value'], profile.businessName || '')
    .set('businessType', Select.setValue(state.businessType, profile.businessType))
    .setIn(['businessNumber', 'value'], profile.businessNumber || '')
    .setIn(['businessStreetAddress', 'value'], profile.businessStreetAddress || '')
    .setIn(['businessCity', 'value'], profile.businessCity || '')
    .setIn(['businessProvince', 'value'], profile.businessProvince || '')
    .setIn(['businessPostalCode', 'value'], profile.businessPostalCode || '')
    .setIn(['businessCountry', 'value'], profile.businessCountry || '')
    .setIn(['contactName', 'value'], profile.contactName || '')
    .setIn(['contactPositionTitle', 'value'], profile.contactPositionTitle || '')
    .setIn(['contactEmail', 'value'], profile.contactEmail || '')
    .setIn(['contactPhoneNumber', 'value'], profile.contactPhoneNumber || '')
    .setIn(['contactPhoneCountryCode', 'value'], profile.contactPhoneCountryCode || '')
    .set('contactPhoneType', Select.setValue(state.contactPhoneType, profile.contactPhoneType))
    .set('industrySectors', SelectMulti.setValues(state.industrySectors, industrySectors))
    .set('categories', SelectMulti.setValues(state.categories, categories))
    .set('numberOfEmployees', Select.setValue(state.numberOfEmployees, profile.numberOfEmployees))
    .set('indigenousOwnership', Select.setValue(state.indigenousOwnership, profile.indigenousOwnership))
    .set('headOfficeLocation', Select.setValue(state.headOfficeLocation, profile.headOfficeLocation))
    .set('signUpReason', Select.setValue(state.signUpReason, profile.signUpReason));
  return state.setIn(['businessCity', 'required'], businessCityIsRequired(get(state.headOfficeLocation.value, 'value', '')));
}

export function setErrors(state: Immutable<State>, errors: ValidationErrors): Immutable<State> {
  return (
    state
      .set('validationErrors', errors)
      // Don't show validation errors for empty required fields.
      .setIn(['businessName', 'errors'], state.businessName.value ? errors.businessName || [] : [])
      // All other fields are optional.
      .setIn(['businessType', 'errors'], errors.businessType || [])
      .setIn(['businessNumber', 'errors'], errors.businessNumber || [])
      .setIn(['businessStreetAddress', 'errors'], errors.businessStreetAddress || [])
      .setIn(['businessCity', 'errors'], errors.businessCity || [])
      .setIn(['businessProvince', 'errors'], errors.businessProvince || [])
      .setIn(['businessPostalCode', 'errors'], errors.businessPostalCode || [])
      .setIn(['businessCountry', 'errors'], errors.businessCountry || [])
      .setIn(['contactName', 'errors'], errors.contactName || [])
      .setIn(['contactPositionTitle', 'errors'], errors.contactPositionTitle || [])
      .setIn(['contactEmail', 'errors'], errors.contactEmail || [])
      .setIn(['contactPhoneNumber', 'errors'], errors.contactPhoneNumber || [])
      .setIn(['contactPhoneCountryCode', 'errors'], errors.contactPhoneCountryCode || [])
      .setIn(['contactPhoneType', 'errors'], errors.contactPhoneType || [])
      .set('industrySectors', SelectMulti.setErrors(state.industrySectors, errors.industrySectors || []))
      .set('categories', SelectMulti.setErrors(state.categories, errors.categories || []))
      .setIn(['numberOfEmployees', 'errors'], errors.numberOfEmployees || [])
      .setIn(['indigenousOwnership', 'errors'], errors.indigenousOwnership || [])
      .setIn(['headOfficeLocation', 'errors'], errors.headOfficeLocation || [])
      .setIn(['signUpReason', 'errors'], errors.signUpReason || [])
  );
}

export function isValid(state: Immutable<State>): boolean {
  const providedRequiredFields = !!state.businessName.value && !!state.contactName.value;
  const noValidationErrors = reduce(
    state.validationErrors,
    (acc: boolean, v: string[] | string[][] | undefined, k: string) => {
      return acc && (!v || !v.length);
    },
    true
  );
  return providedRequiredFields && noValidationErrors;
}

export type Msg =
  | ADT<'businessName', string>
  | ADT<'businessType', Select.Value>
  | ADT<'businessNumber', string>
  | ADT<'businessStreetAddress', string>
  | ADT<'businessCity', string>
  | ADT<'businessProvince', string>
  | ADT<'businessPostalCode', string>
  | ADT<'businessCountry', string>
  | ADT<'contactName', string>
  | ADT<'contactPositionTitle', string>
  | ADT<'contactEmail', string>
  | ADT<'contactPhoneNumber', string>
  | ADT<'contactPhoneCountryCode', string>
  | ADT<'contactPhoneType', Select.Value>
  | ADT<'industrySectors', SelectMulti.Msg>
  | ADT<'categories', SelectMulti.Msg>
  | ADT<'validate'>
  | ADT<'numberOfEmployees', Select.Value>
  | ADT<'indigenousOwnership', Select.Value>
  | ADT<'headOfficeLocation', Select.Value>
  | ADT<'signUpReason', Select.Value>;

export type Params = ProfileParams<VendorProfile>;

export const init: Init<Params, State> = async ({ profile }) => {
  const state = {
    validationErrors: {},
    businessName: ShortText.init({
      id: 'vendor-profile-business-name',
      type: 'text',
      required: true,
      label: 'Business Name',
      placeholder: 'Business Name'
    }),
    businessType: Select.init({
      id: 'vendor-profile-business-type',
      required: false,
      label: 'Business Type',
      placeholder: 'Select Type',
      options: {
        tag: 'options',
        value: [
          { value: BusinessType.Corporation, label: 'Corporation' },
          { value: BusinessType.LimitedLiabilityCompany, label: 'Limited Liability Company' },
          { value: BusinessType.Partnership, label: 'Partnership' },
          { value: BusinessType.SoleProprietor, label: 'Sole Proprietor' }
        ]
      }
    }),
    businessNumber: ShortText.init({
      id: 'vendor-profile-business-number',
      type: 'text',
      required: false,
      label: 'Business Number',
      placeholder: 'Business Number'
    }),
    businessStreetAddress: ShortText.init({
      id: 'vendor-profile-business-street-address',
      type: 'text',
      required: false,
      label: 'Street Address',
      placeholder: 'Street Address'
    }),
    businessCity: ShortText.init({
      id: 'vendor-profile-business-city',
      type: 'text',
      required: false,
      label: 'City',
      placeholder: 'City'
    }),
    businessProvince: ShortText.init({
      id: 'vendor-profile-business-province',
      type: 'text',
      required: false,
      label: 'Province/State',
      placeholder: 'Province/State'
    }),
    businessPostalCode: ShortText.init({
      id: 'vendor-profile-business-postal-code',
      type: 'text',
      required: false,
      label: 'Postal/Zip Code',
      placeholder: 'Postal/Zip Code'
    }),
    businessCountry: ShortText.init({
      id: 'vendor-profile-business-country',
      type: 'text',
      required: false,
      label: 'Country',
      placeholder: 'Country'
    }),
    contactName: ShortText.init({
      id: 'vendor-profile-contact-name',
      type: 'text',
      required: true,
      label: 'Contact Name',
      placeholder: 'Contact Name'
    }),
    contactPositionTitle: ShortText.init({
      id: 'vendor-profile-contact-position-title',
      type: 'text',
      required: false,
      label: 'Position Title',
      placeholder: 'Position Title'
    }),
    contactEmail: ShortText.init({
      id: 'vendor-profile-contact-email',
      type: 'email',
      required: false,
      label: 'Email Address',
      placeholder: 'Email Address'
    }),
    contactPhoneNumber: ShortText.init({
      id: 'vendor-profile-contact-phone-number',
      type: 'text',
      required: false,
      label: 'Phone Number',
      placeholder: 'e.g. 888-888-8888'
    }),
    contactPhoneCountryCode: ShortText.init({
      id: 'vendor-profile-contact-phone-country-code',
      type: 'text',
      required: false,
      label: 'Country Code',
      placeholder: 'e.g. 1'
    }),
    contactPhoneType: Select.init({
      id: 'vendor-profile-contact-phone-type',
      required: false,
      label: 'Phone Type',
      placeholder: 'Select Type',
      options: {
        tag: 'options',
        value: [
          { value: PhoneType.Office, label: 'Office' },
          { value: PhoneType.CellPhone, label: 'Cell Phone' }
        ]
      }
    }),
    industrySectors: immutable(
      await SelectMulti.init({
        options: AVAILABLE_INDUSTRY_SECTORS.toJS().map((value) => ({ label: value, value })),
        placeholder: 'Select Industry Sector',
        isCreatable: true,
        formFieldMulti: {
          idNamespace: 'vendor-industry-sectors',
          label: 'Industry Sector(s)',
          required: true,
          minFields: 1,
          fields: SelectMulti.DEFAULT_SELECT_MULTI_FIELDS
        }
      })
    ),
    categories: immutable(
      await SelectMulti.init({
        options: AVAILABLE_CATEGORIES.toJS().map((value) => ({ label: value, value })),
        placeholder: 'Select an Area of Interest',
        isCreatable: true,
        formFieldMulti: {
          idNamespace: 'vendor-categories',
          label: 'Area(s) of Interest',
          required: true,
          minFields: 1,
          fields: SelectMulti.DEFAULT_SELECT_MULTI_FIELDS
        }
      })
    ),
    numberOfEmployees: Select.init({
      id: 'vendor-profile-number-of-employees',
      required: true,
      label: 'Number of Employees',
      placeholder: 'Select Number of Employees',
      options: {
        tag: 'options',
        value: AVAILABLE_NUMBER_OF_EMPLOYEES.toJS().map((value) => ({ label: value, value }))
      }
    }),
    indigenousOwnership: Select.init({
      id: 'vendor-profile-indigenous-ownership',
      required: true,
      label: 'Indigenous Ownership',
      placeholder: 'Select Indigenous Ownership',
      options: {
        tag: 'options',
        value: AVAILABLE_INDIGENOUS_OWNERSHIP.toJS().map((value) => ({ label: value, value }))
      }
    }),
    headOfficeLocation: Select.init({
      id: 'vendor-profile-head-office-location',
      required: true,
      label: 'Head Office Location',
      placeholder: 'Select Head Office Location',
      options: {
        tag: 'options',
        value: AVAILABLE_HEAD_OFFICE_LOCATIONS.toJS().map((value) => ({ label: value, value }))
      }
    }),
    signUpReason: Select.init({
      id: 'vendor-profile-sign-up-reason',
      required: false,
      isCreatable: true,
      label: 'How did you hear about the Procurement Concierge Program?',
      placeholder: 'Select',
      options: {
        tag: 'options',
        value: AVAILABLE_SIGN_UP_REASONS.toJS().map((value) => ({ label: value, value }))
      }
    })
  };
  if (!profile) {
    return state;
  } else {
    return setValues(immutable(state), profile).toJSON();
  }
};

export const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'businessName':
      return [updateValue(state, 'businessName', msg.value)];
    case 'businessType':
      return [validateValues(updateValue(state, 'businessType', msg.value))];
    case 'businessNumber':
      return [updateValue(state, 'businessNumber', msg.value)];
    case 'businessStreetAddress':
      return [updateValue(state, 'businessStreetAddress', msg.value)];
    case 'businessCity':
      return [updateValue(state, 'businessCity', msg.value)];
    case 'businessProvince':
      return [updateValue(state, 'businessProvince', msg.value)];
    case 'businessPostalCode':
      return [updateValue(state, 'businessPostalCode', msg.value)];
    case 'businessCountry':
      return [updateValue(state, 'businessCountry', msg.value)];
    case 'contactName':
      return [updateValue(state, 'contactName', msg.value)];
    case 'contactPositionTitle':
      return [updateValue(state, 'contactPositionTitle', msg.value)];
    case 'contactEmail':
      return [updateValue(state, 'contactEmail', msg.value)];
    case 'contactPhoneNumber':
      return [updateValue(state, 'contactPhoneNumber', msg.value)];
    case 'contactPhoneCountryCode':
      return [updateValue(state, 'contactPhoneCountryCode', msg.value)];
    case 'contactPhoneType':
      return [validateValues(updateValue(state, 'contactPhoneType', msg.value))];
    case 'industrySectors':
      state = updateComponentChild({
        state,
        mapChildMsg: (value) => ({ tag: 'industrySectors', value }),
        childStatePath: ['industrySectors'],
        childUpdate: SelectMulti.update,
        childMsg: msg.value
      })[0];
      return [validateValues(state)];
    case 'categories':
      state = updateComponentChild({
        state,
        mapChildMsg: (value) => ({ tag: 'categories', value }),
        childStatePath: ['categories'],
        childUpdate: SelectMulti.update,
        childMsg: msg.value
      })[0];
      return [validateValues(state)];
    case 'numberOfEmployees':
      return [validateValues(updateValue(state, 'numberOfEmployees', msg.value))];
    case 'indigenousOwnership':
      return [validateValues(updateValue(state, 'indigenousOwnership', msg.value))];
    case 'headOfficeLocation':
      state = validateValues(updateValue(state, 'headOfficeLocation', msg.value));
      state = state.setIn(['businessCity', 'required'], businessCityIsRequired(get(msg.value, 'value', '')));
      return [state];
    case 'signUpReason':
      return [validateValues(updateValue(state, 'signUpReason', msg.value))];
    case 'validate':
      return [validateValues(state)];
    default:
      return [state];
  }
};

function updateValue<K extends FormFieldKeys>(state: Immutable<State>, key: K, value: State[K]['value']): Immutable<State> {
  return state.setIn([key, 'value'], value);
}

function validateValues(state: Immutable<State>): Immutable<State> {
  const validation = validateVendorProfile(getValues(state));
  return persistValidations(state, validation);
}

function persistValidations(state: Immutable<State>, validation: ValidOrInvalid<VendorProfile, ValidationErrors>): Immutable<State> {
  switch (validation.tag) {
    case 'valid':
      // We don't set values here because it may be causing mobile browsers to be janky.
      // state = setValues(state, validation.value);
      return setErrors(state, {});
    case 'invalid':
      return setErrors(state, validation.value);
  }
}

export const BusinessInformation: ProfileView<State, Msg> = ({ state, dispatch, disabled = false }) => {
  const onChangeShortText = (tag: any) => ShortText.makeOnChange(dispatch, (value) => ({ tag, value }));
  const onChangeSelect = (tag: any) => Select.makeOnChange(dispatch, (value) => ({ tag, value }));
  const validate = () => dispatch({ tag: 'validate', value: undefined });
  return (
    <div className="mt-4">
      <FormSectionHeading text="Business Information" />
      <Row>
        <Col xs="12">
          <ShortText.view state={state.businessName} disabled={disabled} onChangeDebounced={validate} onChange={onChangeShortText('businessName')} />
        </Col>
      </Row>
      <Row>
        <Col xs="12" md="6">
          <Select.view state={state.businessType} disabled={disabled} onChange={onChangeSelect('businessType')} />
        </Col>
        <Col xs="12" md="6">
          <ShortText.view state={state.businessNumber} disabled={disabled} onChangeDebounced={validate} onChange={onChangeShortText('businessNumber')} />
        </Col>
      </Row>
      <Row>
        <Col xs="12" md="6">
          <Select.view state={state.numberOfEmployees} disabled={disabled} onChange={onChangeSelect('numberOfEmployees')} />
        </Col>
      </Row>
      <Row>
        <Col xs="12" md="6">
          <Select.view state={state.indigenousOwnership} disabled={disabled} onChange={onChangeSelect('indigenousOwnership')} />
        </Col>
      </Row>
      <Row>
        <Col xs="12" md="6">
          <Select.view state={state.headOfficeLocation} disabled={disabled} onChange={onChangeSelect('headOfficeLocation')} />
        </Col>
      </Row>
      <Row>
        <Col xs="12">
          <ShortText.view state={state.businessStreetAddress} disabled={disabled} onChangeDebounced={validate} onChange={onChangeShortText('businessStreetAddress')} />
        </Col>
      </Row>
      <Row>
        <Col xs="12" md="6">
          <ShortText.view state={state.businessCity} disabled={disabled} onChangeDebounced={validate} onChange={onChangeShortText('businessCity')} />
        </Col>
        <Col xs="12" md="6">
          <ShortText.view state={state.businessProvince} disabled={disabled} onChangeDebounced={validate} onChange={onChangeShortText('businessProvince')} />
        </Col>
      </Row>
      <Row>
        <Col xs="12" md="4">
          <ShortText.view state={state.businessPostalCode} disabled={disabled} onChangeDebounced={validate} onChange={onChangeShortText('businessPostalCode')} />
        </Col>
        <Col xs="12" md="6">
          <ShortText.view state={state.businessCountry} disabled={disabled} onChangeDebounced={validate} onChange={onChangeShortText('businessCountry')} />
        </Col>
      </Row>
    </div>
  );
};

export const ContactInformation: ProfileView<State, Msg> = ({ state, dispatch, disabled = false }) => {
  const onChangeShortText = (tag: any) => ShortText.makeOnChange(dispatch, (value) => ({ tag, value }));
  const onChangeSelect = (tag: any) => Select.makeOnChange(dispatch, (value) => ({ tag, value }));
  const validate = () => dispatch({ tag: 'validate', value: undefined });
  return (
    <div className="mt-4">
      <FormSectionHeading text="Contact Information (Optional)" />
      <Row>
        <Col xs="12" md="6">
          <ShortText.view state={state.contactName} disabled={disabled} onChangeDebounced={validate} onChange={onChangeShortText('contactName')} />
        </Col>
        <Col xs="12" md="6">
          <ShortText.view state={state.contactPositionTitle} disabled={disabled} onChangeDebounced={validate} onChange={onChangeShortText('contactPositionTitle')} />
        </Col>
      </Row>
      <Row>
        <Col xs="12">
          <ShortText.view state={state.contactEmail} disabled={disabled} onChangeDebounced={validate} onChange={onChangeShortText('contactEmail')} />
        </Col>
      </Row>
      <Row>
        <Col xs="12" md="4">
          <ShortText.view state={state.contactPhoneNumber} disabled={disabled} onChangeDebounced={validate} onChange={onChangeShortText('contactPhoneNumber')} />
        </Col>
        <Col xs="12" md="4">
          <ShortText.view state={state.contactPhoneCountryCode} disabled={disabled} onChangeDebounced={validate} onChange={onChangeShortText('contactPhoneCountryCode')} />
        </Col>
        <Col xs="12" md="4">
          <Select.view state={state.contactPhoneType} disabled={disabled} onChange={onChangeSelect('contactPhoneType')} />
        </Col>
      </Row>
    </div>
  );
};

export const IndustrySectors: ProfileView<State, Msg> = ({ state, dispatch, disabled = false }) => {
  const dispatchIndustrySectors: Dispatch<SelectMulti.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, (value) => ({ tag: 'industrySectors' as const, value }));
  return (
    <Row className="mt-4">
      <Col xs="12" md="10">
        <SelectMulti.view state={state.industrySectors} dispatch={dispatchIndustrySectors} disabled={disabled} labelClassName="h3" labelWrapperClassName="mb-3" />
      </Col>
    </Row>
  );
};

export const Categories: ProfileView<State, Msg> = ({ state, dispatch, disabled = false }) => {
  const dispatchCategories: Dispatch<SelectMulti.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, (value) => ({ tag: 'categories' as const, value }));
  return (
    <Row className="mt-4">
      <Col xs="12" md="10">
        <SelectMulti.view state={state.categories} dispatch={dispatchCategories} disabled={disabled} labelClassName="h3" labelWrapperClassName="mb-3" />
      </Col>
    </Row>
  );
};

export const Other: ProfileView<State, Msg> = ({ state, dispatch, disabled = false }) => {
  const onChangeSelect = (tag: any) => Select.makeOnChange(dispatch, (value) => ({ tag, value }));
  return (
    <div className="mt-4">
      <FormSectionHeading text="Other" />
      <Row>
        <Col xs="12" md="10">
          <Select.view state={state.signUpReason} disabled={disabled} onChange={onChangeSelect('signUpReason')} />
        </Col>
      </Row>
    </div>
  );
};

export const view: ProfileView<State, Msg> = (props) => {
  return (
    <div>
      <BusinessInformation {...props} />
      <ContactInformation {...props} />
      <IndustrySectors {...props} />
      <Categories {...props} />
      <Other {...props} />
    </div>
  );
};

export const component: ProfileComponent<State, Msg, VendorProfile> = {
  init,
  update,
  view,
  getValues,
  setValues,
  setErrors,
  isValid,
  userType: UserType.Vendor
};
