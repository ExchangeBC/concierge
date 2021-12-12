import * as SelectMulti from 'front-end/lib/components/form-field-multi/select';
import { ProfileComponent, ProfileParams, ProfileView } from 'front-end/lib/components/profiles/types';
import { Dispatch, immutable, Immutable, Init, mapComponentDispatch, Update, updateComponentChild } from 'front-end/lib/framework';
import * as ShortText from 'front-end/lib/views/form-field/short-text';
import FormSectionHeading from 'front-end/lib/views/form-section-heading';
import { reduce } from 'lodash';
import { default as React } from 'react';
import { Col, Row } from 'reactstrap';
import AVAILABLE_CATEGORIES from 'shared/data/categories';
import AVAILABLE_INDUSTRY_SECTORS from 'shared/data/industry-sectors';
import { ADT, BuyerProfile, UserType, userTypeToTitleCase, VerificationStatus } from 'shared/lib/types';
import { ValidOrInvalid } from 'shared/lib/validators';
import { BuyerProfileValidationErrors, validateBuyerProfile } from 'shared/lib/validators/buyer-profile';

const DEFAULT_SELECT_MULTI_FIELDS = [
  {
    value: undefined,
    errors: []
  }
];

export type ValidationErrors = BuyerProfileValidationErrors;

export interface State {
  validationErrors: ValidationErrors;
  firstName: ShortText.State;
  lastName: ShortText.State;
  positionTitle: ShortText.State;
  publicSectorEntity: ShortText.State;
  branch: ShortText.State;
  contactCity: ShortText.State;
  industrySectors: Immutable<SelectMulti.State>;
  categories: Immutable<SelectMulti.State>;
  verificationStatus: VerificationStatus;
}

type FormFieldKeys = 'firstName' | 'lastName' | 'positionTitle' | 'publicSectorEntity' | 'branch' | 'contactCity';

export function getValues(state: Immutable<State>): BuyerProfile {
  return {
    type: UserType.Buyer as UserType.Buyer,
    firstName: state.firstName.value,
    lastName: state.lastName.value,
    positionTitle: state.positionTitle.value,
    publicSectorEntity: state.publicSectorEntity.value,
    branch: state.branch.value || undefined,
    contactCity: state.contactCity.value,
    industrySectors: SelectMulti.getValuesAsStrings(state.industrySectors),
    categories: SelectMulti.getValuesAsStrings(state.categories),
    verificationStatus: state.verificationStatus
  };
}

export function setValues(state: Immutable<State>, profile: BuyerProfile): Immutable<State> {
  const industrySectors = profile.industrySectors.length ? profile.industrySectors : [undefined];
  const categories = profile.categories.length ? profile.categories : [undefined];
  return state
    .setIn(['firstName', 'value'], profile.firstName || '')
    .setIn(['lastName', 'value'], profile.lastName || '')
    .setIn(['positionTitle', 'value'], profile.positionTitle || '')
    .setIn(['publicSectorEntity', 'value'], profile.publicSectorEntity || '')
    .setIn(['branch', 'value'], profile.branch || '')
    .setIn(['contactCity', 'value'], profile.contactCity || '')
    .set('industrySectors', SelectMulti.setValues(state.industrySectors, industrySectors))
    .set('categories', SelectMulti.setValues(state.categories, categories))
    .set('verificationStatus', profile.verificationStatus);
}

export function setErrors(state: Immutable<State>, errors: ValidationErrors): Immutable<State> {
  return (
    state
      .set('validationErrors', errors)
      // Don't show validation errors for empty required fields.
      .setIn(['firstName', 'errors'], state.firstName.value ? errors.firstName || [] : [])
      // All other fields are optional.
      .setIn(['lastName', 'errors'], state.lastName.value ? errors.lastName || [] : [])
      .setIn(['positionTitle', 'errors'], state.positionTitle.value ? errors.positionTitle || [] : [])
      .setIn(['publicSectorEntity', 'errors'], state.publicSectorEntity.value ? errors.publicSectorEntity || [] : [])
      .setIn(['branch', 'errors'], errors.branch || [])
      .setIn(['contactCity', 'errors'], errors.contactCity || [])
      .set('industrySectors', SelectMulti.setErrors(state.industrySectors, errors.industrySectors || []))
      .set('categories', SelectMulti.setErrors(state.categories, errors.categories || []))
  );
}

export function isValid(state: Immutable<State>): boolean {
  const providedRequiredFields = !!(state.firstName.value && state.lastName.value && state.positionTitle.value && state.publicSectorEntity.value);
  const noValidationErrors = reduce(
    state.validationErrors,
    (acc: boolean, v: string[] | string[][] | undefined, k: string) => {
      return acc && (!v || !v.length);
    },
    true
  );
  return providedRequiredFields && noValidationErrors;
}

export type Msg = ADT<'firstName', string> | ADT<'lastName', string> | ADT<'positionTitle', string> | ADT<'publicSectorEntity', string> | ADT<'branch', string> | ADT<'contactCity', string> | ADT<'industrySectors', SelectMulti.Msg> | ADT<'categories', SelectMulti.Msg> | ADT<'validate'>;

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
    contactCity: ShortText.init({
      id: 'buyer-profile-contact-city',
      type: 'text',
      required: true,
      label: 'City',
      placeholder: 'City'
    }),
    industrySectors: immutable(
      await SelectMulti.init({
        options: AVAILABLE_INDUSTRY_SECTORS.toJS().map((value) => ({ label: value, value })),
        placeholder: 'Select Industry Sector',
        isCreatable: true,
        formFieldMulti: {
          idNamespace: 'buyer-industry-sectors',
          label: 'Industry Sector(s)',
          required: true,
          minFields: 1,
          fields: DEFAULT_SELECT_MULTI_FIELDS
        }
      })
    ),
    categories: immutable(
      await SelectMulti.init({
        options: AVAILABLE_CATEGORIES.toJS().map((value) => ({ label: value, value })),
        placeholder: 'Select an Area of Interest',
        isCreatable: true,
        formFieldMulti: {
          idNamespace: 'buyer-categories',
          label: 'Area(s) of Interest',
          required: true,
          minFields: 1,
          fields: DEFAULT_SELECT_MULTI_FIELDS
        }
      })
    ),
    verificationStatus: VerificationStatus.Unverified
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
    case 'publicSectorEntity':
      return [updateValue(state, 'publicSectorEntity', msg.value)];
    case 'branch':
      return [updateValue(state, 'branch', msg.value)];
    case 'contactCity':
      return [updateValue(state, 'contactCity', msg.value)];
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

export const BuyerInformation: ProfileView<State, Msg> = ({ state, dispatch, disabled = false }) => {
  const onChangeShortText = (tag: any) => ShortText.makeOnChange(dispatch, (value) => ({ tag, value }));
  const validate = () => dispatch({ tag: 'validate', value: undefined });
  return (
    <div className="mt-4">
      <FormSectionHeading text={`${userTypeToTitleCase(UserType.Buyer)} Information`} />
      <Row>
        <Col xs="12" md="6">
          <ShortText.view state={state.firstName} disabled={disabled} onChangeDebounced={validate} onChange={onChangeShortText('firstName')} />
        </Col>
        <Col xs="12" md="6">
          <ShortText.view state={state.lastName} disabled={disabled} onChangeDebounced={validate} onChange={onChangeShortText('lastName')} />
        </Col>
      </Row>
      <Row>
        <Col xs="12" md="6">
          <ShortText.view state={state.positionTitle} disabled={disabled} onChangeDebounced={validate} onChange={onChangeShortText('positionTitle')} />
        </Col>
      </Row>
      <Row>
        <Col xs="12" md="6">
          <ShortText.view state={state.publicSectorEntity} disabled={disabled} onChangeDebounced={validate} onChange={onChangeShortText('publicSectorEntity')} />
        </Col>
        <Col xs="12" md="6">
          <ShortText.view state={state.branch} disabled={disabled} onChangeDebounced={validate} onChange={onChangeShortText('branch')} />
        </Col>
      </Row>
      <Row>
        <Col xs="12" md="6">
          <ShortText.view state={state.contactCity} disabled={disabled} onChangeDebounced={validate} onChange={onChangeShortText('contactCity')} />
        </Col>
      </Row>
    </div>
  );
};

export const IndustrySectors: ProfileView<State, Msg> = ({ state, dispatch, disabled = false }) => {
  const dispatchIndustrySectors: Dispatch<SelectMulti.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, (value) => ({ tag: 'industrySectors' as 'industrySectors', value }));
  return (
    <Row className="mt-4">
      <Col xs="12" md="10">
        <SelectMulti.view state={state.industrySectors} dispatch={dispatchIndustrySectors} disabled={disabled} labelClassName="h3" labelWrapperClassName="mb-3" />
      </Col>
    </Row>
  );
};

export const Categories: ProfileView<State, Msg> = ({ state, dispatch, disabled = false }) => {
  const dispatchCategories: Dispatch<SelectMulti.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, (value) => ({ tag: 'categories' as 'categories', value }));
  return (
    <Row className="mt-4">
      <Col xs="12" md="10">
        <SelectMulti.view state={state.categories} dispatch={dispatchCategories} disabled={disabled} labelClassName="h3" labelWrapperClassName="mb-3" />
      </Col>
    </Row>
  );
};

export const view: ProfileView<State, Msg> = (props) => {
  return (
    <div>
      <BuyerInformation {...props} />
      <IndustrySectors {...props} />
      <Categories {...props} />
    </div>
  );
};

export const component: ProfileComponent<State, Msg, BuyerProfile> = {
  init,
  update,
  view,
  getValues,
  setValues,
  setErrors,
  isValid,
  userType: UserType.Buyer
};
