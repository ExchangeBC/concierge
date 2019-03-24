import { Page } from 'front-end/lib/app/types';
import * as FileMulti from 'front-end/lib/components/input/file-multi';
import * as LongTextMulti from 'front-end/lib/components/input/long-text-multi';
import * as SelectMulti from 'front-end/lib/components/input/select-multi';
import { Component, ComponentMsg, ComponentView, Dispatch, immutable, Immutable, Init, mapComponentDispatch, Update, updateComponentChild } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
// import { validateObjectIdString } from 'front-end/lib/validators';
import FormSectionHeading from 'front-end/lib/views/form-section-heading';
import * as DateTime from 'front-end/lib/views/input/datetime';
import * as LongText from 'front-end/lib/views/input/long-text';
import * as Select from 'front-end/lib/views/input/select';
import * as ShortText from 'front-end/lib/views/input/short-text';
import * as Switch from 'front-end/lib/views/input/switch';
import { find, get } from 'lodash';
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
import { validateDescription, validatePublicSectorEntity, validateRfiNumber, validateTitle } from 'shared/lib/validators/request-for-information';

const FALLBACK_NAME = 'No Name Provided';

export interface Params {
  isEditing: boolean;
  existingRfi?: PublicRfi;
}

export type InnerMsg
  = ADT<'onChangeRfiNumber', string>
  | ADT<'onChangeTitle', string>
  | ADT<'onChangePublicSectorEntity', string>
  | ADT<'onChangeDescription', string>
  | ADT<'onChangeDiscoveryDay', boolean>
  | ADT<'onChangeClosingDate', string>
  | ADT<'onChangeClosingTime', string>
  | ADT<'onChangeBuyerContact', string>
  | ADT<'onChangeProgramStaffContact', string>
  | ADT<'onChangeCategories', SelectMulti.Msg>
  | ADT<'onChangeAttachments', FileMulti.Msg>
  | ADT<'onChangeAddenda', LongTextMulti.Msg>
  | ADT<'validateRfiNumber'>
  | ADT<'validateTitle'>
  | ADT<'validatePublicSectorEntity'>
  | ADT<'validateDescription'>
  | ADT<'validateDiscoveryDay'>
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
  description: LongText.State;
  discoveryDay: Switch.State;
  closingDate: DateTime.State;
  closingTime: DateTime.State;
  buyerContact: Select.State;
  programStaffContact: Select.State;
  categories: Immutable<SelectMulti.State>;
  attachments: Immutable<FileMulti.State>;
  addenda: Immutable<LongTextMulti.State>;
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
    description: LongText.init({
      id: 'rfi-description',
      required: true,
      label: 'RFI Description',
      placeholder: 'Here is a list of suggested sections to include in the RFI description:\n- Business Requirement(s) or Issue(s);\n- Brief Ministry Overview;\n- Objectives of the RFI;\n- Ministry Obligations; and,\n- Response Instructions.',
      value: getString(existingRfi, 'description')
    }),
    discoveryDay: Switch.init({
      id: 'rfi-discovery-day',
      label: 'Additional Response Option(s) (Optional)',
      value: get(existingRfi, 'discoveryDay', false),
      inlineLabel: 'This RFI is (or will be) associated with a Discovery Day session.'
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
    attachments: immutable(await FileMulti.init({
      formFieldMulti: {
        idNamespace: 'rfi-categories',
        label: 'Attachments (Optional)',
        labelClassName: 'h3 mb-4',
        required: false,
        fields: []
      }
    })),
    addenda: immutable(await LongTextMulti.init({
      addButtonText: 'Add Attachment',
      field: {
        label: 'Addendum',
        placeholder: 'Additional information related to the RFI.',
        textareaStyle: {
          height: '120px'
        }
      },
      formFieldMulti: {
        idNamespace: 'rfi-addenda',
        label: 'Addenda (Optional)',
        labelClassName: 'h3 mb-4',
        required: false,
        fields: []
      }
    }))
  };
};

export const update: Update<State, Msg> = (state, msg) => {
  switch (msg.tag) {
    case 'onChangeRfiNumber':
      return [updateStringValue(state, 'rfiNumber', msg.value)];
    case 'onChangeTitle':
      return [updateStringValue(state, 'title', msg.value)];
    case 'onChangePublicSectorEntity':
      return [updateStringValue(state, 'publicSectorEntity', msg.value)];
    case 'onChangeDescription':
      return [updateStringValue(state, 'description', msg.value)];
    case 'onChangeDiscoveryDay':
      return [updateBooleanValue(state, 'discoveryDay', msg.value)];
    case 'onChangeClosingDate':
      return [updateStringValue(state, 'closingDate', msg.value)];
    case 'onChangeClosingTime':
      return [updateStringValue(state, 'closingTime', msg.value)];
    case 'onChangeBuyerContact':
      state = updateStringValue(state, 'buyerContact', msg.value);
      if (!state.publicSectorEntity.value) {
        const buyer = find(state.buyers, { _id: msg.value });
        if (buyer && buyer.profile.type === UserType.Buyer) {
          state = state.setIn(['publicSectorEntity', 'value'], buyer.profile.publicSectorEntity);
        }
      }
      return [validateValue(state, 'buyerContact', validateBuyerContact)];
    case 'onChangeProgramStaffContact':
      state = updateStringValue(state, 'programStaffContact', msg.value);
      return [validateValue(state, 'programStaffContact', validateProgramStaffContact)];
    case 'onChangeCategories':
      state = updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'onChangeCategories', value }),
        childStatePath: ['categories'],
        childUpdate: SelectMulti.update,
        childMsg: msg.value
      })[0];
      const validatedCategories = validateCategories(SelectMulti.getValues(state.categories), 'Commodity Code');
      state = state.set('categories', SelectMulti.setErrors(state.categories, getInvalidValue(validatedCategories, [])));
      return [state];
    case 'onChangeAttachments':
      state = updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'onChangeAttachments', value }),
        childStatePath: ['attachments'],
        childUpdate: FileMulti.update,
        childMsg: msg.value
      })[0];
      // tslint:disable:next-line no-console
      console.log(FileMulti.getValues(state.attachments));
      return [state];
    case 'onChangeAddenda':
      state = updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'onChangeAddenda', value }),
        childStatePath: ['addenda'],
        childUpdate: LongTextMulti.update,
        childMsg: msg.value
      })[0];
      // tslint:disable:next-line no-console
      console.log(LongTextMulti.getValues(state.addenda));
      return [state];
    case 'validateRfiNumber':
      return [validateValue(state, 'rfiNumber', validateRfiNumber)];
    case 'validateTitle':
      return [validateValue(state, 'title', validateTitle)];
    case 'validatePublicSectorEntity':
      return [validateValue(state, 'publicSectorEntity', validatePublicSectorEntity)];
    case 'validateDescription':
      return [validateValue(state, 'description', validateDescription)];
    case 'validateClosingDate':
      return [validateValue(state, 'closingDate', validateClosingDate)];
    case 'validateClosingTime':
      return [validateValue(state, 'closingTime', validateClosingTime)];
    default:
      return [state];
  }
};

function updateStringValue(state: Immutable<State>, key: string, value: string): Immutable<State> {
  return state.setIn([key, 'value'], value);
}

function updateBooleanValue(state: Immutable<State>, key: string, value: boolean): Immutable<State> {
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
  const isDisabled = !state.isEditing;
  const onChangeShortText = (tag: any) => ShortText.makeOnChange(dispatch, e => ({ tag, value: e.currentTarget.value }));
  const onChangeSelect = (tag: any) => Select.makeOnChange(dispatch, e => ({ tag, value: e.currentTarget.value }));
  const onChangeDebounced = (tag: any) => () => dispatch({ tag, value: undefined });
  const dispatchCategories: Dispatch<SelectMulti.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'onChangeCategories' as 'onChangeCategories', value }));
  return (
    <div className='mb-4'>
      <Row>
        <Col xs='12'>
          <FormSectionHeading text='Details' />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='4'>
          <ShortText.view
            state={state.rfiNumber}
            disabled={isDisabled}
            onChangeDebounced={onChangeDebounced('validateRfiNumber')}
            onChange={onChangeShortText('onChangeRfiNumber')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='10'>
          <ShortText.view
            state={state.title}
            disabled={isDisabled}
            onChangeDebounced={onChangeDebounced('validateTitle')}
            onChange={onChangeShortText('onChangeTitle')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='4'>
          <Select.view
            state={state.buyerContact}
            disabled={isDisabled}
            onChange={onChangeSelect('onChangeBuyerContact')} />
        </Col>
        <Col xs='12' md='6'>
          <ShortText.view
            state={state.publicSectorEntity}
            disabled={isDisabled}
            onChangeDebounced={onChangeDebounced('validatePublicSectorEntity')}
            onChange={onChangeShortText('onChangePublicSectorEntity')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='4'>
          <Select.view
            state={state.programStaffContact}
            disabled={isDisabled}
            onChange={onChangeSelect('onChangeProgramStaffContact')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='6'>
          <SelectMulti.view
            state={state.categories}
            dispatch={dispatchCategories}
            disabled={isDisabled} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='3' lg='2'>
          <DateTime.view
            state={state.closingDate}
            disabled={isDisabled}
            onChangeDebounced={onChangeDebounced('validateClosingDate')}
            onChange={onChangeShortText('onChangeClosingDate')} />
        </Col>
        <Col xs='12' md='2'>
          <DateTime.view
            state={state.closingTime}
            disabled={isDisabled}
            onChangeDebounced={onChangeDebounced('validateClosingTime')}
            onChange={onChangeShortText('onChangeClosingTime')} />
        </Col>
      </Row>
    </div>
  );
};

const Description: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const isDisabled = !state.isEditing;
  const onChangeLongText = (tag: any) => LongText.makeOnChange(dispatch, e => ({ tag, value: e.currentTarget.value }));
  const onChangeSwitch = (tag: any) => Switch.makeOnChange(dispatch, e => ({ tag, value: e.currentTarget.checked }));
  const onChangeDebounced = (tag: any) => () => dispatch({ tag, value: undefined });
  return (
    <div className='mb-4'>
      <Row>
        <Col xs='12'>
          <FormSectionHeading text='Description'>
            <p>Use <a href='https://www.markdownguide.org/cheat-sheet' target='_blank'>Markdown</a> to describe the RFI.</p>
          </FormSectionHeading>
        </Col>
      </Row>
      <Row className='mb-3'>
        <Col xs='12'>
          <LongText.view
            state={state.description}
            disabled={isDisabled}
            onChangeDebounced={onChangeDebounced('validateDescription')}
            onChange={onChangeLongText('onChangeDescription')}
            style={{ height: '50vh', minHeight: '400px' }} />
        </Col>
      </Row>
      <Row>
        <Col xs='12'>
          <Switch.view
            state={state.discoveryDay}
            disabled={isDisabled}
            onChange={onChangeSwitch('onChangeDiscoveryDay')}
            labelClassName='h4 mb-3' />
        </Col>
      </Row>
    </div>
  );
};

const Attachments: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const isDisabled = !state.isEditing;
  const dispatchAttachments: Dispatch<FileMulti.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'onChangeAttachments' as 'onChangeAttachments', value }));
  return (
    <div className='pb-4 border-bottom mb-5'>
      <Row className='mb-3'>
        <Col xs='12' md='6'>
          <FileMulti.view
            state={state.attachments}
            dispatch={dispatchAttachments}
            disabled={isDisabled} />
        </Col>
      </Row>
    </div>
  );
};

const Addenda: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const isDisabled = !state.isEditing;
  const dispatchAddenda: Dispatch<LongTextMulti.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'onChangeAddenda' as 'onChangeAddenda', value }));
  return (
    <div className='mb-4'>
      <Row>
        <Col xs='12'>
          <LongTextMulti.view
            state={state.addenda}
            dispatch={dispatchAddenda}
            disabled={isDisabled} />
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
      <Attachments {...props} />
      <Addenda {...props} />
    </div>
  );
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
