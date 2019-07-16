import { MARKDOWN_HELP_URL } from 'front-end/config';
import { Component, ComponentView, Immutable, Init, Update } from 'front-end/lib/framework';
import * as DateTime from 'front-end/lib/views/form-field/datetime';
import * as LongText from 'front-end/lib/views/form-field/long-text';
import * as ShortText from 'front-end/lib/views/form-field/short-text';
import * as Switch from 'front-end/lib/views/form-field/switch';
import FormSectionHeading from 'front-end/lib/views/form-section-heading';
import Link from 'front-end/lib/views/link';
import { get } from 'lodash';
import { flow } from 'lodash/fp';
import { default as React } from 'react';
import { Col, Row } from 'reactstrap';
import { getString, rawFormatDate } from 'shared/lib';
import * as RfiResource from 'shared/lib/resources/request-for-information';
import { PublicDiscoveryDay } from 'shared/lib/resources/request-for-information';
import { ADT } from 'shared/lib/types';
import { getInvalidValue, valid, Validation } from 'shared/lib/validators';
import { validateDiscoveryDayDate, validateDiscoveryDayDescription, validateDiscoveryDayLocation, validateDiscoveryDayRemoteAccess, validateDiscoveryDayTime, validateDiscoveryDayVenue } from 'shared/lib/validators/request-for-information';

export const TAB_NAME = 'Discovery Day';

export interface Params {
  showToggle: boolean;
  existingDiscoveryDay?: PublicDiscoveryDay;
}

type HelpFieldName
  = 'description'
  | 'location'
  | 'venue'
  | 'remoteAccess';

export type Msg
  = ADT<'onChangeToggle', boolean>
  | ADT<'onChangeDescription', string>
  | ADT<'onChangeDate', string>
  | ADT<'onChangeTime', string>
  | ADT<'onChangeLocation', string>
  | ADT<'onChangeVenue', string>
  | ADT<'onChangeRemoteAccess', string>
  | ADT<'validateDescription'>
  | ADT<'validateDate'>
  | ADT<'validateTime'>
  | ADT<'validateLocation'>
  | ADT<'validateVenue'>
  | ADT<'validateRemoteAccess'>
  | ADT<'toggleHelp', HelpFieldName>;

type FormFieldKeys
  = 'toggle'
  | 'description'
  | 'date'
  | 'time'
  | 'location'
  | 'venue'
  | 'remoteAccess';

export interface State {
  loading: number;
  showToggle: boolean;
  existingDiscoveryDay?: PublicDiscoveryDay;
  isEditing: boolean;
  toggle: Switch.State;
  description: LongText.State;
  date: DateTime.State;
  time: DateTime.State;
  location: ShortText.State;
  venue: ShortText.State;
  remoteAccess: LongText.State;
};

export type Values = RfiResource.CreateDiscoveryDayBody | undefined;

export function getValues(state: State): Values {
  if (state.showToggle && !state.toggle.value) { return undefined; }
  return {
    description: state.description.value,
    date: state.date.value,
    time: state.time.value,
    location: state.location.value,
    venue: state.venue.value,
    remoteAccess: state.remoteAccess.value
  };
}

export const init: Init<Params, State> = async ({ showToggle, existingDiscoveryDay }) => {
  const getDdString = (k: string | string[]): string => getString(existingDiscoveryDay, k);
  const rawOccurringAt = getDdString('occurringAt');
  const dateValue = rawOccurringAt ? rawFormatDate(new Date(rawOccurringAt), 'YYYY-MM-DD', false) : '';
  const timeValue = rawOccurringAt ? rawFormatDate(new Date(rawOccurringAt), 'HH:mm', false) : '';
  const remoteAccessHelpText = 'Dial-in and/or teleconference information that will only be visible to remote attendees.';
  return {
    loading: 0,
    showToggle,
    existingDiscoveryDay,
    isEditing: false,
    toggle: Switch.init({
      id: 'discovery-day-discovery-day',
      value: showToggle && !!existingDiscoveryDay,
      inlineLabel: 'This RFI is associated with a Discovery Day session.'
    }),
    description: LongText.init({
      id: 'discovery-day-description',
      required: true,
      label: 'Description (Optional)',
      placeholder: 'Provide a brief description of the Discovery Day session.',
      value: getDdString('description'),
      help: {
        text: (<span>You can use <Link href={MARKDOWN_HELP_URL} newTab>Markdown</Link> to describe this Discovery Day session.</span>),
        show: false
      }
    }),
    date: DateTime.init({
      id: 'discovery-day-date',
      type: 'date',
      required: true,
      label: 'Date',
      value: dateValue
    }),
    time: DateTime.init({
      id: 'discovery-day-time',
      type: 'time',
      required: true,
      label: 'Time',
      value: timeValue
    }),
    location: ShortText.init({
      id: 'discovery-day-location',
      required: true,
      type: 'text',
      label: 'Location',
      placeholder: 'Visible to all users.',
      value: getDdString('location'),
      help: {
        text: 'The Discovery Day\'s general location that will be visible to all users. For example, "Victoria, BC."',
        show: false
      }
    }),
    venue: ShortText.init({
      id: 'discovery-day-venue',
      required: true,
      type: 'text',
      label: 'Venue',
      placeholder: 'Only visible to in-person attendees.',
      value: getDdString('venue'),
      help: {
        text: 'The Discovery Day\'s specific venue that will only be visible to in-person attendees. For example, "563 Superior St, Victoria, BC, V8V 1T7."',
        show: false
      }
    }),
    remoteAccess: LongText.init({
      id: 'discovery-day-remote-access',
      required: true,
      label: 'Remote Access Info',
      placeholder: remoteAccessHelpText,
      value: getDdString('remoteAccess'),
      help: {
        text: remoteAccessHelpText,
        show: false
      }
    })
  };
};

export const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'onChangeToggle':
      if (msg.value) {
        state = state.set('isEditing', true);
      } else {
        state = state.set('isEditing', false);
      }
      return [updateValue(state, 'toggle', msg.value)];
    case 'onChangeDescription':
      return [updateValue(state, 'description', msg.value)];
    case 'onChangeDate':
      return [updateValue(state, 'date', msg.value)];
    case 'onChangeTime':
      return [updateValue(state, 'time', msg.value)];
    case 'onChangeLocation':
      return [updateValue(state, 'location', msg.value)];
    case 'onChangeVenue':
      return [updateValue(state, 'venue', msg.value)];
    case 'onChangeRemoteAccess':
      return [updateValue(state, 'remoteAccess', msg.value)];
    case 'validateDescription':
      return [validateValue(state, 'description', v => {
        const validation = validateDiscoveryDayDescription(v);
        switch (validation.tag) {
          case 'valid':
            return valid(validation.value || '');
          case 'invalid':
            return validation;
        }
      })];
    case 'validateDate':
      return [validateDateAndTime(state)];
    case 'validateTime':
      return [validateDateAndTime(state)];
    case 'validateLocation':
      return [validateValue(state, 'location', validateDiscoveryDayLocation)];
    case 'validateVenue':
      return [validateValue(state, 'venue', validateDiscoveryDayVenue)];
    case 'validateRemoteAccess':
      return [validateValue(state, 'remoteAccess', validateDiscoveryDayRemoteAccess)];
    case 'toggleHelp':
      return [(() => {
        switch (msg.value) {
          case 'description':
            return state.setIn(['description', 'help', 'show'], !state.getIn(['description', 'help', 'show']));
          case 'location':
            return state.setIn(['location', 'help', 'show'], !state.getIn(['location', 'help', 'show']));
          case 'venue':
            return state.setIn(['venue', 'help', 'show'], !state.getIn(['venue', 'help', 'show']));
          case 'remoteAccess':
            return state.setIn(['remoteAccess', 'help', 'show'], !state.getIn(['remoteAccess', 'help', 'show']));
        }
      })()];
    default:
      return [state];
  }
};

function updateValue<K extends FormFieldKeys>(state: Immutable<State>, key: K, value: State[K]['value']): Immutable<State> {
  return state.setIn([key, 'value'], value);
}

function validateDateAndTime(state: Immutable<State>): Immutable<State> {
  state = validateValue(state, 'date', validateDiscoveryDayDate);
  return validateValue(state, 'time', v => validateDiscoveryDayTime(v, state.date.value));
}

function validateValue<K extends FormFieldKeys>(state: Immutable<State>, key: K, validate: (value: State[K]['value']) => Validation<State[K]['value']>): Immutable<State> {
  const validation = validate(state.getIn([key, 'value']));
  return state.setIn([key, 'errors'], getInvalidValue(validation, []));
}

export function setErrors(state: Immutable<State>, errors: RfiResource.DiscoveryDayValidationErrors): Immutable<State> {
  const setErrors = (k: keyof RfiResource.DiscoveryDayValidationErrors) => (state: Immutable<State>) => state.setIn([k, 'errors'], get(errors, k, []));
  return flow(
    setErrors('description'),
    setErrors('date'),
    setErrors('time'),
    setErrors('location'),
    setErrors('venue'),
    setErrors('remoteAccess')
  )(state);
}

export function hasProvidedRequiredFields(state: State): boolean {
  const {
    showToggle,
    toggle,
    date,
    time,
    location,
    venue,
    remoteAccess
  } = state;
  if (showToggle && !toggle.value) { return true; }
  return !!(date.value && time.value && location.value && venue.value && remoteAccess.value);
}

export function hasValidationErrors(state: State): boolean {
  const {
    showToggle,
    toggle,
    description,
    date,
    time,
    location,
    venue,
    remoteAccess
  } = state;
  if (showToggle && !toggle.value) { return false; }
  return !!(description.errors.length || date.errors.length || time.errors.length || location.errors.length || venue.errors.length || remoteAccess.errors.length);
}

export function isValid(state: State): boolean {
  return hasProvidedRequiredFields(state) && !hasValidationErrors(state);
}

const Toggle: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const onChangeSwitch = (tag: any) => Switch.makeOnChange(dispatch, value => ({ tag, value }));
  return (
    <div className='mb-4'>
      <Row>
        <Col xs='12'>
          <FormSectionHeading text='Discovery Day' />
        </Col>
      </Row>
      {state.showToggle
        ? (<Row>
            <Col xs='12'>
              <Switch.view
                state={state.toggle}
                onChange={onChangeSwitch('onChangeToggle')}
                labelClassName='d-none' />
            </Col>
          </Row>)
        : null}
    </div>
  );
};

const Details: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (!state.toggle.value && !state.existingDiscoveryDay) { return null; }
  const isDisabled = !state.isEditing;
  const onChangeLongText = (tag: any) => LongText.makeOnChange(dispatch, value => ({ tag, value }));
  const onChangeShortText = (tag: any) => ShortText.makeOnChange(dispatch, value => ({ tag, value }));
  const onChangeDebounced = (tag: any) => () => dispatch({ tag, value: undefined });
  const toggleHelp = (value: HelpFieldName) => () => dispatch({ tag: 'toggleHelp', value });
  return (
    <div className='mb-4'>
      {state.showToggle
        ? (<Row className='mb-3'>
            <Col xs='12'>
              <h4>Details</h4>
            </Col>
          </Row>)
        : null}
      <Row>
        <Col xs='12'>
          <LongText.view
            state={state.description}
            disabled={isDisabled}
            onChangeDebounced={onChangeDebounced('validateDescription')}
            onChange={onChangeLongText('onChangeDescription')}
            toggleHelp={toggleHelp('description')}
            style={{ height: '10rem' }}
            autoFocus />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='3'>
          <DateTime.view
            state={state.date}
            disabled={isDisabled}
            onChangeDebounced={onChangeDebounced('validateDate')}
            onChange={onChangeShortText('onChangeDate')} />
        </Col>
        <Col xs='12' md='3' lg='2'>
          <DateTime.view
            state={state.time}
            disabled={isDisabled}
            onChangeDebounced={onChangeDebounced('validateTime')}
            onChange={onChangeShortText('onChangeTime')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='5' lg='4'>
          <ShortText.view
            state={state.location}
            disabled={isDisabled}
            toggleHelp={toggleHelp('location')}
            onChangeDebounced={onChangeDebounced('validateLocation')}
            onChange={onChangeShortText('onChangeLocation')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='9' lg='8'>
          <ShortText.view
            state={state.venue}
            disabled={isDisabled}
            toggleHelp={toggleHelp('venue')}
            onChangeDebounced={onChangeDebounced('validateVenue')}
            onChange={onChangeShortText('onChangeVenue')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='9' lg='8'>
          <LongText.view
            state={state.remoteAccess}
            disabled={isDisabled}
            toggleHelp={toggleHelp('remoteAccess')}
            onChangeDebounced={onChangeDebounced('validateRemoteAccess')}
            onChange={onChangeShortText('onChangeRemoteAccess')}
            style={{ height: '8rem' }} />
        </Col>
      </Row>
    </div>
  );
};

export const view: ComponentView<State, Msg> = props => {
  return (
    <div>
      <Toggle {...props} />
      <Details {...props} />
    </div>
  );
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
