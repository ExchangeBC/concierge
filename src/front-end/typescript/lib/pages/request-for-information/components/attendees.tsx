import { Route } from 'front-end/lib/app/types';
import * as Table from 'front-end/lib/components/table';
import { Component, ComponentViewProps, Dispatch, GlobalComponentMsg, immutable, Immutable, Init, mapComponentDispatch, Update, updateComponentChild, View } from 'front-end/lib/framework';
import * as Input from 'front-end/lib/views/form-field/lib/input';
import Icon from 'front-end/lib/views/icon';
import Link from 'front-end/lib/views/link';
import { get } from 'lodash';
import React, { ReactElement } from 'react';
import { CustomInput } from 'reactstrap';
import * as DdrResource from 'shared/lib/resources/discovery-day-response';
import { PublicUser } from 'shared/lib/resources/user';
import { ADT, Omit, profileToName } from 'shared/lib/types';
import { getInvalidValue } from 'shared/lib/validators';
import { countInPerson, validateAttendee } from 'shared/lib/validators/discovery-day-response';

interface AttendeeErrors {
  name: string[];
  email: string[];
  remote: string[];
}

export interface Attendee extends DdrResource.Attendee {
  errors?: AttendeeErrors;
}

export interface AttendeeGroup {
  vendor?: PublicUser;
  attendees: Attendee[];
}

interface TableCellContentValue<Value> {
  groupIndex: number;
  attendeeIndex: number;
  disabled?: boolean;
  value: Value;
}

type TableCellContent
  = ADT<'groupTitle', PublicUser>
  | ADT<'groupDelete', { groupIndex: number, disabled?: boolean }>
  | ADT<'attendeeName', TableCellContentValue<[string, boolean]>>
  | ADT<'attendeeEmail', TableCellContentValue<[string, boolean]>>
  | ADT<'attendeeInPerson', TableCellContentValue<boolean>>
  | ADT<'attendeeRemote', TableCellContentValue<boolean>>
  | ADT<'attendeeDelete', Omit<TableCellContentValue<null>, 'value'>>
  | ADT<'attendeeAdd', { groupIndex: number }>
  | ADT<'attendeeErrorsName', string[]>
  | ADT<'attendeeErrorsEmail', string[]>
  | ADT<'attendeeErrorsRemote', string[]>;

interface TableCellData {
  content: TableCellContent;
  dispatch: Dispatch<Msg>;
}

const TDView: View<Table.TDProps<TableCellData>> = ({ data }) => {
  const NUM_COLUMNS = 5;
  const { content, dispatch } = data;
  const makeId = (groupIndex: number, attendeeIndex: number) => `attendee-table-cell-${content.tag}-${groupIndex}-${attendeeIndex}`;
  const wrap = (child: string | null | ReactElement<any>, middle = false, center = false, colSpan?: number) => {
    return (<td className={`align-${middle ? 'middle' : 'top'} ${center ? 'text-center' : ''}`} colSpan={colSpan}>{child}</td>);
  };
  switch (content.tag) {

    case 'groupTitle':
      return (
        <td className='bg-light font-size-base align-middle text-wrap' colSpan={NUM_COLUMNS - 1}>
          <Link route={{ tag: 'userView', value: { profileUserId: content.value._id }}} className='mr-2' newTab>
            {profileToName(content.value.profile)}
          </Link>
          {'('}
          <Link href={`mailto:${content.value.email}`}>{content.value.email}</Link>
          {')'}
        </td>
      )

    case 'groupDelete':
      return (
        <td className='align-middle bg-light text-center'>
          <Icon
            name='trash'
            color='secondary'
            width={1.25}
            height={1.25}
            className={`btn btn-sm btn-link text-hover-danger ${content.value.disabled ? 'disabled invisible' : ''}`}
            style={{ boxSizing: 'content-box', cursor: 'pointer' }}
            onClick={() => dispatch({
              tag: 'deleteGroup',
              value: {
                groupIndex: content.value.groupIndex
              }
            })} />
        </td>
      );

    case 'attendeeName':
      return wrap((
        <Input.View
          type='text'
          className={`form-control ${content.value.value[1] ? 'is-invalid' : ''}`}
          value={content.value.value[0]}
          placeholder='Full Name'
          disabled={content.value.disabled}
          onChange={event => dispatch({
            tag: 'onChangeAttendeeName',
            value: {
              groupIndex: content.value.groupIndex,
              attendeeIndex: content.value.attendeeIndex,
              value: event.currentTarget.value
            }
          })}
          id={makeId(content.value.groupIndex, content.value.attendeeIndex)} />
      ));

    case 'attendeeEmail':
      return wrap((
        <Input.View
          type='text'
          className={`form-control ${content.value.value[1] ? 'is-invalid' : ''}`}
          value={content.value.value[0]}
          placeholder='Email Address'
          disabled={content.value.disabled}
          onChange={event => dispatch({
            tag: 'onChangeAttendeeEmail',
            value: {
              groupIndex: content.value.groupIndex,
              attendeeIndex: content.value.attendeeIndex,
              value: event.currentTarget.value
            }
          })}
          id={makeId(content.value.groupIndex, content.value.attendeeIndex)} />
      ));

    case 'attendeeInPerson':
      return wrap((
        <CustomInput
          type='radio'
          checked={content.value.value}
          disabled={content.value.disabled}
          onChange={event => dispatch({
            tag: 'onChangeAttendeeInPerson',
            value: {
              groupIndex: content.value.groupIndex,
              attendeeIndex: content.value.attendeeIndex,
              value: event.currentTarget.checked
            }
          })}
          id={makeId(content.value.groupIndex, content.value.attendeeIndex)} />
      ), true, true);

    case 'attendeeRemote':
      return wrap((
        <CustomInput
          type='radio'
          checked={content.value.value}
          disabled={content.value.disabled}
          onChange={event => dispatch({
            tag: 'onChangeAttendeeRemote',
            value: {
              groupIndex: content.value.groupIndex,
              attendeeIndex: content.value.attendeeIndex,
              value: event.currentTarget.checked
            }
          })}
          id={makeId(content.value.groupIndex, content.value.attendeeIndex)} />
      ), true, true);

    case 'attendeeDelete':
      return wrap((
        <Icon
          name='trash'
          color='secondary'
          width={1.25}
          height={1.25}
          className={`btn btn-sm btn-link text-hover-danger ${content.value.disabled ? 'disabled invisible' : ''}`}
          style={{ boxSizing: 'content-box', cursor: 'pointer' }}
          onClick={() => dispatch({
            tag: 'deleteAttendee',
            value: {
              groupIndex: content.value.groupIndex,
              attendeeIndex: content.value.attendeeIndex
            }
          })} />
      ), true, true);

    case 'attendeeAdd':
      return wrap((
        <Link
          className='d-inline-flex flex-nowrap align-items-center font-size-base'
          onClick={() => dispatch({
            tag: 'addAttendee',
            value: {
              groupIndex: content.value.groupIndex
            }
          })}>
          <Icon name='plus' width={1} height={1} className='mr-1' />
          Add Attendee
        </Link>
      ), true, false, NUM_COLUMNS);

    case 'attendeeErrorsName':
      return (
        <td className='align-top pt-0 text-danger border-0 text-wrap'>
          {content.value.map((s, i) => (<div key={i}>{s}</div>))}
        </td>
      );

    case 'attendeeErrorsEmail':
      return (
        <td className='align-top pt-0 text-danger border-0 text-wrap'>
          {content.value.map((s, i) => (<div key={i}>{s}</div>))}
        </td>
      );

    case 'attendeeErrorsRemote':
      return (
        <td colSpan={3} className='align-top pt-0 text-danger border-0 text-wrap'>
          {content.value.map((s, i) => (<div key={i}>{s}</div>))}
        </td>
      );
  }
};

const tableHeadCells: Table.THSpec[] = [
  {
    children: (<span>Attendee Name<span className='text-primary ml-1'>*</span></span>),
    style: {
      minWidth: '240px',
      width: '30%'
    }
  },
  {
    children: (<span>Attendee Email Address<span className='text-primary ml-1'>*</span></span>),
    style: {
      minWidth: '240px',
      width: '30%'
    }
  },
  {
    children: (<div>Attending<br />In-Person</div>),
    className: 'text-center',
    style: {
      minWidth: '110px',
      width: '15%'
    }
  },
  {
    children: (<div>Attending<br />Remotely</div>),
    className: 'text-center',
    style: {
      minWidth: '110px',
      width: '15%'
    }
  },
  {
    children: ' ',
    style: {
      minWidth: '70px',
      width: '10%'
    }
  }
];

const TableComponent: Table.TableComponent<TableCellData> = Table.component();

export interface State {
  groups: AttendeeGroup[];
  originalGroups: AttendeeGroup[];
  occurringAt: Date;
  table: Immutable<Table.State<TableCellData>>;
}

function attendeeHasErrors(attendee: Attendee): boolean {
  return !!(attendee.errors && (attendee.errors.name.length || attendee.errors.email.length || attendee.errors.remote.length));
}

export function isValid(state: Immutable<State>): boolean {
  for (const group of state.groups) {
    for (const attendee of group.attendees) {
      if (attendeeHasErrors(attendee) || !attendee.name || !attendee.email) { return false; }
    }
  }
  return true;
}

export function setAttendeeErrors(state: Immutable<State>, groupIndex: number, attendeeIndex: number, errors: DdrResource.AttendeeValidationErrors): Immutable<State> {
  return state.setIn(['groups', groupIndex, 'attendees', attendeeIndex, 'errors'], {
    name: get(errors, 'name', []),
    email: get(errors, 'email', []),
    remote: get(errors, 'remote', [])
  });
}

export function setErrors(state: Immutable<State>, errors: DdrResource.AttendeeValidationErrors[][]): Immutable<State> {
  state.groups.forEach((group, groupIndex) => {
    group.attendees.forEach((attendee, attendeeIndex) => {
      state = setAttendeeErrors(state, groupIndex, attendeeIndex, get(errors, [groupIndex, attendeeIndex], {}));
    });
  });
  return state;
}

export type Params = Omit<State, 'originalGroups' | 'table'>;

type OnChangeAttendeeField<Value> = Omit<TableCellContentValue<Value>, 'disabled'>;

type InnerMsg
  = ADT<'table', Table.Msg>
  | ADT<'onChangeAttendeeName', OnChangeAttendeeField<string>>
  | ADT<'onChangeAttendeeEmail', OnChangeAttendeeField<string>>
  | ADT<'onChangeAttendeeInPerson', OnChangeAttendeeField<boolean>>
  | ADT<'onChangeAttendeeRemote', OnChangeAttendeeField<boolean>>
  | ADT<'deleteAttendee', Pick<OnChangeAttendeeField<null>, 'groupIndex' | 'attendeeIndex'>>
  | ADT<'addAttendee', Pick<OnChangeAttendeeField<null>, 'groupIndex'>>
  | ADT<'deleteGroup', Pick<OnChangeAttendeeField<null>, 'groupIndex'>>;

export type Msg = GlobalComponentMsg<InnerMsg,  Route>;

export const init: Init<Params,  State> = async params => {
  return {
    ...params,
    originalGroups: params.groups,
    table: immutable(await TableComponent.init({
      TDView,
      THView: Table.DefaultTHView,
      idNamespace: 'discovery-day-attendees'
    }))
  };
};

export const update: Update<State,  Msg> = ({ state,  msg }) => {
  switch  (msg.tag) {
    case 'table':
      return updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'table' as const, value }),
        childStatePath: ['table'],
        childUpdate: TableComponent.update,
        childMsg: msg.value
      });

    case 'onChangeAttendeeName':
      return [updateAndValidateAttendee(state, 'name', msg.value.value, msg.value.groupIndex, msg.value.attendeeIndex)];

    case 'onChangeAttendeeEmail':
      return [updateAndValidateAttendee(state, 'email', msg.value.value, msg.value.groupIndex, msg.value.attendeeIndex)];

    case 'onChangeAttendeeInPerson':
      return [updateAndValidateAttendee(state, 'remote', !msg.value.value, msg.value.groupIndex, msg.value.attendeeIndex)];

    case 'onChangeAttendeeRemote':
      state = updateAttendee(state, 'remote', msg.value.value, msg.value.groupIndex, msg.value.attendeeIndex);
      return [validateGroupAttendees(state, msg.value.groupIndex)];

    case 'deleteAttendee':
      state = state.setIn(['groups', msg.value.groupIndex, 'attendees'], state.groups[msg.value.groupIndex].attendees.filter((a, i) => i !== msg.value.attendeeIndex));
      return [validateGroupAttendees(state, msg.value.groupIndex)];

    case 'addAttendee':
      state = state.setIn(['groups', msg.value.groupIndex, 'attendees'], state.groups[msg.value.groupIndex].attendees.concat({
        name: '',
        email: '',
        remote: false
      }));
      return [validateGroupAttendees(state, msg.value.groupIndex)];

    case 'deleteGroup':
      return [state.set('groups', state.groups.filter((g, i) => i !== msg.value.groupIndex))];

    default:
      return [state];
  }
};

function updateAndValidateAttendee<K extends keyof DdrResource.Attendee>(state: Immutable<State>, key: K, value: DdrResource.Attendee[K], groupIndex: number, attendeeIndex: number): Immutable<State> {
  state = updateAttendee(state, key, value, groupIndex, attendeeIndex);
  return validateOneAttendee(state, groupIndex, attendeeIndex);
}

function updateAttendee<K extends keyof DdrResource.Attendee>(state: Immutable<State>, key: K, value: DdrResource.Attendee[K], groupIndex: number, attendeeIndex: number): Immutable<State> {
  return state.setIn(['groups', groupIndex, 'attendees', attendeeIndex, key], value);
}

function validateOneAttendee(state: Immutable<State>, groupIndex: number, attendeeIndex: number): Immutable<State> {
  const numInPersonSlots = countInPerson(state.originalGroups[groupIndex].attendees) - countInPerson(state.groups[groupIndex].attendees) + 1;
  const validation = validateAttendee(state.groups[groupIndex].attendees[attendeeIndex], state.occurringAt, numInPersonSlots);
  const validationErrors: DdrResource.AttendeeValidationErrors = getInvalidValue(validation, {});
  return setAttendeeErrors(state, groupIndex, attendeeIndex, validationErrors);
}

function validateGroupAttendees(state: Immutable<State>, groupIndex: number): Immutable<State> {
  state.groups[groupIndex].attendees.forEach((attendee, attendeeIndex) => {
    state = validateOneAttendee(state, groupIndex, attendeeIndex);
  });
  return state;
}

export interface ViewProps extends ComponentViewProps<State,  Msg> {
  disabled ?: boolean;
}

function tableBodyRows(groups: AttendeeGroup[], dispatch: Dispatch<Msg>, disabled?: boolean): Table.RowsSpec<TableCellData> {
  const rows: TableCellContent[][] = groups.reduce((tableRows: TableCellContent[][], group, groupIndex) => {
    // Add group title row.
    if (group.vendor) {
      const titleRow: TableCellContent[] = [{
        tag: 'groupTitle',
        value: group.vendor
      }];
      titleRow.push({ tag: 'groupDelete', value: { groupIndex, disabled }})
      tableRows.push(titleRow);
    }
    // Add attendee rows.
    tableRows = tableRows.concat(group.attendees.reduce((groupRows: TableCellContent[][], attendee, attendeeIndex) => {
      const defaults = { groupIndex,  attendeeIndex, disabled };
      const row: TableCellContent[] = [
        { tag:  'attendeeName', value: { ...defaults,  value: [attendee.name, !!(attendee.errors && attendee.errors.name.length)] }},
        { tag:  'attendeeEmail', value: { ...defaults,  value: [attendee.email, !!(attendee.errors && attendee.errors.email.length)] }},
        { tag:  'attendeeInPerson', value: { ...defaults,  value: !attendee.remote }},
        { tag:  'attendeeRemote', value: { ...defaults,  value: attendee.remote }}
      ];
      row.push({
        tag: 'attendeeDelete',
        value: {
          ...defaults,
          disabled: defaults.disabled || group.attendees.length === 1
        }
      });
      groupRows.push(row);
      if (attendeeHasErrors(attendee) && attendee.errors) {
        groupRows.push([
          { tag: 'attendeeErrorsName', value: attendee.errors.name },
          { tag: 'attendeeErrorsEmail', value: attendee.errors.email },
          { tag: 'attendeeErrorsRemote', value: attendee.errors.remote }
        ]);
      }
      return groupRows;
    }, []));
    // Add row to add attendee.
    if (!disabled) {
      tableRows.push([
        { tag: 'attendeeAdd', value: { groupIndex }}
      ]);
    }
    return tableRows;
  }, []);
  // Create TD specs from each row's content.
  return rows.map(row => {
    return row.map(content => Table.makeTDSpec({ content,  dispatch }));
  });
}

export const view: View<ViewProps> = ({ state,  dispatch, disabled }) => {
  if  (!state.groups.length) { return (<div>There are no attendees.</div>); }
  const bodyRows = tableBodyRows(state.groups, dispatch, disabled);
  const dispatchTable: Dispatch<Table.Msg> = mapComponentDispatch(dispatch, value => ({ tag:  'table' as const, value }));
  return (
    <TableComponent.view
      className='text-nowrap'
      headCells={tableHeadCells}
      bodyRows={bodyRows}
      state={state.table}
      dispatch={dispatchTable} />
  );
};

const component: Component<Params,   State, Msg> = {
  init,
  update,
  view
};

export default component;
