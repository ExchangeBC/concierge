import { Page } from 'front-end/lib/app/types';
import * as SelectMulti from 'front-end/lib/components/input/select-multi';
import { Component, ComponentMsg, ComponentView, Dispatch, immutable, Immutable, Init, mapComponentDispatch, Update, updateComponentChild } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
// import { validateObjectIdString } from 'front-end/lib/validators';
import FormSectionHeading from 'front-end/lib/views/form-section-heading';
import * as DateTime from 'front-end/lib/views/input/datetime';
import * as Select from 'front-end/lib/views/input/select';
import * as ShortText from 'front-end/lib/views/input/short-text';
import { find } from 'lodash';
// import { flow } from 'lodash/fp';
// import moment from 'moment';
import { default as React } from 'react';
import { Col, Row } from 'reactstrap';
import AVAILABLE_CATEGORIES from 'shared/data/categories';
import { getString } from 'shared/lib';
import { PublicRfi } from 'shared/lib/resources/request-for-information';
import { PublicUser } from 'shared/lib/resources/user';
import { ADT, profileToName, UserType, userTypeToTitleCase } from 'shared/lib/types';
import { getInvalidValue, invalid, valid, validateCategories, validateDate, Validation } from 'shared/lib/validators';
import { validatePublicSectorEntity, validateRfiNumber, validateTitle } from 'shared/lib/validators/request-for-information';

const FALLBACK_NAME = 'No Name Provided';

export interface Params {
  isEditing: boolean;
  existingRfi?: PublicRfi;
}

export type InnerMsg
  = ADT<'onChangeRfiNumber', string>
  | ADT<'onChangeTitle', string>
  | ADT<'onChangePublicSectorEntity', string>
  | ADT<'onChangeClosingDate', string>
  | ADT<'onChangeClosingTime', string>
  | ADT<'onChangeBuyerContact', string>
  | ADT<'onChangeProgramStaffContact', string>
  | ADT<'onChangeCategories', SelectMulti.Msg>
  | ADT<'validateRfiNumber'>
  | ADT<'validateTitle'>
  | ADT<'validatePublicSectorEntity'>
  | ADT<'validateClosingDate'>
  | ADT<'validateClosingTime'>;

export type Msg = ComponentMsg<InnerMsg, Page>;

export interface State {
  loading: number;
  isEditing: boolean;
  buyers: PublicUser[];
  programStaff: PublicUser[];
  rfiNumber: ShortText.State;
  title: ShortText.State;
  publicSectorEntity: ShortText.State;
  closingDate: DateTime.State;
  closingTime: DateTime.State;
  buyerContact: Select.State;
  programStaffContact: Select.State;
  categories: Immutable<SelectMulti.State>;
  description: false;
  discoveryDay: false;
  attachments: false;
  addenda: false;
};

// TODO create a CreateRequestBody type in shared,
// and use it with the back-end.
/*interface Version extends Omit<PublicVersion, 'createdAt' | 'closingAt' | 'addenda' | 'attachments' | 'programStaffContact' | 'buyerContact'> {
  closingAt: string;
  addenda: string[];
  attachments: string[];
  programStaffContact: string;
  buyerContact: string;
}

interface ValidatedVersion {
  closingAt: Validation<Date>;
  rfiNumber: Validation<string>;
  title: Validation<string>;
  description: Validation<string>;
  publicSectorEntity: Validation<string>;
  categories: ValidOrInvalid<string[], string[][]>;
  discoveryDay: Validation<boolean>;
  addenda: ValidOrInvalid<string[], string[][]>;
  attachments: ValidOrInvalid<string[], string[][]>;
  buyerContact: Validation<string>;
  programStaffContact: Validation<string>;
}*/

/*function getClosingAt(state: Immutable<State>): string {
  return moment(`${state.closingDate.value} ${state.closingTime.value}`, 'YYY-MM-DD HH:mm').toString();
}*/

/*function getValues(state: Immutable<State>): Version {
  return {
    closingAt: getClosingAt(state),
    rfiNumber: state.rfiNumber.value,
    title: state.title.value,
    publicSectorEntity: state.publicSectorEntity.value,
    buyerContact: state.buyerContact.value,
    programStaffContact: state.programStaffContact.value,
    categories: SelectMulti.getValues(state.categories),
    description: '',
    discoveryDay: false,
    addenda: [],
    attachments: []
  };
}*/

export const init: Init<Params, State> = async ({ isEditing, existingRfi }) => {
  const result = await api.readManyUsers();
  let buyers: PublicUser[] = [];
  let programStaff: PublicUser[] = [];
  if (result.tag === 'valid') {
    // Function to sort users by name.
    const comparator = (a: PublicUser, b: PublicUser): number => {
      const aName = profileToName(a.profile) || FALLBACK_NAME;
      const bName = profileToName(b.profile) || FALLBACK_NAME;
      return aName.localeCompare(bName, 'en', { sensitivity: 'base' });
    };
    // Function to filter users by type.
    const predicate = (userType: UserType): ((user: PublicUser) => boolean) => {
      return user => user.profile.type === userType;
    };
    buyers = result.value.items.filter(predicate(UserType.Buyer)).sort(comparator);
    programStaff = result.value.items.filter(predicate(UserType.ProgramStaff)).sort(comparator);
  }
  const userToOption = (user: PublicUser): SelectMulti.Option => {
    return {
      value: user._id,
      label: profileToName(user.profile) || FALLBACK_NAME
    };
  };
  return {
    loading: 0,
    isEditing,
    buyers,
    programStaff,
    rfiNumber: ShortText.init({
      id: 'rfi-number',
      required: true,
      type: 'text',
      label: 'Request for Information (RFI) Number',
      placeholder: 'RFI Number',
      value: getString(existingRfi, 'rfiNumber')
    }),
    title: ShortText.init({
      id: 'rfi-title',
      required: true,
      type: 'text',
      label: 'Project Title',
      placeholder: 'Project Title',
      value: getString(existingRfi, 'title')
    }),
    publicSectorEntity: ShortText.init({
      id: 'rfi-public-sector-entity',
      required: true,
      type: 'text',
      label: 'Public Sector Entity',
      placeholder: 'Public Sector Entity',
      value: getString(existingRfi, 'publicSectorEntity')
    }),
    closingDate: DateTime.init({
      id: 'rfi-closing-date',
      type: 'date',
      required: true,
      label: 'Closing Date',
      // value: getString(existingRfi, 'closingAt'),
      value: ''
    }),
    closingTime: DateTime.init({
      id: 'rfi-closing-time',
      type: 'time',
      required: true,
      label: 'Closing Time',
      // value: getString(existingRfi, 'closingAt'),
      value: '14:00'
    }),
    buyerContact: Select.init({
      id: 'rfi-buyer-contact',
      value: '',
      required: true,
      label: `${userTypeToTitleCase(UserType.Buyer)} Contact`,
      unselectedLabel: `Select ${userTypeToTitleCase(UserType.Buyer)}`,
      options: buyers.map(userToOption)
    }),
    programStaffContact: Select.init({
      id: 'rfi-program-staff-contact',
      value: '',
      required: true,
      label: `${userTypeToTitleCase(UserType.ProgramStaff)} Contact`,
      unselectedLabel: `Select ${userTypeToTitleCase(UserType.ProgramStaff)}`,
      options: programStaff.map(userToOption)
    }),
    categories: immutable(await SelectMulti.init({
      options: AVAILABLE_CATEGORIES.toJS().map(value => ({ label: value, value })),
      unselectedLabel: 'Select Commodity Code',
      formFieldMulti: {
        idNamespace: 'rfi-categories',
        label: 'Commodity Code(s)',
        required: true,
        fields: [{
          value: '',
          errors: [],
          removable: false
        }]
      }
    })),
    description: false,
    discoveryDay: false,
    attachments: false,
    addenda: false
  };
};

export const update: Update<State, Msg> = (state, msg) => {
  switch (msg.tag) {
    case 'onChangeRfiNumber':
      return [updateValue(state, 'rfiNumber', msg.value)];
    case 'onChangeTitle':
      return [updateValue(state, 'title', msg.value)];
    case 'onChangePublicSectorEntity':
      return [updateValue(state, 'publicSectorEntity', msg.value)];
    case 'onChangeClosingDate':
      return [updateValue(state, 'closingDate', msg.value)];
    case 'onChangeClosingTime':
      return [updateValue(state, 'closingTime', msg.value)];
    case 'onChangeBuyerContact':
      state = updateValue(state, 'buyerContact', msg.value);
      if (!state.publicSectorEntity.value) {
        const buyer = find(state.buyers, { _id: msg.value });
        if (buyer && buyer.profile.type === UserType.Buyer) {
          state = state.setIn(['publicSectorEntity', 'value'], buyer.profile.publicSectorEntity);
        }
      }
      return [validateValue(state, 'buyerContact', validateBuyerContact)];
    case 'onChangeProgramStaffContact':
      state = updateValue(state, 'programStaffContact', msg.value);
      return [validateValue(state, 'programStaffContact', validateProgramStaffContact)];
    case 'onChangeCategories':
      state = updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'categories', value }),
        childStatePath: ['categories'],
        childUpdate: SelectMulti.update,
        childMsg: msg.value
      })[0];
      const validatedCategories = validateCategories(SelectMulti.getValues(state.categories), 'Commodity Code');
      state = state.set('categories', SelectMulti.setErrors(state.categories, getInvalidValue(validatedCategories, [])));
      return [state];
    case 'validateRfiNumber':
      return [validateValue(state, 'rfiNumber', validateRfiNumber)];
    case 'validateTitle':
      return [validateValue(state, 'title', validateTitle)];
    case 'validatePublicSectorEntity':
      return [validateValue(state, 'publicSectorEntity', validatePublicSectorEntity)];
    case 'validateClosingDate':
      return [validateValue(state, 'closingDate', validateClosingDate)];
    case 'validateClosingTime':
      return [validateValue(state, 'closingTime', validateClosingTime)];
    default:
      return [state];
  }
};

function updateValue(state: Immutable<State>, key: string, value: string): Immutable<State> {
  return state.setIn([key, 'value'], value);
}

function validateClosingDate(raw: string): Validation<Date> {
  const minDate = new Date();
  return validateDate(`${raw} 23:59`, minDate);
}

function validateClosingTime(raw: string): Validation<Date> {
  const minDate = new Date();
  raw = `${minDate.getUTCFullYear()}-${minDate.getUTCMonth() + 1}-${minDate.getUTCDate()} ${raw}`;
  return validateDate(raw, minDate);
}

function validateBuyerContact(raw: string): Validation<string> {
  return raw ? valid(raw) : invalid([`Please select a ${userTypeToTitleCase(UserType.Buyer)}.`]);
}

function validateProgramStaffContact(raw: string): Validation<string> {
  return raw ? valid(raw) : invalid([`Please select a ${userTypeToTitleCase(UserType.ProgramStaff)}.`]);
}

function validateValue(state: Immutable<State>, key: keyof State, validate: (value: string) => Validation<any>): Immutable<State> {
  const validation = validate(state.getIn([key, 'value']));
  return state.setIn([key, 'errors'], getInvalidValue(validation, []));
}

const Details: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const disabled = !state.isEditing;
  const onChangeShortText = (tag: any) => ShortText.makeOnChange(dispatch, e => ({ tag, value: e.currentTarget.value }));
  const onChangeSelect = (tag: any) => Select.makeOnChange(dispatch, e => ({ tag, value: e.currentTarget.value }));
  const onChangeDebounced = (tag: any) => () => dispatch({ tag, value: undefined });
  const dispatchCategories: Dispatch<SelectMulti.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'onChangeCategories' as 'onChangeCategories', value }));
  return (
    <div className='mb-3'>
      <Row>
        <Col xs='12'>
          <FormSectionHeading text='Details' />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='4'>
          <ShortText.view
            state={state.rfiNumber}
            disabled={disabled}
            onChangeDebounced={onChangeDebounced('validateRfiNumber')}
            onChange={onChangeShortText('onChangeRfiNumber')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='10'>
          <ShortText.view
            state={state.title}
            disabled={disabled}
            onChangeDebounced={onChangeDebounced('validateTitle')}
            onChange={onChangeShortText('onChangeTitle')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='4'>
          <Select.view
            state={state.buyerContact}
            disabled={disabled}
            onChange={onChangeSelect('onChangeBuyerContact')} />
        </Col>
        <Col xs='12' md='6'>
          <ShortText.view
            state={state.publicSectorEntity}
            disabled={disabled}
            onChangeDebounced={onChangeDebounced('validatePublicSectorEntity')}
            onChange={onChangeShortText('onChangePublicSectorEntity')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='4'>
          <Select.view
            state={state.programStaffContact}
            disabled={disabled}
            onChange={onChangeSelect('onChangeProgramStaffContact')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='6'>
          <SelectMulti.view
            state={state.categories}
            dispatch={dispatchCategories}
            disabled={disabled} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='3' lg='2'>
          <DateTime.view
            state={state.closingDate}
            disabled={disabled}
            onChangeDebounced={onChangeDebounced('validateClosingDate')}
            onChange={onChangeShortText('onChangeClosingDate')} />
        </Col>
        <Col xs='12' md='2'>
          <DateTime.view
            state={state.closingTime}
            disabled={disabled}
            onChangeDebounced={onChangeDebounced('validateClosingTime')}
            onChange={onChangeShortText('onChangeClosingTime')} />
        </Col>
      </Row>
    </div>
  );
};

const Description: ComponentView<State, Msg> = ({ state, dispatch }) => {
  return (
    <div>
      <Row>
        <Col xs='12'>
          <FormSectionHeading text='Description'>
            <p>Describe the RFI using Markdown.</p>
          </FormSectionHeading>
        </Col>
      </Row>
    </div>
  );
};

export const view: ComponentView<State, Msg> = props => {
  return (
    <div>
      <Details {...props} />
      <Description {...props} />
    </div>
  );
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
