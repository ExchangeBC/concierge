import { Route } from 'front-end/lib/app/types';
import * as FileMulti from 'front-end/lib/components/input/file-multi';
import * as LongTextMulti from 'front-end/lib/components/input/long-text-multi';
import * as SelectMulti from 'front-end/lib/components/input/select-multi';
import { Component, ComponentView, Dispatch, GlobalComponentMsg, immutable, Immutable, Init, mapComponentDispatch, Update, updateComponentChild } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import FormSectionHeading from 'front-end/lib/views/form-section-heading';
import * as DateTime from 'front-end/lib/views/input/datetime';
import * as LongText from 'front-end/lib/views/input/long-text';
import * as Select from 'front-end/lib/views/input/select';
import * as ShortText from 'front-end/lib/views/input/short-text';
import * as Switch from 'front-end/lib/views/input/switch';
import { find, get } from 'lodash';
import { default as React } from 'react';
import { Col, Row } from 'reactstrap';
import AVAILABLE_CATEGORIES from 'shared/data/categories';
import { getString, rawFormatDate } from 'shared/lib';
import * as FileResource from 'shared/lib/resources/file';
import * as RfiResource from 'shared/lib/resources/request-for-information';
import { PublicRfi } from 'shared/lib/resources/request-for-information';
import { PublicUser } from 'shared/lib/resources/user';
import { Addendum, ADT, Omit, profileToName, UserType, userTypeToTitleCase } from 'shared/lib/types';
import { getInvalidValue, invalid, valid, validateCategories, Validation } from 'shared/lib/validators';
import { validateAddendumDescriptions, validateClosingDate, validateClosingTime, validateDescription, validatePublicSectorEntity, validateRfiNumber, validateTitle } from 'shared/lib/validators/request-for-information';

const FALLBACK_NAME = 'No Name Provided';
const DEFAULT_CLOSING_TIME = '14:00';

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

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

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

export interface Values extends Omit<api.CreateRfiRequestBody, 'attachments'> {
  attachments: FileMulti.Value[];
}

export function getValues(state: State, includeDeletedAddenda = false): Values {
  return {
    rfiNumber: state.rfiNumber.value,
    title: state.title.value,
    publicSectorEntity: state.publicSectorEntity.value,
    description: state.description.value,
    discoveryDay: state.discoveryDay.value,
    closingDate: state.closingDate.value,
    closingTime: state.closingTime.value,
    buyerContact: state.buyerContact.value,
    programStaffContact: state.programStaffContact.value,
    categories: SelectMulti.getValues(state.categories),
    attachments: FileMulti.getValues(state.attachments),
    addenda: LongTextMulti.getValuesAsStrings(state.addenda, RfiResource.DELETE_ADDENDUM_TOKEN)
  };
}

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
    // Function to filter users by type, whether they have accepted terms, and active status.
    const isActiveAndMatchesUserType = (user: PublicUser, userType: UserType) => user.profile.type === userType && user.active;
    const predicate = (userType: UserType): ((user: PublicUser) => boolean) => {
      switch (userType) {
        case UserType.Buyer:
          return user => isActiveAndMatchesUserType(user, userType) && !!user.acceptedTermsAt;
        case UserType.ProgramStaff:
          return user => isActiveAndMatchesUserType(user, userType);
        case UserType.Vendor:
          return () => false;
      }
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
  const getRfiString = (k: string | string[]): string => getString(existingRfi, ['latestVersion'].concat(k));
  const rawClosingAt = getRfiString('closingAt');
  const closingDateValue = rawClosingAt ? rawFormatDate(new Date(rawClosingAt), 'YYYY-MM-DD', false) : '';
  const closingTimeValue = rawClosingAt ? rawFormatDate(new Date(rawClosingAt), 'HH:mm', false) : DEFAULT_CLOSING_TIME;
  const existingCategoryFields = get(existingRfi, ['latestVersion', 'categories'], [])
    .map((value: string, index: number) => {
      return {
        value,
        errors: [],
        removable: index !== 0
      };
    });
  const existingAddenda = get(existingRfi, ['latestVersion', 'addenda'], [])
    .map((value: Addendum, index: number) => {
      return {
        value: LongTextMulti.makeExistingValue(value.description),
        errors: [],
        removable: true
      };
    });
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
      value: getRfiString('rfiNumber')
    }),
    title: ShortText.init({
      id: 'rfi-title',
      required: true,
      type: 'text',
      label: 'Project Title',
      placeholder: 'Project Title',
      value: getRfiString('title')
    }),
    publicSectorEntity: ShortText.init({
      id: 'rfi-public-sector-entity',
      required: true,
      type: 'text',
      label: 'Public Sector Entity',
      placeholder: 'Public Sector Entity',
      value: getRfiString('publicSectorEntity')
    }),
    description: LongText.init({
      id: 'rfi-description',
      required: true,
      label: 'RFI Description',
      placeholder: 'Suggested sections for an RFI\'s description:\n- Business Requirement(s) or Issue(s);\n- Brief Ministry Overview;\n- Objectives of the RFI;\n- Ministry Obligations; and,\n- Response Instructions.',
      value: getRfiString('description')
    }),
    discoveryDay: Switch.init({
      id: 'rfi-discovery-day',
      label: 'Additional Response Option(s) (Optional)',
      value: get(existingRfi, ['latestVersion', 'discoveryDay'], false),
      inlineLabel: 'This RFI is (or will be) associated with a Discovery Day session.'
    }),
    closingDate: DateTime.init({
      id: 'rfi-closing-date',
      type: 'date',
      required: true,
      label: 'Closing Date',
      value: closingDateValue
    }),
    closingTime: DateTime.init({
      id: 'rfi-closing-time',
      type: 'time',
      required: true,
      label: 'Closing Time',
      value: closingTimeValue
    }),
    buyerContact: Select.init({
      id: 'rfi-buyer-contact',
      value: getRfiString(['buyerContact', '_id']),
      required: true,
      label: `${userTypeToTitleCase(UserType.Buyer)} Contact`,
      unselectedLabel: `Select ${userTypeToTitleCase(UserType.Buyer)}`,
      options: buyers.map(userToOption)
    }),
    programStaffContact: Select.init({
      id: 'rfi-program-staff-contact',
      value: getRfiString(['programStaffContact', '_id']),
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
        fields: existingCategoryFields.length ? existingCategoryFields : [{
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
        fields: get(existingRfi, ['latestVersion', 'attachments'], [])
          .map((attachment: FileResource.PublicFile) => {
            return {
              value: FileMulti.makeExistingValue(attachment),
              errors: []
            };
          })
      }
    })),
    addenda: immutable(await LongTextMulti.init({
      addButtonText: 'Add Addendum',
      field: {
        label: 'Addendum',
        placeholder: 'Additional information related to the RFI.',
        textAreaStyle: {
          height: '120px'
        }
      },
      formFieldMulti: {
        idNamespace: 'rfi-addenda',
        label: 'Addenda (Optional)',
        labelClassName: 'h3 mb-4',
        required: false,
        reverseFieldOrderInView: true,
        fields: existingAddenda
      }
    }))
  };
};

export const update: Update<State, Msg> = ({ state, msg }) => {
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
          state = validateValue(state, 'publicSectorEntity', validatePublicSectorEntity);
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
      // No need to validate attachments as FileMulti
      // is fairly 'intelligent' about file names,
      // and handles file size constraint validation as-is.
      return [state];
    case 'onChangeAddenda':
      state = updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'onChangeAddenda', value }),
        childStatePath: ['addenda'],
        childUpdate: LongTextMulti.update,
        childMsg: msg.value
      })[0];
      const validatedAddenda = validateAddendumDescriptions(LongTextMulti.getValuesAsStrings(state.addenda, RfiResource.DELETE_ADDENDUM_TOKEN));
      state = state.set('addenda', LongTextMulti.setErrors(state.addenda, getInvalidValue(validatedAddenda, [])));
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
      return [validateClosingDateAndTime(state)];
    case 'validateClosingTime':
      return [validateClosingDateAndTime(state)];
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

function validateClosingDateAndTime(state: Immutable<State>): Immutable<State> {
  state = validateValue(state, 'closingDate', validateClosingDate);
  return validateValue(state, 'closingTime', v => validateClosingTime(v, state.closingDate.value));
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

export function setErrors(state: Immutable<State>, errors: RfiResource.CreateValidationErrors): Immutable<State> {
  return state
    // TODO use separate error fields.
    .setIn(['closingDate', 'errors'], errors.closingDate || [])
    .setIn(['closingTime', 'errors'], errors.closingTime || [])
    .setIn(['rfiNumber', 'errors'], errors.rfiNumber || [])
    .setIn(['title', 'errors'], errors.title || [])
    .setIn(['description', 'errors'], errors.description || [])
    .setIn(['publicSectorEntity', 'errors'], errors.publicSectorEntity || [])
    .setIn(['discoveryDay', 'errors'], errors.discoveryDay || [])
    .setIn(['buyerContact', 'errors'], errors.buyerContact || [])
    .setIn(['programStaffContact', 'errors'], errors.programStaffContact || [])
    .set('categories', SelectMulti.setErrors(state.categories, errors.categories || []))
    .set('addenda', LongTextMulti.setErrors(state.addenda, errors.addenda || []))
    .set('attachments', FileMulti.setErrors(state.attachments, errors.attachments || []));
}

export function isValid(state: State): boolean {
  const {
    rfiNumber,
    title,
    publicSectorEntity,
    description,
    closingDate,
    closingTime,
    buyerContact,
    programStaffContact,
    categories,
    attachments,
    addenda
  } = state;
  const providedRequiredFields = !!(rfiNumber.value && title.value && publicSectorEntity.value && description.value && closingDate.value && closingTime.value && buyerContact.value && programStaffContact.value);
  const noValidationErrors = !(rfiNumber.errors.length || title.errors.length || publicSectorEntity.errors.length || description.errors.length || closingDate.errors.length || closingTime.errors.length || buyerContact.errors.length || programStaffContact.errors.length);
  return providedRequiredFields && noValidationErrors && SelectMulti.isValid(categories) && FileMulti.isValid(attachments) && LongTextMulti.isValid(addenda);
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
        <Col xs='12' md='8' lg='7'>
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
            <p className='mb-0'>Use <a href='https://www.markdownguide.org/cheat-sheet' target='_blank'>Markdown</a> to describe the RFI.</p>
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
        <Col xs='12' md='7' lg='6'>
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
