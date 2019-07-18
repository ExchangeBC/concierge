import { Route } from 'front-end/lib/app/types';
import * as Table from 'front-end/lib/components/table';
import { Component, ComponentViewProps, Dispatch, GlobalComponentMsg, immutable, Immutable, Init, mapComponentDispatch, Update, View } from 'front-end/lib/framework';
import * as Input from 'front-end/lib/views/form-field/lib/input';
import Icon from 'front-end/lib/views/icon';
import Link from 'front-end/lib/views/link';
import React, { ReactElement } from 'react';
import { CustomInput } from 'reactstrap';
import * as DdrResource from 'shared/lib/resources/discovery-day-response';
import { PublicUser } from 'shared/lib/resources/user';
import { ADT, Omit, profileToName } from 'shared/lib/types';

interface Attendee extends DdrResource.Attendee {
  errors: string[];
}

interface AttendeeGroup {
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
  | ADT<'attendeeName', TableCellContentValue<string>>
  | ADT<'attendeeEmail', TableCellContentValue<string>>
  | ADT<'attendeeInPerson', TableCellContentValue<boolean>>
  | ADT<'attendeeRemote', TableCellContentValue<boolean>>
  | ADT<'attendeeDelete', Omit<TableCellContentValue<null>, 'value'>>
  | ADT<'attendeeAdd', { groupIndex: number }>
  | ADT<'attendeeErrors', string[]>;

interface TableCellData {
  content: TableCellContent;
  dispatch: Dispatch<Msg>;
}

const TDView: View<Table.TDProps<TableCellData>> = ({ data }) => {
  const NUM_COLUMNS = 5;
  const { content, dispatch } = data;
  const id = `attendee-table-cell-${content.tag}`;
  const wrap = (child: string | null | ReactElement<any>, middle = false, center = false, colSpan?: number) => {
    return (<td className={`align-${middle ? 'middle' : 'top'} ${center ? 'text-center' : ''}`} colSpan={colSpan}>{child}</td>);
  };
  switch (content.tag) {

    case 'groupTitle':
      return (
        <td className='bg-light font-size-base align-middle' colSpan={NUM_COLUMNS - 1}>
          <Link route={{ tag: 'userView', value: { profileUserId: content.value._id }}} className='mr-2' newTab>
            {profileToName(content.value.profile)}
          </Link>
          {'('}
          <Link href={`mailto:${content.value.email}`}>{content.value.email}</Link>
          {')'}
        </td>
      )

    case 'groupDelete':
      if (content.value.disabled) { return <td className='bg-light'></td>; }
      return (
        <td className='align-middle bg-light'>
          <Icon
            name='trash'
            color='secondary'
            width={1.25}
            height={1.25}
            className='btn btn-sm btn-link text-hover-danger'
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
          className='form-control font-size-sm'
          value={content.value.value}
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
          id={id} />
      ));

    case 'attendeeEmail':
      return wrap((
        <Input.View
          type='text'
          className='form-control font-size-sm'
          value={content.value.value}
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
          id={id} />
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
          id={id} />
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
          id={id} />
      ), true, true);

    case 'attendeeDelete':
      if (content.value.disabled) { return <td></td>; }
      return wrap((
        <Icon
          name='trash'
          color='secondary'
          width={1.25}
          height={1.25}
          className='btn btn-sm btn-link text-hover-danger'
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
          className='d-flex flex-nowrap align-items-center'
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

    case 'attendeeErrors':
      return wrap((
        <div className='small text-danger'>
          {content.value.map((s, i) => (<div key={i}>{s}</div>))}
        </div>
      ), false, false, NUM_COLUMNS);

    default:
      return null;
  }
};

const tableHeadCells: Table.THSpec[] = [
  {
    children: 'Attendee Name',
    style: {
      width: '300px'
    }
  },
  {
    children: 'Attendee Email Address',
    style: {
      width: '300px'
    }
  },
  {
    children: (<div>Attending<br />In-Person</div>),
    className: 'text-center',
    style: {
      width: '120px'
    }
  },
  {
    children: (<div>Attending<br />Remotely</div>),
    className: 'text-center',
    style: {
      width: '120px'
    }
  },
  {
    children: ' ',
    style: {
      width: '60px'
    }
  }
];

const TableComponent: Table.TableComponent<TableCellData> = Table.component();

export interface State {
  groups: AttendeeGroup[];
  table: Immutable<Table.State<TableCellData>>;
}

export type Params = Omit<State,  'table'>;

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

export const init: Init<Params,  State> = async ({ groups }) => {
  return {
    groups,
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
    default:
      return [state];
  }
};

export interface ViewProps extends ComponentViewProps<State,  Msg> {
  disabled ?: boolean;
}

function tableBodyRows(groups: AttendeeGroup[], dispatch: Dispatch<Msg>, disabled?: boolean): Array<Array<Table.TDSpec<TableCellData>>> {
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
        { tag:  'attendeeName', value: { ...defaults,  value: attendee.name }},
        { tag:  'attendeeEmail', value: { ...defaults,  value: attendee.email }},
        { tag:  'attendeeInPerson', value: { ...defaults,  value: !attendee.remote }},
        { tag:  'attendeeRemote', value: { ...defaults,  value: attendee.remote }}
      ];
      row.push({ tag: 'attendeeDelete', value: defaults });
      groupRows.push(row);
      if (attendee.errors.length) {
        groupRows.push([{ tag: 'attendeeErrors', value: attendee.errors }]);
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
      dispatch={dispatchTable}
      borderless />
  );
};

const component: Component<Params,   State, Msg> = {
  init,
  update,
  view
};

export default component;
