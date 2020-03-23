import { MARKDOWN_HELP_URL } from 'front-end/config';
import * as FormField from 'front-end/lib/components/form-field';
import * as RichMarkdownEditor from 'front-end/lib/components/form-field/rich-markdown-editor';
import { Component, ComponentView, Dispatch, immutable, Immutable, Init, mapComponentDispatch, Update, updateComponentChild } from 'front-end/lib/framework';
import * as Attendees from 'front-end/lib/pages/request-for-information/components/attendees';
import { BigStat, SmallStats, Stats } from 'front-end/lib/pages/request-for-information/views/stats';
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
import * as DdrResource from 'shared/lib/resources/discovery-day-response';
import * as RfiResource from 'shared/lib/resources/request-for-information';
import { ADT, Omit, profileToName } from 'shared/lib/types';
import { getInvalidValue, mapValid, Validation } from 'shared/lib/validators';
import { validateDiscoveryDayDate, validateDiscoveryDayDescription, validateDiscoveryDayLocation, validateDiscoveryDayRemoteAccess, validateDiscoveryDayTime, validateDiscoveryDayVenue } from 'shared/lib/validators/request-for-information';

export const TAB_NAME = 'Discovery Day';

const DEFAULT_TIME = '14:00';

const DESCRIPTION_DEFAULT_TEXT = `
The purpose of a Discovery Day Session is to provide vendors with an opportunity for shared mutual understanding through a discussion with the buyer before submitting a response to the RFI.  In-person attendance is recommended, but remote access is also offered (noting that the Province cannot guarantee the accessibility or quality of remote attendance).

At the Discovery Day Session, an overview of between two and five Requests for Information (RFIs) will be presented to registered vendors by representatives from the public-sector buyer teams. After this overview, public-sector buyer teams and vendors will move into break-out sessions for a group discussion on a specific RFI.  This is an opportunity for vendors to ask questions and make suggestions about any aspect of the RFI.

Please note that vendors will not be presenting at Discovery Day Sessions, nor are they required to discuss their specific ideas during the break-out sessions.  Rather, the discussion will help vendors to understand the public-sector buyer’s current situation and vision for the future, and will help buyers to understand possible limitations and concerns from the vendor community.

If more than one RFI in a single Discovery Day Session is of interest, vendors should register multiple people as the break-out sessions will be occurring simultaneously.
`.trim();

export interface Params {
  showToggle: boolean;
  existingDiscoveryDay?: RfiResource.PublicDiscoveryDay;
  discoveryDayResponses?: DdrResource.PublicDiscoveryDayResponse[];
}

type HelpFieldName
  = 'location'
  | 'venue'
  | 'remoteAccess';

export type Msg
  = ADT<'onChangeToggle', boolean>
  | ADT<'onChangeDescription', RichMarkdownEditor.Msg>
  | ADT<'onChangeDate', string>
  | ADT<'onChangeTime', string>
  | ADT<'onChangeLocation', string>
  | ADT<'onChangeVenue', string>
  | ADT<'onChangeRemoteAccess', string>
  | ADT<'validateDate'>
  | ADT<'validateTime'>
  | ADT<'validateLocation'>
  | ADT<'validateVenue'>
  | ADT<'validateRemoteAccess'>
  | ADT<'toggleHelp', HelpFieldName>
  | ADT<'attendees', Attendees.Msg>;

type FormFieldKeys
  = 'toggle'
  | 'date'
  | 'time'
  | 'location'
  | 'venue'
  | 'remoteAccess';

export interface State {
  loading: number;
  showToggle: boolean;
  existingDiscoveryDay?: RfiResource.PublicDiscoveryDay;
  discoveryDayResponses?: DdrResource.PublicDiscoveryDayResponse[];
  isEditing: boolean;
  toggle: Switch.State;
  description: Immutable<RichMarkdownEditor.State>;
  date: DateTime.State;
  time: DateTime.State;
  location: ShortText.State;
  venue: ShortText.State;
  remoteAccess: LongText.State;
  attendees?: Immutable<Attendees.State>;
};

export type Values = RfiResource.CreateDiscoveryDayBody | undefined;

export function getValues(state: State): Values {
  if (state.showToggle && !state.toggle.value) { return undefined; }
  return {
    description: FormField.getValue(state.description),
    date: state.date.value,
    time: state.time.value,
    location: state.location.value,
    venue: state.venue.value,
    remoteAccess: state.remoteAccess.value
  };
}

interface DdrUpdateInfo {
  vendorId: string;
  attendees: DdrResource.Attendee[];
}

export type DdrUpdate
  = ADT<'update', DdrUpdateInfo>
  | ADT<'delete', Omit<DdrUpdateInfo, 'attendees'>>;

function attendeesHaveChanged(group: Attendees.AttendeeGroup, ddr: DdrResource.PublicDiscoveryDayResponse): boolean {
  return group.attendees.length !== ddr.attendees.length || group.attendees.reduce((acc: boolean, a, i) => {
    const b = ddr.attendees[i];
    return acc || !b || a.name !== b.name || a.email !== b.email || a.remote !== b.remote;
  }, false);
}

export function getDdrUpdates(state: State): DdrUpdate[] {
  if (!state.attendees || !state.existingDiscoveryDay || !state.discoveryDayResponses) { return []; }
  const responsesByVendorId: Record<string, DdrResource.PublicDiscoveryDayResponse | undefined> = state.discoveryDayResponses.reduce((acc, ddr) => {
    return {
      ...acc,
      [ddr.vendor._id]: ddr
    };
  }, {});
  const groupsByVendorId: Record<string, Attendees.AttendeeGroup | undefined> = state.attendees.groups.reduce((acc, group) => {
    if (!group.vendor) { return acc; }
    return {
      ...acc,
      [group.vendor._id]: group
    };
  }, {});
  const updates = state.attendees.groups.reduce((acc: DdrUpdate[], group) => {
    if (!group.vendor) { return acc; }
    const vendorId = group.vendor._id;
    const ddr = responsesByVendorId[vendorId];
    if (ddr && attendeesHaveChanged(group, ddr)) {
      acc.push({
        tag: 'update',
        value: {
          vendorId,
          attendees: group.attendees
        }
      });
    }
    return acc;
  }, []);
  const deletes = state.discoveryDayResponses.reduce((acc: DdrUpdate[], ddr) => {
    const vendorId = ddr.vendor._id;
    const group = groupsByVendorId[vendorId];
    if (!group) {
      acc.push({
        tag: 'delete',
        value: {
          vendorId
        }
      });
    }
    return acc;
  }, []);
  return [...updates, ...deletes];
}

export const init: Init<Params, State> = async ({ showToggle, existingDiscoveryDay, discoveryDayResponses }) => {
  const getDdString = (k: string | string[]): string => getString(existingDiscoveryDay, k);
  const rawOccurringAt = getDdString('occurringAt');
  const occurringAt = new Date(rawOccurringAt);
  const dateValue = rawOccurringAt ? rawFormatDate(occurringAt, 'YYYY-MM-DD', false) : '';
  const timeValue = rawOccurringAt ? rawFormatDate(occurringAt, 'HH:mm', false) : DEFAULT_TIME;
  const remoteAccessHelpText = 'Dial-in and/or teleconference information that will be emailed to remote attendees.';
  return {
    loading: 0,
    showToggle,
    existingDiscoveryDay,
    discoveryDayResponses,
    isEditing: false,
    toggle: Switch.init({
      id: 'discovery-day-discovery-day',
      value: showToggle && !!existingDiscoveryDay,
      inlineLabel: 'This RFI is associated with a Discovery Day session.'
    }),
    description: immutable(await RichMarkdownEditor.init({
      id: 'discovery-day-description',
      value: existingDiscoveryDay ? getDdString('description') : DESCRIPTION_DEFAULT_TEXT,
      errors: [],
      validate: v => mapValid(validateDiscoveryDayDescription(v), w => w || '')
    })),
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
        text: 'The session\'s general location that is visible to all users. For example, "Victoria, BC."',
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
        text: 'The session\'s specific venue that will only be emailed to in-person attendees. For example, "563 Superior St, Victoria, BC, V8V 1T7."',
        show: false
      }
    }),
    remoteAccess: LongText.init({
      id: 'discovery-day-remote-access',
      required: true,
      label: 'Remote Access',
      placeholder: remoteAccessHelpText,
      value: getDdString('remoteAccess'),
      help: {
        text: remoteAccessHelpText,
        show: false
      }
    }),
    attendees: discoveryDayResponses
      ? immutable(await Attendees.init({
          occurringAt,
          groups: discoveryDayResponses
            .map(({ vendor, attendees }) => {
              return { vendor, attendees };
            })
            .sort((a, b) => {
              return profileToName(a.vendor.profile).localeCompare(profileToName(b.vendor.profile));
            })
        }))
      : undefined
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
      return updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'onChangeDescription', value }),
        childStatePath: ['description'],
        childUpdate: RichMarkdownEditor.update,
        childMsg: msg.value
      });
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
          case 'location':
            return state.setIn(['location', 'help', 'show'], !state.getIn(['location', 'help', 'show']));
          case 'venue':
            return state.setIn(['venue', 'help', 'show'], !state.getIn(['venue', 'help', 'show']));
          case 'remoteAccess':
            return state.setIn(['remoteAccess', 'help', 'show'], !state.getIn(['remoteAccess', 'help', 'show']));
        }
      })()];
    case 'attendees':
      return updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'attendees', value }),
        childStatePath: ['attendees'],
        childUpdate: Attendees.update,
        childMsg: msg.value
      });

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
  return hasProvidedRequiredFields(state) && !hasValidationErrors(state) && (!state.attendees || Attendees.isValid(state.attendees));
}

const Toggle: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const onChangeSwitch = (tag: any) => Switch.makeOnChange(dispatch, value => ({ tag, value }));
  return (
    <div className='mb-4'>
      <Row>
        <Col xs='12'>
          <FormSectionHeading text='Discovery Day Session' />
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
  const onChangeShortText = (tag: any) => ShortText.makeOnChange(dispatch, value => ({ tag, value }));
  const onChangeDebounced = (tag: any) => () => dispatch({ tag, value: undefined });
  const toggleHelp = (value: HelpFieldName) => () => dispatch({ tag: 'toggleHelp', value });
  return (
    <div>
      <Row className='mb-3'>
        <Col xs='12'>
          <h4>Details</h4>
        </Col>
      </Row>
      <Row>
        <Col xs='12'>
          <RichMarkdownEditor.view
            state={state.description}
            dispatch={mapComponentDispatch(dispatch, value => ({ tag: 'onChangeDescription', value } as const))}
            disabled={isDisabled}
            placeholder='Provide a brief description of the session.'
            label='Description (Optional)'
            help={(<span>You can use <Link href={MARKDOWN_HELP_URL} newTab>Markdown</Link> to describe this session.</span>)}
            style={{ minHeight: '210px', maxHeight: '400px', height: '35vh' }} />
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

const ConditionalAttendees: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (!state.existingDiscoveryDay || !state.attendees) { return null; }
  const dispatchAttendees: Dispatch<Attendees.Msg> = mapComponentDispatch(dispatch, value => ({ tag: 'attendees' as const, value }));
  const numVendors = state.attendees.groups.length;
  let numAttendees = 0;
  let numInPerson = 0;
  let numRemote = 0;
  state.attendees.groups.forEach(group => {
    numAttendees += group.attendees.length;
    group.attendees.forEach(attendee => {
      if (attendee.remote) {
        numRemote += 1;
      } else {
        numInPerson += 1;
      }
    });
  });
  const isDisabled = !state.isEditing || RfiResource.discoveryDayHasPassed(state.existingDiscoveryDay.occurringAt);
  return (
    <div className='mt-5 pt-5 border-top'>
      <Row className='mb-5'>
        <Col xs='12'>
          <Stats>
            <BigStat color='primary-alt' count={numAttendees} label={(<span>{numAttendees === 1 ? 'Person' : 'People'}<br />Attending</span>)} />
            <SmallStats a={{ color: 'primary-alt', count: numInPerson, label: 'In-Person' }} b={{ color: 'info', count: numRemote, label: 'Remote' }} />
            <BigStat color='info' count={numVendors} label={(<span>Vendor{numVendors === 1 ? '' : 's'}<br />Attending</span>)} />
          </Stats>
        </Col>
      </Row>
      {numAttendees > 0
        ? (<div>
            <Row className='mb-3'>
              <Col xs='12'>
                <h4>Attendee(s)</h4>
              </Col>
            </Row>
            <Row>
              <Col xs='12'>
                <Attendees.view dispatch={dispatchAttendees} state={state.attendees} disabled={isDisabled} />
              </Col>
            </Row>
          </div>)
        : null}
    </div>
  );
};

export const view: ComponentView<State, Msg> = props => {
  return (
    <div>
      <Toggle {...props} />
      <Details {...props} />
      <ConditionalAttendees {...props} />
    </div>
  );
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
