import { ProfileComponent, ProfileParams, ProfileView } from 'front-end/lib/components/profiles/types';
import { immutable, Immutable, Init, Update } from 'front-end/lib/framework';
import FormSectionHeading from 'front-end/lib/views/form-section-heading';
import * as Select from 'front-end/lib/views/input/select';
import * as ShortText from 'front-end/lib/views/input/short-text';
import { reduce } from 'lodash';
import { default as React } from 'react';
import { Col, Row } from 'reactstrap';
import { ADT, UserType } from 'shared/lib/types';
import { parsePhoneType, PhoneType, ProgramStaffProfile, userTypeToTitleCase } from 'shared/lib/types';
import { ValidOrInvalid } from 'shared/lib/validators';
import { ProgramStaffProfileValidationErrors, validateProgramStaffProfile } from 'shared/lib/validators/program-staff-profile';

export type ValidationErrors = ProgramStaffProfileValidationErrors;

export interface State {
  validationErrors: ValidationErrors;
  firstName: ShortText.State;
  lastName: ShortText.State;
  positionTitle: ShortText.State;
  contactStreetAddress: ShortText.State;
  contactCity: ShortText.State;
  contactProvince: ShortText.State;
  contactPostalCode: ShortText.State;
  contactCountry: ShortText.State;
  contactPhoneNumber: ShortText.State;
  contactPhoneCountryCode: ShortText.State;
  contactPhoneType: Select.State;
}

type FormFieldKeys
  = 'firstName'
  | 'lastName'
  | 'positionTitle'
  | 'contactStreetAddress'
  | 'contactCity'
  | 'contactProvince'
  | 'contactPostalCode'
  | 'contactCountry'
  | 'contactPhoneNumber'
  | 'contactPhoneCountryCode'
  | 'contactPhoneType';

export function getValues(state: Immutable<State>): ProgramStaffProfile {
  return {
    type: UserType.ProgramStaff as UserType.ProgramStaff,
    firstName: state.firstName.value,
    lastName: state.lastName.value,
    positionTitle: state.positionTitle.value,
    contactStreetAddress: state.contactStreetAddress.value || undefined,
    contactCity: state.contactCity.value || undefined,
    contactProvince: state.contactProvince.value || undefined,
    contactPostalCode: state.contactPostalCode.value || undefined,
    contactCountry: state.contactCountry.value || undefined,
    contactPhoneNumber: state.contactPhoneNumber.value || undefined,
    contactPhoneCountryCode: state.contactPhoneCountryCode.value || undefined,
    contactPhoneType: parsePhoneType(state.contactPhoneType.value.value) || undefined
  };
}

export function setValues(state: Immutable<State>, profile: ProgramStaffProfile): Immutable<State> {
  return state
    .setIn(['firstName', 'value'], profile.firstName || '')
    .setIn(['lastName', 'value'], profile.lastName || '')
    .setIn(['positionTitle', 'value'], profile.positionTitle || '')
    .setIn(['contactStreetAddress', 'value'], profile.contactStreetAddress || '')
    .setIn(['contactCity', 'value'], profile.contactCity || '')
    .setIn(['contactProvince', 'value'], profile.contactProvince || '')
    .setIn(['contactPostalCode', 'value'], profile.contactPostalCode || '')
    .setIn(['contactCountry', 'value'], profile.contactCountry || '')
    .setIn(['contactPhoneNumber', 'value'], profile.contactPhoneNumber || '')
    .setIn(['contactPhoneCountryCode', 'value'], profile.contactPhoneCountryCode || '')
    .set('contactPhoneType', Select.setValue(state.contactPhoneType, profile.contactPhoneType));
}

export function setErrors(state: Immutable<State>, errors: ValidationErrors): Immutable<State> {
  return state
    .set('validationErrors', errors)
    // Don't show validation errors for empty required fields.
    .setIn(['firstName', 'errors'], state.firstName.value ? errors.firstName || [] : [])
    // All other fields are optional.
    .setIn(['lastName', 'errors'], state.lastName.value ? errors.lastName || [] : [])
    .setIn(['positionTitle', 'errors'], state.positionTitle.value ? errors.positionTitle || [] : [])
    .setIn(['contactStreetAddress', 'errors'], errors.contactStreetAddress || [])
    .setIn(['contactCity', 'errors'], errors.contactCity || [])
    .setIn(['contactProvince', 'errors'], errors.contactProvince || [])
    .setIn(['contactPostalCode', 'errors'], errors.contactPostalCode || [])
    .setIn(['contactCountry', 'errors'], errors.contactCountry || [])
    .setIn(['contactPhoneNumber', 'errors'], errors.contactPhoneNumber || [])
    .setIn(['contactPhoneCountryCode', 'errors'], errors.contactPhoneCountryCode || [])
    .setIn(['contactPhoneType', 'errors'], errors.contactPhoneType || []);
}

export function isValid(state: Immutable<State>): boolean {
  const providedRequiredFields = !!(state.firstName.value && state.lastName.value && state.positionTitle.value);
  const noValidationErrors = reduce(state.validationErrors, (acc: boolean, v: string[] | string[][] | undefined, k: string) => {
    return acc && (!v || !v.length);
  }, true);
  return providedRequiredFields && noValidationErrors;
}

export type Msg
  = ADT<'firstName', string>
  | ADT<'lastName', string>
  | ADT<'positionTitle', string>
  | ADT<'contactStreetAddress', string>
  | ADT<'contactCity', string>
  | ADT<'contactProvince', string>
  | ADT<'contactPostalCode', string>
  | ADT<'contactCountry', string>
  | ADT<'contactPhoneNumber', string>
  | ADT<'contactPhoneCountryCode', string>
  | ADT<'contactPhoneType', Select.Value>
  | ADT<'validate'>;

export type Params = ProfileParams<ProgramStaffProfile>;

export const init: Init<Params, State> = async ({ profile }) => {
  const state = {
    validationErrors: {},
    firstName: ShortText.init({
      id: 'program-staff-profile-first-name',
      type: 'text',
      required: true,
      label: 'First Name',
      placeholder: 'First Name'
    }),
    lastName: ShortText.init({
      id: 'program-staff-profile-last-name',
      type: 'text',
      required: true,
      label: 'Last Name',
      placeholder: 'Last Name'
    }),
    positionTitle: ShortText.init({
      id: 'program-staff-profile-position-title',
      type: 'text',
      required: true,
      label: 'Position Title',
      placeholder: 'Position Title'
    }),
    contactStreetAddress: ShortText.init({
      id: 'program-staff-profile-contact-street-address',
      type: 'text',
      required: false,
      label: 'Street Address',
      placeholder: 'Street Address'
    }),
    contactCity: ShortText.init({
      id: 'program-staff-profile-contact-city',
      type: 'email',
      required: false,
      label: 'City',
      placeholder: 'City'
    }),
    contactProvince: ShortText.init({
      id: 'program-staff-profile-contact-province',
      type: 'email',
      required: false,
      label: 'Province/State',
      placeholder: 'Province/State'
    }),
    contactPostalCode: ShortText.init({
      id: 'program-staff-profile-contact-postal-code',
      type: 'text',
      required: false,
      label: 'Postal/Zip Code',
      placeholder: 'Postal/Zip Code'
    }),
    contactCountry: ShortText.init({
      id: 'program-staff-profile-contact-country',
      type: 'text',
      required: false,
      label: 'Country',
      placeholder: 'Country'
    }),
    contactPhoneNumber: ShortText.init({
      id: 'program-staff-profile-contact-phone-number',
      type: 'text',
      required: false,
      label: 'Phone Number',
      placeholder: 'e.g. 888-888-8888'
    }),
    contactPhoneCountryCode: ShortText.init({
      id: 'program-staff-profile-contact-phone-country-code',
      type: 'text',
      required: false,
      label: 'Country Code',
      placeholder: 'e.g. 1'
    }),
    contactPhoneType: Select.init({
      id: 'program-staff-profile-contact-phone-type',
      required: false,
      label: 'Phone Type',
      unselectedLabel: 'Select Type',
      options: [
        { value: PhoneType.Office, label: 'Office' },
        { value: PhoneType.CellPhone, label: 'Cell Phone' }
      ]
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
    case 'firstName':
      return [updateValue(state, 'firstName', msg.value)];
    case 'lastName':
      return [updateValue(state, 'lastName', msg.value)];
    case 'positionTitle':
      return [updateValue(state, 'positionTitle', msg.value)];
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
  const validation = validateProgramStaffProfile(getValues(state));
  return persistValidations(state, validation);
}

function persistValidations(state: Immutable<State>, validation: ValidOrInvalid<ProgramStaffProfile, ValidationErrors>): Immutable<State> {
  switch (validation.tag) {
    case 'valid':
      // We don't set values here because it may be causing mobile browsers to be janky.
      // state = setValues(state, validation.value);
      return setErrors(state, {});
    case 'invalid':
      return setErrors(state, validation.value);
  }
}

export const ProgramStaffInformation: ProfileView<State, Msg> = ({ state, dispatch, disabled = false }) => {
  const onChangeShortText = (tag: any) => ShortText.makeOnChange(dispatch, value => ({ tag, value }));
  const validate = () => dispatch({ tag: 'validate', value: undefined });
  return (
    <div className='mt-3 mt-md-0'>
      <FormSectionHeading text={`${userTypeToTitleCase(UserType.ProgramStaff)} Information`} />
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
    </div>
  );
};

export const ContactInformation: ProfileView<State, Msg> = ({ state, dispatch, disabled = false }) => {
  const onChangeShortText = (tag: any) => ShortText.makeOnChange(dispatch, value => ({ tag, value }));
  const onChangeSelect = (tag: any) => Select.makeOnChange(dispatch, value => ({ tag, value }));
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

export const view: ProfileView<State, Msg> = props => {
  return (
    <div>
      <ProgramStaffInformation {...props} />
      <ContactInformation {...props} />
    </div>
  );
};

export const component: ProfileComponent<State, Msg, ProgramStaffProfile> = {
  init,
  update,
  view,
  getValues,
  setValues,
  setErrors,
  isValid,
  userType: UserType.ProgramStaff
};
