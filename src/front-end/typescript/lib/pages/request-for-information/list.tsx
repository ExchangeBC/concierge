import { Page } from 'front-end/lib/app/types';
import * as TableComponent from 'front-end/lib/components/table';
import { Component, ComponentMsg, ComponentView, Dispatch, immutable, Immutable, Init, mapComponentDispatch, Update, updateComponentChild, View } from 'front-end/lib/framework';
import { readManyRfis } from 'front-end/lib/http/api';
import StatusBadge from 'front-end/lib/pages/request-for-information/views/status-badge';
import { parseRfiStatus, RfiStatus, rfiStatusToTitleCase, rfiToRfiStatus } from 'front-end/lib/types';
import Icon from 'front-end/lib/views/icon';
import * as Select from 'front-end/lib/views/input/select';
import * as ShortText from 'front-end/lib/views/input/short-text';
import * as PageContainer from 'front-end/lib/views/layout/page-container';
import Link from 'front-end/lib/views/link';
import { truncate } from 'lodash';
import { CSSProperties, default as React, ReactElement } from 'react';
import { Col, Row } from 'reactstrap';
import AVAILABLE_CATEGORIES from 'shared/data/categories';
import { compareDates, rawFormatDate } from 'shared/lib';
import { PublicRfi } from 'shared/lib/resources/request-for-information';
import { ADT } from 'shared/lib/types';

// Define Table component.

type TableCellData
  = ADT<'rfiNumber', string>
  | ADT<'status', RfiStatus>
  | ADT<'title', string>
  | ADT<'publicSectorEntity', string>
  | ADT<'lastUpdated', Date>
  | ADT<'closing', Date>
  | ADT<'discoveryDay', boolean>;

const Table: TableComponent.TableComponent<TableCellData> = TableComponent.component();

const TDView: View<TableComponent.TDProps<TableCellData>> = props => {
  return null;
}

// Add status property to each RFI
// as we want to cache the RFI status on each one up front.
interface Rfi extends PublicRfi {
  status: RfiStatus | null;
}

export interface State {
  rfis: Rfi[];
  visibleRfis: Rfi[];
  statusFilter: Select.State;
  categoryFilter: Select.State;
  searchFilter: ShortText.State;
  table: Immutable<TableComponent.State<TableCellData>>;
};

export type Params = null;

type InnerMsg
  = ADT<'statusFilter', string>
  | ADT<'categoryFilter', string>
  | ADT<'searchFilter', string>
  | ADT<'table', TableComponent.Msg>;

export type Msg = ComponentMsg<InnerMsg, Page>;

export const init: Init<Params, State> = async () => {
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
      } else if (!b.status || a.status === RfiStatus.Open) {
        return -1;
      } else if (!a.status || b.status === RfiStatus.Open) {
        return 1;
      } else {
        return a.status.localeCompare(b.status);
      }
    });
  }
  return {
    rfis,
    visibleRfis: rfis,
    statusFilter: Select.init({
      id: 'rfi-list-filter-status',
      value: '',
      required: false,
      label: 'Status',
      unselectedLabel: 'All',
      options: [
        { value: RfiStatus.Open, label: rfiStatusToTitleCase(RfiStatus.Open) },
        { value: RfiStatus.Closed, label: rfiStatusToTitleCase(RfiStatus.Closed) }
      ]
    }),
    categoryFilter: Select.init({
      id: 'rfi-list-filter-category',
      value: '',
      required: false,
      label: 'Commodity Code',
      unselectedLabel: 'All',
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
  return !!rfi.latestVersion && rfi.latestVersion.categories.includes(category);
}

function rfiMatchesSearch(rfi: PublicRfi, query: RegExp): boolean {
  return !!rfi.latestVersion && !!rfi.latestVersion.title.match(query);
}

function updateAndQuery(state: Immutable<State>, key?: string, value?: string): Immutable<State> {
  // Update state with the filter value.
  if (key && value !== undefined) {
    state = state.setIn([key, 'value'], value);
  }
  // Query the list of available RFIs based on all filters' state.
  const statusQuery = state.statusFilter.value;
  const categoryQuery = state.categoryFilter.value;
  const rawSearchQuery = state.searchFilter.value;
  const searchQuery = rawSearchQuery ? new RegExp(state.searchFilter.value.split('').join('.*'), 'i') : null;
  const rfis = state.rfis.filter(rfi => {
    let match = true;
    match = match && (!statusQuery || rfiMatchesStatus(rfi, parseRfiStatus(statusQuery)));
    match = match && (!categoryQuery || rfiMatchesCategory(rfi, categoryQuery));
    match = match && (!searchQuery || rfiMatchesSearch(rfi, searchQuery));
    return match;
  });
  return state.set('visibleRfis', rfis); ;
}

export const update: Update<State, Msg> = (state, msg) => {
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
        mapChildMsg: value => ({ tag: 'table', value }),
        childStatePath: ['table'],
        childUpdate: Table.update,
        childMsg: msg.value
      });
    default:
      return [state];
  }
};

export const Filters: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const onChangeSelect = (tag: any) => Select.makeOnChange(dispatch, e => ({ tag, value: e.currentTarget.value }));
  const onChangeShortText = (tag: any) => ShortText.makeOnChange(dispatch, e => ({ tag, value: e.currentTarget.value }));
  return (
    <Row className='d-none d-md-flex align-items-end'>
      <Col xs='12' md='3'>
        <Select.view
          state={state.statusFilter}
          onChange={onChangeSelect('statusFilter')} />
      </Col>
      <Col xs='12' md='4'>
        <Select.view
          state={state.categoryFilter}
          onChange={onChangeSelect('categoryFilter')} />
      </Col>
      <Col xs='12' md='4' className='ml-md-auto'>
        <ShortText.view
          state={state.searchFilter}
          onChange={onChangeShortText('searchFilter')} />
      </Col>
    </Row>
  );
};

function formatTableDate(date: Date): string {
  return rawFormatDate(date, 'YYYY-MM-DD', false);
}

interface TableHeadingCellProps {
  className?: string;
  style?: CSSProperties;
  children: ReactElement<any> | Array<ReactElement<any>> | string;
}

const TableHeadingCell: View<TableHeadingCellProps> = ({ className, style, children }) => {
  return (<th className={`text-secondary text-uppercase small font-weight-bold ${className || ''}`} style={style}>{children}</th>);
};

const truncateString = (s: string, length: number) => truncate(s, { length, separator: /\s\+/ });
export const Results: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const noneFound = (<tr><td className='text-nowrap'>No RFIs found.</td></tr>);
  let children: ReactElement<any> | Array<ReactElement<any>> = noneFound;
  if (state.visibleRfis.length) {
    children = state.visibleRfis.reduce((acc: Array<ReactElement<any>>, rfi, i) => {
      const version = rfi.latestVersion;
      if (!version) { return acc }
      acc.push((
          <tr key={`rfi-list-results-row-${i}`}>
            <td className='text-nowrap'>{version.rfiNumber}</td>
            <td><StatusBadge status={rfi.status || undefined} /></td>
            <td>
              <a href={`/requests-for-information/${rfi._id}/edit`}>
                {truncateString(version.title, 50)}
              </a>
            </td>
            <td>{truncateString(version.publicSectorEntity, 50)}</td>
            <td>{formatTableDate(version.createdAt)}</td>
            <td>{formatTableDate(version.closingAt)}</td>
            <td className='text-center'>{version.discoveryDay ? (<Icon name='check' color='body' width={1.5} height={1.5} />) : ''}</td>
          </tr>
      ));
      return acc;
    }, []);
    if (!children.length) { children = noneFound; }
  }
  return (
    <Row>
      <Col xs='12'>
        <Table className='mb-0' hover={!!state.visibleRfis.length} responsive>
          <thead>
            <tr className='bg-light text-nowrap'>
              <TableHeadingCell style={{ width: '140px' }}>
                RFI Number
              </TableHeadingCell>
              <TableHeadingCell style={{ width: '140px' }}>
                Status
              </TableHeadingCell>
              <TableHeadingCell style={{ width: '300px', minWidth: '300px' }}>
                Project Title
              </TableHeadingCell>
              <TableHeadingCell style={{ width: '210px', minWidth: '210px' }}>
                Public Sector Entity
              </TableHeadingCell>
              <TableHeadingCell style={{ width: '130px' }}>
                Last Updated
              </TableHeadingCell>
              <TableHeadingCell style={{ width: '110px', minWidth: '110px' }}>
                Closing
              </TableHeadingCell>
              <TableHeadingCell style={{ width: '80px' }} className='text-center' >
                <Icon name='calendar' color='secondary' />
              </TableHeadingCell>
            </tr>
          </thead>
          <tbody>
            {children}
          </tbody>
        </Table>
      </Col>
    </Row>
  );
};

export const view: ComponentView<State, Msg> = props => {
  const { state, dispatch } = props;
  const dispatchTable: Dispatch<ComponentMsg<TableComponent.Msg, Page>> = mapComponentDispatch(dispatch, value => ({ tag: 'table', value }));
  return (
    <PageContainer.View paddingY>
      <Row className='mb-5 mb-md-2 justify-content-md-between'>
        <Col xs='12' md='auto'>
          <h1 className='mb-3 mb-md-0'>Concierge RFIs</h1>
        </Col>
        <Col xs='12' md='auto'>
          <Link page={{ tag: 'requestForInformationCreate', value: {} }} buttonColor='secondary' text='Create RFI' />
        </Col>
      </Row>
      <Row className='mb-3 d-none d-md-flex'>
        <Col xs='12' md='8'>
          <p>
            Click on an RFI's title in the table below to view it.
          </p>
        </Col>
      </Row>
      <Filters {...props} />
      <Table.view
        state={state.table}
        dispatch={dispatchTable} />
    </PageContainer.View>
  );
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
