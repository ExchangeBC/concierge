import { ProfileComponent, ProfileParams, ProfileView } from 'front-end/lib/components/profiles/types';
import { immutable, Immutable, Init, Update } from 'front-end/lib/framework';
import * as ShortText from 'front-end/lib/views/form-field/short-text';
import FormSectionHeading from 'front-end/lib/views/form-section-heading';
import { reduce } from 'lodash';
import { default as React } from 'react';
import { Col, Row } from 'reactstrap';
import { ADT, UserType } from 'shared/lib/types';
import { ProgramStaffProfile, userTypeToTitleCase } from 'shared/lib/types';
import { ValidOrInvalid } from 'shared/lib/validators';
import { ProgramStaffProfileValidationErrors, validateProgramStaffProfile } from 'shared/lib/validators/program-staff-profile';

export type ValidationErrors = ProgramStaffProfileValidationErrors;

export interface State {
  validationErrors: ValidationErrors;
  firstName: ShortText.State;
  lastName: ShortText.State;
  positionTitle: ShortText.State;
}

type FormFieldKeys
  = 'firstName'
  | 'lastName'
  | 'positionTitle';

export function getValues(state: Immutable<State>): ProgramStaffProfile {
  return {
    type: UserType.ProgramStaff as UserType.ProgramStaff,
    firstName: state.firstName.value,
    lastName: state.lastName.value,
    positionTitle: state.positionTitle.value
  };
}

export function setValues(state: Immutable<State>, profile: ProgramStaffProfile): Immutable<State> {
  return state
    .setIn(['firstName', 'value'], profile.firstName || '')
    .setIn(['lastName', 'value'], profile.lastName || '')
    .setIn(['positionTitle', 'value'], profile.positionTitle || '');
}

export function setErrors(state: Immutable<State>, errors: ValidationErrors): Immutable<State> {
  return state
    .set('validationErrors', errors)
    // Don't show validation errors for empty required fields.
    .setIn(['firstName', 'errors'], state.firstName.value ? errors.firstName || [] : [])
    // All other fields are optional.
    .setIn(['lastName', 'errors'], state.lastName.value ? errors.lastName || [] : [])
    .setIn(['positionTitle', 'errors'], state.positionTitle.value ? errors.positionTitle || [] : []);
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

export const view: ProfileView<State, Msg> = ProgramStaffInformation;

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
