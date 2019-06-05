import { makePageMetadata } from 'front-end/lib';
import { Route, SharedState } from 'front-end/lib/app/types';
import * as TableComponent from 'front-end/lib/components/table';
import { ComponentView, Dispatch, emptyPageAlerts, emptyPageBreadcrumbs, GlobalComponentMsg, immutable, Immutable, mapComponentDispatch, noPageModal, PageComponent, PageInit, Update, updateComponentChild, View } from 'front-end/lib/framework';
import { readManyRfis } from 'front-end/lib/http/api';
import StatusBadge from 'front-end/lib/pages/request-for-information/views/status-badge';
import Icon from 'front-end/lib/views/icon';
import * as Select from 'front-end/lib/views/input/select';
import * as ShortText from 'front-end/lib/views/input/short-text';
import Link from 'front-end/lib/views/link';
import { default as React, ReactElement } from 'react';
import { Col, Row } from 'reactstrap';
import AVAILABLE_CATEGORIES from 'shared/data/categories';
import { compareDates, rawFormatDate } from 'shared/lib';
import { PublicRfi, rfiToRfiStatus } from 'shared/lib/resources/request-for-information';
import { ADT, parseRfiStatus, RfiStatus, rfiStatusToTitleCase, UserType } from 'shared/lib/types';

function formatTableDate(date: Date): string {
  return rawFormatDate(date, 'YYYY-MM-DD', false);
}

// Define Table component.

type TableCellData
  = ADT<'rfiNumber', string>
  | ADT<'publishDate', Date>
  | ADT<'status', RfiStatus>
  | ADT<'programStaffTitle', { rfiId: string, text: string }>
  | ADT<'nonProgramStaffTitle', { rfiId: string, text: string, entity: string }>
  | ADT<'publicSectorEntity', string>
  | ADT<'lastUpdated', Date>
  | ADT<'closingDate', Date>
  | ADT<'discoveryDay', [boolean, PublicRfi]>;

const Table: TableComponent.TableComponent<TableCellData> = TableComponent.component();

const TDView: View<TableComponent.TDProps<TableCellData>> = ({ data }) => {
  const wrap = (child: string | null | ReactElement<any>, wrapText = false, center = false) => {
    return (<td className={`${wrapText ? 'text-wrap' : ''} ${center ? 'text-center' : ''} align-middle`}>{child}</td>);
  };
  switch (data.tag) {
    case 'rfiNumber':
      return wrap(data.value);
    case 'programStaffTitle':
      return wrap((
        <Link route={{ tag: 'requestForInformationEdit', value: { rfiId: data.value.rfiId }}} className='mb-1'>
          {data.value.text}
        </Link>
      ), true);
    case 'nonProgramStaffTitle':
      return wrap((
        <div>
          <Link route={{ tag: 'requestForInformationView', value: { rfiId: data.value.rfiId }}}>{data.value.text}</Link>
          <div className='small text-uppercase text-secondary mt-n1'>{data.value.entity}</div>
        </div>
      ), true);
    case 'publicSectorEntity':
      return wrap(data.value, true);
    case 'status':
      return wrap((<StatusBadge status={data.value} />));
    case 'publishDate':
    case 'lastUpdated':
    case 'closingDate':
      return wrap(formatTableDate(data.value));
    case 'discoveryDay':
      const showCheck = data.value[0] && rfiToRfiStatus(data.value[1]) === RfiStatus.Open;
      return wrap(showCheck ? (<Icon name='check' color='body' width={1.5} height={1.5} />) : null, false, true);
  }
}

// Add status property to each RFI
// as we want to cache the RFI status on each one up front.
interface Rfi extends PublicRfi {
  status: RfiStatus;
}

export interface State {
  userType?: UserType;
  rfis: Rfi[];
  visibleRfis: Rfi[];
  statusFilter: Select.State;
  categoryFilter: Select.State;
  searchFilter: ShortText.State;
  table: Immutable<TableComponent.State<TableCellData>>;
};

type FormFieldKeys
  = 'statusFilter'
  | 'categoryFilter'
  | 'searchFilter';

export type RouteParams = null;

type InnerMsg
  = ADT<'statusFilter', Select.Value>
  | ADT<'categoryFilter', Select.Value>
  | ADT<'searchFilter', string>
  | ADT<'table', TableComponent.Msg>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

const init: PageInit<RouteParams, SharedState, State, Msg> = async ({ shared }) => {
  const { session } = shared;
  const userType = session && session.user && session.user.type;
  const result = await readManyRfis();
  let rfis: Rfi[] = [];
  if (result.tag === 'valid') {
    // Cache status on each RFI.
    rfis = result.value.items.map(rfi => ({
      ...rfi,
      status: rfiToRfiStatus(rfi)
    }));
    // Sort rfis by status first, then name.
    rfis = rfis.sort((a, b) => {
      if (a.status === b.status) {
        return compareDates(a.publishedAt, b.publishedAt) * -1;
      } else if (a.status === RfiStatus.Open) {
        return -1;
      } else if (b.status === RfiStatus.Open) {
        return 1;
      } else {
        return a.status.localeCompare(b.status);
      }
    });
  }
  return {
    userType,
    rfis,
    visibleRfis: rfis,
    statusFilter: Select.init({
      id: 'rfi-list-filter-status',
      required: false,
      label: 'Status',
      placeholder: 'All',
      options: [
        { value: RfiStatus.Open, label: rfiStatusToTitleCase(RfiStatus.Open) },
        { value: RfiStatus.Closed, label: rfiStatusToTitleCase(RfiStatus.Closed) }
      ]
    }),
    categoryFilter: Select.init({
      id: 'rfi-list-filter-category',
      required: false,
      label: 'Commodity Code',
      placeholder: 'All',
      options: AVAILABLE_CATEGORIES.toJS().map(value => ({ label: value, value }))
    }),
    searchFilter: ShortText.init({
      id: 'rfi-list-filter-search',
      type: 'text',
      required: false,
      placeholder: 'Search'
    }),
    table: immutable(await Table.init({
      idNamespace: 'rfi-list',
      THView: TableComponent.DefaultTHView,
      TDView
    }))
  };
};

function rfiMatchesStatus(rfi: Rfi, filterStatus: RfiStatus | null): boolean {
  if (!filterStatus) { return false; }
  switch (rfi.status) {
    case RfiStatus.Expired:
      return filterStatus === RfiStatus.Closed;
    default:
      return rfi.status === filterStatus;
  }
}

function rfiMatchesCategory(rfi: PublicRfi, category: string): boolean {
  return rfi.latestVersion.categories.includes(category);
}

function rfiMatchesSearch(rfi: PublicRfi, query: RegExp): boolean {
  return !!rfi.latestVersion.title.match(query);
}

function updateAndQuery<K extends FormFieldKeys>(state: Immutable<State>, key: K, value: State[K]['value']): Immutable<State> {
  // Update state with the filter value.
  state = state.setIn([key, 'value'], value);
  // Query the list of available RFIs based on all filters' state.
  const statusQuery = state.statusFilter.value && state.statusFilter.value.value;
  const categoryQuery = state.categoryFilter.value && state.categoryFilter.value.value;
  const rawSearchQuery = state.searchFilter.value;
  const searchQuery = rawSearchQuery ? new RegExp(state.searchFilter.value.split(/\s+/).join('.*'), 'i') : null;
  const rfis = state.rfis.filter(rfi => {
    let match = true;
    match = match && (!statusQuery || rfiMatchesStatus(rfi, parseRfiStatus(statusQuery)));
    match = match && (!categoryQuery || rfiMatchesCategory(rfi, categoryQuery));
    match = match && (!searchQuery || rfiMatchesSearch(rfi, searchQuery));
    return match;
  });
  return state.set('visibleRfis', rfis); ;
}

const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'statusFilter':
      return [updateAndQuery(state, 'statusFilter', msg.value)];
    case 'categoryFilter':
      return [updateAndQuery(state, 'categoryFilter', msg.value)];
    case 'searchFilter':
      return [updateAndQuery(state, 'searchFilter', msg.value)];
    case 'table':
      return updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'table' as const, value }),
        childStatePath: ['table'],
        childUpdate: Table.update,
        childMsg: msg.value
      });
    default:
      return [state];
  }
};

const Filters: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const onChangeSelect = (tag: any) => Select.makeOnChange(dispatch, value => ({ tag, value }));
  const onChangeShortText = (tag: any) => ShortText.makeOnChange(dispatch, value => ({ tag, value }));
  const categoryFilterElement = state.userType !== UserType.ProgramStaff
    ? null
    : (
        <Col xs='12' md='4'>
          <Select.view
            state={state.categoryFilter}
            onChange={onChangeSelect('categoryFilter')} />
        </Col>
      );
  return (
    <div>
      <Row>
        <Col xs='12'>
          <h6 className='text-secondary mb-3 d-none d-md-block'>
            Filter By:
          </h6>
        </Col>
      </Row>
      <Row className='d-none d-md-flex align-items-end'>
        <Col xs='12' md='3'>
          <Select.view
            state={state.statusFilter}
            onChange={onChangeSelect('statusFilter')} />
        </Col>
        {categoryFilterElement}
        <Col xs='12' md='4' className='ml-md-auto'>
          <ShortText.view
            state={state.searchFilter}
            onChange={onChangeShortText('searchFilter')} />
        </Col>
      </Row>
    </div>
  );
};

const programStaffTableHeadCells: TableComponent.THSpec[] = [
  { children: 'RFI Number' },
  {
    children: 'Status',
    style: {
      width: '90px'
    }
  },
  {
    children: 'Project Title',
    style: {
      minWidth: '280px'
    }
  },
  {
    children: 'Public Sector Entity',
    style: {
      minWidth: '190px'
    }
  },
  {
    children: 'Last Updated',
    style: {
      width: '130px'
    }
  },
  {
    children: 'Closing Date',
    style: {
      width: '125px'
    }
  },
  {
    children: (<Icon name='calendar' color='secondary' />),
    tooltipText: 'Discovery Day',
    className: 'text-center',
    style: {
      width: '50px'
    }
  }
];

const nonProgramStaffTableHeadCells: TableComponent.THSpec[] = [
  { children: 'RFI Number' },
  {
    children: 'Published Date',
    style: {
      width: '140px'
    }
  },
  {
    children: 'Status',
    style: {
      width: '90px'
    }
  },
  {
    children: 'Project Title',
    style: {
      minWidth: '280px'
    }
  },
  {
    children: 'Closing Date',
    style: {
      width: '125px'
    }
  },
  {
    children: (<Icon name='calendar' color='secondary' />),
    tooltipText: 'Discovery Day Available',
    className: 'text-center',
    style: {
      width: '50px'
    }
  },
  {
    children: 'Last Updated',
    style: {
      width: '130px'
    }
  }
];

function programStaffTableBodyRows(rfis: Rfi[]): Array<Array<TableComponent.TDSpec<TableCellData>>> {
  return rfis.map(rfi => {
    const version = rfi.latestVersion;
    return [
      TableComponent.makeTDSpec({ tag: 'rfiNumber' as const, value: version.rfiNumber }),
      TableComponent.makeTDSpec({ tag: 'status' as const, value: rfi.status }),
      TableComponent.makeTDSpec({
        tag: 'programStaffTitle' as const,
        value: {
          rfiId: rfi._id,
          text: version.title
        }
      }),
      TableComponent.makeTDSpec({ tag: 'publicSectorEntity' as const, value: version.publicSectorEntity }),
      TableComponent.makeTDSpec({ tag: 'lastUpdated' as const, value: version.createdAt }),
      TableComponent.makeTDSpec({ tag: 'closingDate' as const, value: version.closingAt }),
      TableComponent.makeTDSpec({ tag: 'discoveryDay' as const, value: [version.discoveryDay, rfi] as [boolean, PublicRfi] })
    ];
  });
}

function nonProgramStaffTableBodyRows(rfis: Rfi[]): Array<Array<TableComponent.TDSpec<TableCellData>>> {
  return rfis.map(rfi => {
    const version = rfi.latestVersion;
    return [
      TableComponent.makeTDSpec({ tag: 'rfiNumber' as const, value: version.rfiNumber }),
      TableComponent.makeTDSpec({ tag: 'publishDate' as const, value: rfi.publishedAt }),
      TableComponent.makeTDSpec({ tag: 'status' as const, value: rfi.status }),
      TableComponent.makeTDSpec({
        tag: 'nonProgramStaffTitle' as const,
        value: {
          rfiId: rfi._id,
          text: version.title,
          entity: version.publicSectorEntity
        }
      }),
      TableComponent.makeTDSpec({ tag: 'closingDate' as const, value: version.closingAt }),
      TableComponent.makeTDSpec({ tag: 'discoveryDay' as const, value: [version.discoveryDay, rfi] as [boolean, PublicRfi] }),
      TableComponent.makeTDSpec({ tag: 'lastUpdated' as const, value: version.createdAt })
    ];
  });
}

const ConditionalTable: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (!state.rfis.length) { return (<div>There are no RFIs currently available.</div>); }
  if (!state.visibleRfis.length) { return (<div>There are no RFIs that match the search criteria.</div>); }
  const isProgramStaff = state.userType === UserType.ProgramStaff;
  const headCells = isProgramStaff ? programStaffTableHeadCells : nonProgramStaffTableHeadCells;
  const bodyRows = isProgramStaff ? programStaffTableBodyRows(state.visibleRfis) : nonProgramStaffTableBodyRows(state.visibleRfis);
  const dispatchTable: Dispatch<TableComponent.Msg> = mapComponentDispatch(dispatch, value => ({ tag: 'table' as const, value }));
  return (
    <Table.view
      className='text-nowrap'
      style={{ lineHeight: '1.5rem' }}
      headCells={headCells}
      bodyRows={bodyRows}
      state={state.table}
      dispatch={dispatchTable} />
  );
}

const ConditionalCreateButton: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (state.userType !== UserType.ProgramStaff) { return null; }
  return (
    <Col xs='12' md='auto'>
      <Link route={{ tag: 'requestForInformationCreate', value: null }} button color='info'>Create an RFI</Link>
    </Col>
  );
}

const view: ComponentView<State, Msg> = props => {
  return (
    <div>
      <Row className='mb-5 mb-md-2 justify-content-md-between'>
        <Col xs='12' md='auto'>
          <h1 className='mb-3 mb-md-0'>Requests for Information (RFIs)</h1>
        </Col>
        <ConditionalCreateButton {...props} />
      </Row>
      <Row className='mb-3 d-none d-md-flex'>
        <Col xs='12' md='8'>
          <p>
            Click on an RFI's title in the table below to view it.
          </p>
        </Col>
      </Row>
      <Filters {...props} />
      <ConditionalTable {...props} />
    </div>
  );
};

export const component: PageComponent<RouteParams, SharedState, State, Msg> = {
  init,
  update,
  view,
  getAlerts: emptyPageAlerts,
  getMetadata() {
    return makePageMetadata('Requests for Information');
  },
  getBreadcrumbs: emptyPageBreadcrumbs,
  getModal: noPageModal
};
