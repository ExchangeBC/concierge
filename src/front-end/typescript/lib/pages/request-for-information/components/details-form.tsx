import { MARKDOWN_HELP_URL } from 'front-end/config';
import * as FormField from 'front-end/lib/components/form-field';
import * as FileMulti from 'front-end/lib/components/form-field-multi/file';
import * as FormFieldMulti from 'front-end/lib/components/form-field-multi/lib/index';
import * as LongTextMulti from 'front-end/lib/components/form-field-multi/long-text';
import * as SelectMulti from 'front-end/lib/components/form-field-multi/select';
import * as RichMarkdownEditor from 'front-end/lib/components/form-field/rich-markdown-editor';
import { Component, ComponentView, Dispatch, immutable, Immutable, Init, mapComponentDispatch, Update, updateComponentChild } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import * as DateTime from 'front-end/lib/views/form-field/datetime';
import * as NumberInput from 'front-end/lib/views/form-field/number';
import * as Select from 'front-end/lib/views/form-field/select';
import * as ShortText from 'front-end/lib/views/form-field/short-text';
import FormSectionHeading from 'front-end/lib/views/form-section-heading';
import Link from 'front-end/lib/views/link';
import { find, get } from 'lodash';
import { default as React } from 'react';
import { Col, Row } from 'reactstrap';
import AVAILABLE_CATEGORIES from 'shared/data/categories';
import { getString, rawFormatDate } from 'shared/lib';
import * as FileResource from 'shared/lib/resources/file';
import * as RfiResource from 'shared/lib/resources/request-for-information';
import { PublicRfi } from 'shared/lib/resources/request-for-information';
import { PublicUser } from 'shared/lib/resources/user';
import { Addendum, ADT, Omit, profileToName, UserType, userTypeToTitleCase, VerificationStatus } from 'shared/lib/types';
import { getInvalidValue, invalid, valid, validateCategories, Validation } from 'shared/lib/validators';
import { MAX_GRACE_PERIOD_DAYS, MIN_GRACE_PERIOD_DAYS, validateAddendumDescriptions, validateClosingDate, validateClosingTime, validateDescription, validateGracePeriodDays, validatePublicSectorEntity, validateRfiNumber, validateTitle } from 'shared/lib/validators/request-for-information';

const DEFAULT_CLOSING_TIME = '14:00';

export const TAB_NAME = 'Details';

export interface Params {
  isEditing: boolean;
  existingRfi?: PublicRfi;
}

type HelpFieldName = 'addenda';

export type Msg =
  | ADT<'onChangeRfiNumber', string>
  | ADT<'onChangeTitle', string>
  | ADT<'onChangePublicSectorEntity', string>
  | ADT<'onChangeDescription', RichMarkdownEditor.Msg>
  | ADT<'onChangeClosingDate', string>
  | ADT<'onChangeClosingTime', string>
  | ADT<'onChangeGracePeriodDays', NumberInput.Value>
  | ADT<'onChangeBuyerContact', Select.Value>
  | ADT<'onChangeProgramStaffContact', Select.Value>
  | ADT<'onChangeCategories', SelectMulti.Msg>
  | ADT<'onChangeAttachments', FileMulti.Msg>
  | ADT<'onChangeAddenda', LongTextMulti.Msg>
  | ADT<'validateRfiNumber'>
  | ADT<'validateTitle'>
  | ADT<'validatePublicSectorEntity'>
  | ADT<'validateClosingDate'>
  | ADT<'validateClosingTime'>
  | ADT<'validateGracePeriodDays'>
  | ADT<'toggleHelp', HelpFieldName>;

type FormFieldKeys = 'rfiNumber' | 'title' | 'publicSectorEntity' | 'closingDate' | 'closingTime' | 'gracePeriodDays' | 'buyerContact' | 'programStaffContact';

export interface State {
  loading: number;
  isEditing: boolean;
  buyers: PublicUser[];
  programStaff: PublicUser[];
  rfiNumber: ShortText.State;
  title: ShortText.State;
  publicSectorEntity: ShortText.State;
  description: Immutable<RichMarkdownEditor.State>;
  closingDate: DateTime.State;
  closingTime: DateTime.State;
  gracePeriodDays: NumberInput.State;
  buyerContact: Select.State;
  programStaffContact: Select.State;
  categories: Immutable<SelectMulti.State>;
  attachments: Immutable<FileMulti.State>;
  addenda: Immutable<LongTextMulti.State>;
}

export interface Values extends Omit<RfiResource.CreateRequestBody, 'attachments' | 'discoveryDay'> {
  attachments: FileMulti.Value[];
}

export function getValues(state: State, includeDeletedAddenda = false): Values {
  return {
    rfiNumber: state.rfiNumber.value,
    title: state.title.value,
    publicSectorEntity: state.publicSectorEntity.value,
    description: FormField.getValue(state.description),
    closingDate: state.closingDate.value,
    closingTime: state.closingTime.value,
    gracePeriodDays: state.gracePeriodDays.value,
    buyerContact: state.buyerContact.value ? state.buyerContact.value.value : '',
    programStaffContact: state.programStaffContact.value ? state.programStaffContact.value.value : '',
    categories: SelectMulti.getValuesAsStrings(state.categories),
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
      const aName = profileToName(a.profile);
      const bName = profileToName(b.profile);
      return aName.localeCompare(bName, 'en', { sensitivity: 'base' });
    };
    // Function to filter users by type, whether they have accepted terms, and active status.
    const predicate = (userType: UserType): ((user: PublicUser) => boolean) => {
      switch (userType) {
        case UserType.Buyer:
          return (user) => user.profile.type === userType && user.active && !!user.acceptedTermsAt && user.profile.verificationStatus === VerificationStatus.Verified;
        case UserType.ProgramStaff:
          return (user) => user.profile.type === userType && user.active && !!user.acceptedTermsAt;
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
      label: profileToName(user.profile)
    };
  };
  const getRfiString = (k: string | string[]): string => getString(existingRfi, ['latestVersion'].concat(k));
  const rawClosingAt = getRfiString('closingAt');
  const closingDateValue = rawClosingAt ? rawFormatDate(new Date(rawClosingAt), 'YYYY-MM-DD', false) : '';
  const closingTimeValue = rawClosingAt ? rawFormatDate(new Date(rawClosingAt), 'HH:mm', false) : DEFAULT_CLOSING_TIME;
  const existingCategoryFields = get(existingRfi, ['latestVersion', 'categories'], []).map((value: string, index: number): FormFieldMulti.Field<SelectMulti.Value> => {
    return {
      value: { label: value, value },
      errors: []
    };
  });
  const existingAddenda = get(existingRfi, ['latestVersion', 'addenda'], []).map((value: Addendum, index: number) => {
    return {
      value: LongTextMulti.makeExistingValue(value.description),
      errors: []
    };
  });
  const existingBuyerContact = get(existingRfi, ['latestVersion', 'buyerContact'], undefined);
  const existingProgramStaffContactId = get(existingRfi, ['latestVersion', 'programStaffContact', '_id'], undefined);
  const existingProgramStaffContact: PublicUser | undefined = find<PublicUser>(programStaff, { _id: existingProgramStaffContactId });
  const addendaHelpText = 'Additional information related to this RFI.';
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
    description: immutable(
      await RichMarkdownEditor.init({
        id: 'rfi-description',
        value: getRfiString('description'),
        errors: [],
        validate: validateDescription
      })
    ),
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
    gracePeriodDays: NumberInput.init({
      id: 'rfi-grace-period-days',
      required: true,
      label: 'Late Response Grace Period',
      placeholder: '#',
      value: get(existingRfi, ['latestVersion', 'gracePeriodDays'], 2),
      min: String(MIN_GRACE_PERIOD_DAYS),
      max: String(MAX_GRACE_PERIOD_DAYS)
    }),
    buyerContact: Select.init({
      id: 'rfi-buyer-contact',
      value: existingBuyerContact ? userToOption(existingBuyerContact) : undefined,
      required: true,
      label: `${userTypeToTitleCase(UserType.Buyer)} Contact`,
      placeholder: `Select ${userTypeToTitleCase(UserType.Buyer)}`,
      options: {
        tag: 'options',
        value: buyers.map(userToOption)
      }
    }),
    programStaffContact: Select.init({
      id: 'rfi-program-staff-contact',
      value: existingProgramStaffContact ? userToOption(existingProgramStaffContact) : undefined,
      required: true,
      label: `${userTypeToTitleCase(UserType.ProgramStaff)} Contact`,
      placeholder: `Select ${userTypeToTitleCase(UserType.ProgramStaff)}`,
      options: {
        tag: 'options',
        value: programStaff.map(userToOption)
      }
    }),
    categories: immutable(
      await SelectMulti.init({
        options: AVAILABLE_CATEGORIES.toJS().map((value) => ({ label: value, value })),
        placeholder: 'Select Commodity Code',
        formFieldMulti: {
          idNamespace: 'rfi-categories',
          label: 'Commodity Code(s)',
          required: true,
          minFields: 1,
          fields: existingCategoryFields.length
            ? existingCategoryFields
            : [
                {
                  value: undefined,
                  errors: []
                }
              ]
        }
      })
    ),
    attachments: immutable(
      await FileMulti.init({
        formFieldMulti: {
          idNamespace: 'rfi-attachments',
          label: 'Attachments (Optional)',
          required: false,
          fields: get(existingRfi, ['latestVersion', 'attachments'], []).map((attachment: FileResource.PublicFile) => {
            return {
              value: FileMulti.makeExistingValue(attachment),
              errors: []
            };
          })
        }
      })
    ),
    addenda: immutable(
      await LongTextMulti.init({
        addButtonText: 'Add Addendum',
        field: {
          label: 'Addendum',
          placeholder: addendaHelpText,
          textAreaStyle: {
            height: '120px'
          }
        },
        formFieldMulti: {
          idNamespace: 'rfi-addenda',
          label: 'Addenda (Optional)',
          required: false,
          reverseFieldOrderInView: true,
          fields: existingAddenda,
          help: {
            text: addendaHelpText,
            show: false
          }
        }
      })
    )
  };
};

export const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'onChangeRfiNumber':
      return [updateValue(state, 'rfiNumber', msg.value)];
    case 'onChangeTitle':
      return [updateValue(state, 'title', msg.value)];
    case 'onChangePublicSectorEntity':
      return [updateValue(state, 'publicSectorEntity', msg.value)];
    case 'onChangeDescription':
      return updateComponentChild({
        state,
        mapChildMsg: (value) => ({ tag: 'onChangeDescription', value }),
        childStatePath: ['description'],
        childUpdate: RichMarkdownEditor.update,
        childMsg: msg.value
      });
    case 'onChangeClosingDate':
      return [updateValue(state, 'closingDate', msg.value)];
    case 'onChangeClosingTime':
      return [updateValue(state, 'closingTime', msg.value)];
    case 'onChangeGracePeriodDays':
      return [updateValue(state, 'gracePeriodDays', msg.value)];
    case 'onChangeBuyerContact':
      state = updateValue(state, 'buyerContact', msg.value);
      if (!state.publicSectorEntity.value) {
        const buyer = msg.value && find<PublicUser>(state.buyers, { _id: msg.value.value });
        if (buyer && buyer.profile.type === UserType.Buyer) {
          state = state.setIn(['publicSectorEntity', 'value'], buyer.profile.publicSectorEntity);
          state = validateValue(state, 'publicSectorEntity', validatePublicSectorEntity);
        }
      }
      return [validateValue(state, 'buyerContact', validateBuyerContact)];
    case 'onChangeProgramStaffContact':
      state = updateValue(state, 'programStaffContact', msg.value);
      return [validateValue(state, 'programStaffContact', validateProgramStaffContact)];
    case 'onChangeCategories':
      state = updateComponentChild({
        state,
        mapChildMsg: (value) => ({ tag: 'onChangeCategories', value }),
        childStatePath: ['categories'],
        childUpdate: SelectMulti.update,
        childMsg: msg.value
      })[0];
      const validatedCategories = validateCategories(SelectMulti.getValuesAsStrings(state.categories), 'Commodity Code');
      state = state.set('categories', SelectMulti.setErrors(state.categories, getInvalidValue(validatedCategories, [])));
      return [state];
    case 'onChangeAttachments':
      state = updateComponentChild({
        state,
        mapChildMsg: (value) => ({ tag: 'onChangeAttachments', value }),
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
        mapChildMsg: (value) => ({ tag: 'onChangeAddenda', value }),
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
    case 'validateClosingDate':
      return [validateClosingDateAndTime(state)];
    case 'validateClosingTime':
      return [validateClosingDateAndTime(state)];
    case 'validateGracePeriodDays':
      return [validateValue(state, 'gracePeriodDays', validateGracePeriodDays)];
    case 'toggleHelp':
      return [
        (() => {
          switch (msg.value) {
            case 'addenda':
              return state.setIn(['addenda', 'help', 'show'], !state.getIn(['addenda', 'help', 'show']));
          }
        })()
      ];
    default:
      return [state];
  }
};

function updateValue<K extends FormFieldKeys>(state: Immutable<State>, key: K, value: State[K]['value']): Immutable<State> {
  return state.setIn([key, 'value'], value);
}

function validateClosingDateAndTime(state: Immutable<State>): Immutable<State> {
  state = validateValue(state, 'closingDate', validateClosingDate);
  return validateValue(state, 'closingTime', (v) => validateClosingTime(v, state.closingDate.value));
}

function validateBuyerContact(raw: Select.Value): Validation<Select.Value> {
  return raw ? valid(raw) : invalid([`Please select a ${userTypeToTitleCase(UserType.Buyer)}.`]);
}

function validateProgramStaffContact(raw: Select.Value): Validation<Select.Value> {
  return raw ? valid(raw) : invalid([`Please select a ${userTypeToTitleCase(UserType.ProgramStaff)}.`]);
}

function validateValue<K extends FormFieldKeys>(state: Immutable<State>, key: K, validate: (value: State[K]['value']) => Validation<State[K]['value']>): Immutable<State> {
  const validation = validate(state.getIn([key, 'value']));
  return state.setIn([key, 'errors'], getInvalidValue(validation, []));
}

export function setErrors(state: Immutable<State>, errors: RfiResource.CreateValidationErrors): Immutable<State> {
  return state
    .setIn(['closingDate', 'errors'], errors.closingDate || [])
    .setIn(['closingTime', 'errors'], errors.closingTime || [])
    .setIn(['gracePeriodDays', 'errors'], errors.gracePeriodDays || [])
    .setIn(['rfiNumber', 'errors'], errors.rfiNumber || [])
    .setIn(['title', 'errors'], errors.title || [])
    .setIn(['publicSectorEntity', 'errors'], errors.publicSectorEntity || [])
    .setIn(['buyerContact', 'errors'], errors.buyerContact || [])
    .setIn(['programStaffContact', 'errors'], errors.programStaffContact || [])
    .update('description', (desc) => FormField.setErrors(desc, errors.description || []))
    .set('categories', SelectMulti.setErrors(state.categories, errors.categories || []))
    .set('addenda', LongTextMulti.setErrors(state.addenda, errors.addenda || []))
    .set('attachments', FileMulti.setErrors(state.attachments, errors.attachments || []));
}

export function hasProvidedRequiredFields(state: State): boolean {
  const { rfiNumber, title, publicSectorEntity, description, closingDate, closingTime, gracePeriodDays, buyerContact, programStaffContact } = state;
  return !!(rfiNumber.value && title.value && publicSectorEntity.value && FormField.getValue(description) && closingDate.value && closingTime.value && gracePeriodDays.value !== undefined && buyerContact.value && programStaffContact.value);
}

export function hasValidationErrors(state: State): boolean {
  const { rfiNumber, title, publicSectorEntity, description, closingDate, closingTime, gracePeriodDays, buyerContact, programStaffContact, categories, attachments, addenda } = state;
  const errors = !!(rfiNumber.errors.length || title.errors.length || publicSectorEntity.errors.length || closingDate.errors.length || closingTime.errors.length || gracePeriodDays.errors.length || buyerContact.errors.length || programStaffContact.errors.length);
  return errors || !FormField.isValid(description) || !SelectMulti.isValid(categories) || !FileMulti.isValid(attachments) || !LongTextMulti.isValid(addenda);
}

export function isValid(state: State): boolean {
  return hasProvidedRequiredFields(state) && !hasValidationErrors(state);
}

const Details: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const isDisabled = !state.isEditing;
  const onChangeShortText = (tag: any) => ShortText.makeOnChange(dispatch, (value) => ({ tag, value }));
  const onChangeNumberInput = (tag: any) => NumberInput.makeOnChange(dispatch, (value) => ({ tag, value }));
  const onChangeSelect = (tag: any) => Select.makeOnChange(dispatch, (value) => ({ tag, value }));
  const onChangeDebounced = (tag: any) => () => dispatch({ tag, value: undefined });
  const dispatchCategories: Dispatch<SelectMulti.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, (value) => ({ tag: 'onChangeCategories' as const, value }));
  return (
    <div className="mb-4">
      <Row>
        <Col xs="12">
          <FormSectionHeading text="Details" />
        </Col>
      </Row>
      <Row>
        <Col xs="12" md="5" lg="4">
          <ShortText.view state={state.rfiNumber} disabled={isDisabled} onChangeDebounced={onChangeDebounced('validateRfiNumber')} onChange={onChangeShortText('onChangeRfiNumber')} autoFocus />
        </Col>
      </Row>
      <Row>
        <Col xs="12" md="10">
          <ShortText.view state={state.title} disabled={isDisabled} onChangeDebounced={onChangeDebounced('validateTitle')} onChange={onChangeShortText('onChangeTitle')} />
        </Col>
      </Row>
      <Row>
        <Col xs="12" md="4">
          <Select.view state={state.buyerContact} disabled={isDisabled} onChange={onChangeSelect('onChangeBuyerContact')} />
        </Col>
        <Col xs="12" md="6">
          <ShortText.view state={state.publicSectorEntity} disabled={isDisabled} onChangeDebounced={onChangeDebounced('validatePublicSectorEntity')} onChange={onChangeShortText('onChangePublicSectorEntity')} />
        </Col>
      </Row>
      <Row>
        <Col xs="12" md="4">
          <Select.view state={state.programStaffContact} disabled={isDisabled} onChange={onChangeSelect('onChangeProgramStaffContact')} />
        </Col>
      </Row>
      <Row>
        <Col xs="12" md="8" lg="7">
          <SelectMulti.view state={state.categories} dispatch={dispatchCategories} disabled={isDisabled} />
        </Col>
      </Row>
      <Row>
        <Col xs="12" md="3">
          <DateTime.view state={state.closingDate} disabled={isDisabled} onChangeDebounced={onChangeDebounced('validateClosingDate')} onChange={onChangeShortText('onChangeClosingDate')} />
        </Col>
        <Col xs="12" md="3" lg="2">
          <DateTime.view state={state.closingTime} disabled={isDisabled} onChangeDebounced={onChangeDebounced('validateClosingTime')} onChange={onChangeShortText('onChangeClosingTime')} />
        </Col>
        <Col xs="12" md="4">
          <NumberInput.view state={state.gracePeriodDays} disabled={isDisabled} onChangeDebounced={onChangeDebounced('validateGracePeriodDays')} onChange={onChangeNumberInput('onChangeGracePeriodDays')} addon={{ type: 'append', text: 'Days' }} />
        </Col>
      </Row>
    </div>
  );
};

const Description: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const isDisabled = !state.isEditing;
  const dispatchDescription: Dispatch<RichMarkdownEditor.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, (value) => ({ tag: 'onChangeDescription' as const, value }));
  return (
    <div className="mb-4">
      <Row>
        <Col xs="12">
          <FormSectionHeading text="Description">
            <p className="mb-0">
              Use{' '}
              <Link href={MARKDOWN_HELP_URL} newTab>
                Markdown
              </Link>{' '}
              to describe the RFI.
            </p>
          </FormSectionHeading>
        </Col>
      </Row>
      <Row className="mb-3">
        <Col xs="12">
          <RichMarkdownEditor.view state={state.description} dispatch={dispatchDescription} disabled={isDisabled} required label="RFI Description" help={"Suggested sections for this RFI's description: \n(1) Business Requirement(s) or Issue(s); \n(2) Brief Ministry Overview; \n(3) Objectives of this RFI; \n(4) Ministry Obligations; and \n(5) Response Instructions."} style={{ height: '50vh', minHeight: '400px' }} />
        </Col>
      </Row>
    </div>
  );
};

const Attachments: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const isDisabled = !state.isEditing;
  const dispatchAttachments: Dispatch<FileMulti.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, (value) => ({ tag: 'onChangeAttachments' as const, value }));
  return (
    <div className="pb-4 border-bottom mb-5">
      <Row className="mb-3">
        <Col xs="12" md="7" lg="6">
          <FileMulti.view state={state.attachments} dispatch={dispatchAttachments} disabled={isDisabled} labelClassName="h3" labelWrapperClassName="mb-4" />
        </Col>
      </Row>
    </div>
  );
};

const Addenda: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const isDisabled = !state.isEditing;
  const dispatchAddenda: Dispatch<LongTextMulti.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, (value) => ({ tag: 'onChangeAddenda' as const, value }));
  return (
    <div className="mb-4">
      <Row>
        <Col xs="12">
          <LongTextMulti.view state={state.addenda} dispatch={dispatchAddenda} disabled={isDisabled} labelClassName="h3" labelWrapperClassName="mb-4" />
        </Col>
      </Row>
    </div>
  );
};

export const view: ComponentView<State, Msg> = (props) => {
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
