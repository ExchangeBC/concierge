import { Route } from 'front-end/lib/app/types';
import * as Table from 'front-end/lib/components/table';
import { Component, ComponentViewProps, Dispatch, GlobalComponentMsg, immutable, Immutable, Init, mapComponentDispatch, Update, updateComponentChild, View } from 'front-end/lib/framework';
import * as Input from 'front-end/lib/views/form-field/lib/input';
import Icon from 'front-end/lib/views/icon';
import Link from 'front-end/lib/views/link';
import { get } from 'lodash';
import React from 'react';
import { CustomInput } from 'reactstrap';
import * as DdrResource from 'shared/lib/resources/discovery-day-response';
import { PublicUser } from 'shared/lib/resources/user';
import { ADT, Omit, profileToName } from 'shared/lib/types';
import { getInvalidValue } from 'shared/lib/validators';
import { countInPerson, validateAttendee } from 'shared/lib/validators/discovery-day-response';

export interface AttendeeGroup {
  vendor?: PublicUser;
  attendees: Attendee[];
}

interface AttendeeErrors {
  name: string[];
  email: string[];
  remote: string[];
}

export interface Attendee extends DdrResource.Attendee {
  errors?: AttendeeErrors;
}

const tableHeadCells: Table.THSpec[] = [
  {
    children: (
      <span>
        Attendee Name<span className="text-primary ml-1">*</span>
      </span>
    ),
    style: {
      minWidth: '240px',
      width: '30%',
      height: '4rem'
    }
  },
  {
    children: (
      <span>
        Attendee Email Address<span className="text-primary ml-1">*</span>
      </span>
    ),
    style: {
      minWidth: '240px',
      width: '30%',
      height: '4rem'
    }
  },
  {
    children: (
      <div>
        Attending
        <br />
        In-Person
      </div>
    ),
    className: 'text-center',
    style: {
      minWidth: '110px',
      width: '15%',
      height: '4rem'
    }
  },
  {
    children: (
      <div>
        Attending
        <br />
        Remotely
      </div>
    ),
    className: 'text-center',
    style: {
      minWidth: '110px',
      width: '15%',
      height: '4rem'
    }
  },
  {
    children: ' ',
    style: {
      minWidth: '70px',
      width: '10%',
      height: '4rem'
    }
  }
];

export interface State {
  groups: AttendeeGroup[];
  originalGroups: AttendeeGroup[];
  occurringAt: Date;
  table: Immutable<Table.State>;
}

function attendeeHasErrors(attendee: Attendee): boolean {
  return !!(attendee.errors && (attendee.errors.name.length || attendee.errors.email.length || attendee.errors.remote.length));
}

export function isValid(state: Immutable<State>): boolean {
  for (const group of state.groups) {
    for (const attendee of group.attendees) {
      if (attendeeHasErrors(attendee) || !attendee.name || !attendee.email) {
        return false;
      }
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

interface OnChangeAttendeeField<Value> {
  groupIndex: number;
  attendeeIndex: number;
  value: Value;
}

type InnerMsg =
  | ADT<'table', Table.Msg>
  | ADT<'onChangeAttendeeName', OnChangeAttendeeField<string>>
  | ADT<'onChangeAttendeeEmail', OnChangeAttendeeField<string>>
  | ADT<'onChangeAttendeeInPerson', OnChangeAttendeeField<boolean>>
  | ADT<'onChangeAttendeeRemote', OnChangeAttendeeField<boolean>>
  | ADT<'deleteAttendee', Pick<OnChangeAttendeeField<null>, 'groupIndex' | 'attendeeIndex'>>
  | ADT<'addAttendee', Pick<OnChangeAttendeeField<null>, 'groupIndex'>>
  | ADT<'deleteGroup', Pick<OnChangeAttendeeField<null>, 'groupIndex'>>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

export const init: Init<Params, State> = async (params) => {
  return {
    ...params,
    originalGroups: params.groups,
    table: immutable(
      await Table.init({
        idNamespace: 'discovery-day-attendees'
      })
    )
  };
};

export const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'table':
      return updateComponentChild({
        state,
        mapChildMsg: (value) => ({ tag: 'table' as const, value }),
        childStatePath: ['table'],
        childUpdate: Table.update,
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
      state = state.setIn(
        ['groups', msg.value.groupIndex, 'attendees'],
        state.groups[msg.value.groupIndex].attendees.filter((a, i) => i !== msg.value.attendeeIndex)
      );
      return [validateGroupAttendees(state, msg.value.groupIndex)];

    case 'addAttendee':
      state = state.setIn(
        ['groups', msg.value.groupIndex, 'attendees'],
        state.groups[msg.value.groupIndex].attendees.concat({
          name: '',
          email: '',
          remote: false
        })
      );
      return [validateGroupAttendees(state, msg.value.groupIndex)];

    case 'deleteGroup':
      return [
        state.set(
          'groups',
          state.groups.filter((g, i) => i !== msg.value.groupIndex)
        )
      ];

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

export interface ViewProps extends ComponentViewProps<State, Msg> {
  disabled?: boolean;
}

const NUM_COLUMNS = 5;

function makeErrorCell(errors: string[], colSpan?: number): Table.TDSpec {
  return {
    children: errors.map((s, i) => <div key={i}>{s}</div>),
    className: 'align-top pt-0 text-danger border-0 text-wrap',
    colSpan
  };
}

function tableBodyRows(groups: AttendeeGroup[], dispatch: Dispatch<Msg>, disabled?: boolean): Table.RowsSpec {
  return groups.reduce((tableRows: Table.RowsSpec, group, groupIndex) => {
    // Add group title row.
    if (group.vendor) {
      const titleRow: Table.RowSpec = [
        {
          children: (
            <div>
              <Link route={{ tag: 'userView', value: { profileUserId: group.vendor._id } }} className="mr-2" newTab>
                {profileToName(group.vendor.profile)}
              </Link>
              {'('}
              <Link href={`mailto:${group.vendor.email}`}>{group.vendor.email}</Link>
              {')'}
            </div>
          ),
          className: 'bg-light font-size-base align-middle text-wrap',
          colSpan: NUM_COLUMNS - 1
        }
      ];
      titleRow.push({
        children: (
          <Icon
            name="trash"
            color="secondary"
            width={1.25}
            height={1.25}
            className={`btn btn-sm btn-link text-hover-danger ${disabled ? 'disabled invisible' : ''}`}
            style={{ boxSizing: 'content-box', cursor: 'pointer' }}
            onClick={() =>
              dispatch({
                tag: 'deleteGroup',
                value: { groupIndex }
              })
            }
          />
        ),
        className: 'bg-light align-middle text-center'
      });
      tableRows.push(titleRow);
    }
    // Add attendee rows.
    const makeId = (k: string, groupIndex: number, attendeeIndex: number) => `attendee-table-cell-${k}-${groupIndex}-${attendeeIndex}`;
    tableRows = tableRows.concat(
      group.attendees.reduce((groupRows: Table.RowsSpec, attendee, attendeeIndex) => {
        const hasNameErrors = !!(attendee.errors && attendee.errors.name.length);
        const hasEmailErrors = !!(attendee.errors && attendee.errors.email.length);
        const row: Table.RowSpec = [
          {
            children: (
              <Input.View
                type="text"
                className={`form-control ${hasNameErrors ? 'is-invalid' : ''}`}
                value={attendee.name}
                placeholder="Full Name"
                disabled={disabled}
                onChange={(event) =>
                  dispatch({
                    tag: 'onChangeAttendeeName',
                    value: {
                      groupIndex,
                      attendeeIndex,
                      value: event.currentTarget.value
                    }
                  })
                }
                id={makeId('name', groupIndex, attendeeIndex)}
              />
            ),
            className: 'align-top'
          },
          {
            children: (
              <Input.View
                type="text"
                className={`form-control ${hasEmailErrors ? 'is-invalid' : ''}`}
                value={attendee.email}
                placeholder="Email Address"
                disabled={disabled}
                onChange={(event) =>
                  dispatch({
                    tag: 'onChangeAttendeeEmail',
                    value: {
                      groupIndex,
                      attendeeIndex,
                      value: event.currentTarget.value
                    }
                  })
                }
                id={makeId('email', groupIndex, attendeeIndex)}
              />
            ),
            className: 'align-top'
          },
          {
            children: (
              <CustomInput
                type="radio"
                checked={!attendee.remote}
                disabled={disabled}
                onChange={(event) =>
                  dispatch({
                    tag: 'onChangeAttendeeInPerson',
                    value: {
                      groupIndex,
                      attendeeIndex,
                      value: event.currentTarget.checked
                    }
                  })
                }
                id={makeId('in-person', groupIndex, attendeeIndex)}
              />
            ),
            className: 'align-middle text-center'
          },
          {
            children: (
              <CustomInput
                type="radio"
                checked={attendee.remote}
                disabled={disabled}
                onChange={(event) =>
                  dispatch({
                    tag: 'onChangeAttendeeRemote',
                    value: {
                      groupIndex,
                      attendeeIndex,
                      value: event.currentTarget.checked
                    }
                  })
                }
                id={makeId('remote', groupIndex, attendeeIndex)}
              />
            ),
            className: 'align-middle text-center'
          },
          {
            children: (
              <Icon
                name="trash"
                color="secondary"
                width={1.25}
                height={1.25}
                className={`btn btn-sm btn-link text-hover-danger ${disabled || group.attendees.length === 1 ? 'disabled invisible' : ''}`}
                style={{ boxSizing: 'content-box', cursor: 'pointer' }}
                onClick={() =>
                  dispatch({
                    tag: 'deleteAttendee',
                    value: {
                      groupIndex,
                      attendeeIndex
                    }
                  })
                }
              />
            ),
            className: 'align-middle text-center'
          }
        ];
        groupRows.push(row);
        if (attendeeHasErrors(attendee) && attendee.errors) {
          groupRows.push([makeErrorCell(attendee.errors.name), makeErrorCell(attendee.errors.email), makeErrorCell(attendee.errors.remote, 3)]);
        }
        return groupRows;
      }, [])
    );
    // Add row to add attendee.
    if (!disabled) {
      tableRows.push([
        {
          children: (
            <Link
              className="d-inline-flex flex-nowrap align-items-center font-size-base"
              onClick={() =>
                dispatch({
                  tag: 'addAttendee',
                  value: { groupIndex }
                })
              }
            >
              <Icon name="plus" width={1} height={1} className="mr-1" />
              Add Attendee
            </Link>
          ),
          className: 'align-middle',
          colSpan: NUM_COLUMNS
        }
      ]);
    }
    return tableRows;
  }, []);
}

export const view: View<ViewProps> = ({ state, dispatch, disabled }) => {
  if (!state.groups.length) {
    return <div>There are no attendees.</div>;
  }
  const bodyRows = tableBodyRows(state.groups, dispatch, disabled);
  const dispatchTable: Dispatch<Table.Msg> = mapComponentDispatch(dispatch, (value) => ({ tag: 'table' as const, value }));
  return <Table.view className="text-nowrap" headCells={tableHeadCells} bodyRows={bodyRows} state={state.table} dispatch={dispatchTable} />;
};

const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};

export default component;
