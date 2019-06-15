import { ComponentView, Immutable, Init, Update } from 'front-end/lib/framework';
import { IsLoading, IsValid, makeView, StepComponent, StepMsg } from 'front-end/lib/pages/sign-up/lib/steps/step';
import * as ShortText from 'front-end/lib/views/form-field/short-text';
import { get } from 'lodash';
import React from 'react';
import { Col, Row } from 'reactstrap';
import { CreateValidationErrors } from 'shared/lib/resources/user';
import { ADT, UserType, userTypeToTitleCase } from 'shared/lib/types';
import { getInvalidValue, mapValid, validateCity, validateFirstName, validateLastName, validatePositionTitle, Validation } from 'shared/lib/validators';
import { validateBranch, validatePublicSectorEntity } from 'shared/lib/validators/buyer-profile';

export interface State {
  firstName: ShortText.State;
  lastName: ShortText.State;
  positionTitle: ShortText.State;
  publicSectorEntity: ShortText.State;
  branch: ShortText.State;
  contactCity: ShortText.State;
}

type FormFieldKeys
  = 'firstName'
  | 'lastName'
  | 'positionTitle'
  | 'publicSectorEntity'
  | 'branch'
  | 'contactCity';

export type InnerMsg
  = ADT<'onChangeFirstName', string>
  | ADT<'onChangeLastName', string>
  | ADT<'onChangePositionTitle', string>
  | ADT<'onChangePublicSectorEntity', string>
  | ADT<'onChangeBranch', string>
  | ADT<'onChangeContactCity', string>
  | ADT<'validateFirstName'>
  | ADT<'validateLastName'>
  | ADT<'validatePositionTitle'>
  | ADT<'validatePublicSectorEntity'>
  | ADT<'validateBranch'>
  | ADT<'validateContactCity'>;

export type Msg = StepMsg<InnerMsg>;

export type Params = null;

const init: Init<Params, State> = async () => {
  return {
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
      type: 'email',
      required: true,
      label: 'City',
      placeholder: 'City'
    })
  };
};

const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'onChangeFirstName':
      return [updateValue(state, 'firstName', msg.value)];
    case 'onChangeLastName':
      return [updateValue(state, 'lastName', msg.value)];
    case 'onChangePositionTitle':
      return [updateValue(state, 'positionTitle', msg.value)];
    case 'onChangePublicSectorEntity':
      return [updateValue(state, 'publicSectorEntity', msg.value)];
    case 'onChangeBranch':
      return [updateValue(state, 'branch', msg.value)];
    case 'onChangeContactCity':
      return [updateValue(state, 'contactCity', msg.value)];
    case 'validateFirstName':
      return [validateValue(state, 'firstName', validateFirstName)];
    case 'validateLastName':
      return [validateValue(state, 'lastName', validateLastName)];
    case 'validatePositionTitle':
      return [validateValue(state, 'positionTitle', validatePositionTitle)];
    case 'validatePublicSectorEntity':
      return [validateValue(state, 'publicSectorEntity', validatePublicSectorEntity)];
    case 'validateBranch':
      return [validateValue(state, 'branch', v => mapValid(validateBranch(v), w => w || ''))];
    case 'validateContactCity':
      return [validateValue(state, 'contactCity', validateCity)];
    default:
      return [state];
  }
};

function updateValue<K extends FormFieldKeys>(state: Immutable<State>, key: K, value: State[K]['value']): Immutable<State> {
  return state.setIn([key, 'value'], value);
}

function validateValue<K extends FormFieldKeys>(state: Immutable<State>, key: K, validate: (value: State[K]['value']) => Validation<State[K]['value']>): Immutable<State> {
  const validation = validate(state.getIn([key, 'value']));
  return state.setIn([key, 'errors'], getInvalidValue(validation, []));
}

const isValid: IsValid<State> = (state) => {
  return !!(
    !state.firstName.errors.length &&
    !state.lastName.errors.length &&
    !state.positionTitle.errors.length &&
    !state.publicSectorEntity.errors.length &&
    !state.branch.errors.length &&
    !state.contactCity.errors.length &&
    state.firstName.value &&
    state.lastName.value &&
    state.positionTitle.value &&
    state.publicSectorEntity.value &&
    state.contactCity.value
  );
};

const isLoading: IsLoading<State> = (state) => false;

const view: ComponentView<State, Msg> = makeView({
  title: `${userTypeToTitleCase(UserType.Buyer)} Information`,
  stepIndicator: 'Step 3 of 4',
  view({ state, dispatch }) {
    const onChangeShortText = (tag: any) => ShortText.makeOnChange(dispatch, value => ({ tag, value }));
    const onChangeDebounced = (tag: any) => () => dispatch({ tag, value: undefined });
    return (
      <div>
        <Row>
          <Col xs='12' md='4'>
            <ShortText.view
              state={state.firstName}
              onChangeDebounced={onChangeDebounced('validateFirstName')}
              onChange={onChangeShortText('onChangeFirstName')}
              autoFocus />
          </Col>
          <Col xs='12' md='4'>
            <ShortText.view
              state={state.lastName}
              onChangeDebounced={onChangeDebounced('validateLastName')}
              onChange={onChangeShortText('onChangeLastName')} />
          </Col>
        </Row>
        <Row>
          <Col xs='12' md='4'>
            <ShortText.view
              state={state.positionTitle}
              onChangeDebounced={onChangeDebounced('validatePositionTitle')}
              onChange={onChangeShortText('onChangePositionTitle')} />
          </Col>
        </Row>
        <Row>
          <Col xs='12' md='4'>
            <ShortText.view
              state={state.publicSectorEntity}
              onChangeDebounced={onChangeDebounced('validatePublicSectorEntity')}
              onChange={onChangeShortText('onChangePublicSectorEntity')} />
          </Col>
          <Col xs='12' md='4'>
            <ShortText.view
              state={state.branch}
              onChangeDebounced={onChangeDebounced('validateBranch')}
              onChange={onChangeShortText('onChangeBranch')} />
          </Col>
        </Row>
        <Row>
          <Col xs='12' md='4'>
            <ShortText.view
              state={state.contactCity}
              onChangeDebounced={onChangeDebounced('validateContactCity')}
              onChange={onChangeShortText('onChangeContactCity')} />
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
    .setIn(['firstName', 'errors'], get(errors.profile, 'firstName', []))
    .setIn(['lastName', 'errors'], get(errors.profile, 'lastName', []))
    .setIn(['postitionTitle', 'errors'], get(errors.profile, 'postitionTitle', []))
    .setIn(['publicSectorEntity', 'errors'], get(errors.profile, 'publicSectorEntity', []))
    .setIn(['branch', 'errors'], get(errors.profile, 'branch', []))
    .setIn(['contactCity', 'errors'], get(errors.profile, 'contactCity', []));
}
