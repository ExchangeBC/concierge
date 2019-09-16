import { VI_APPLICATION_DOWNLOAD_URL } from 'front-end/config';
import { makeStartLoading, makeStopLoading, UpdateState } from 'front-end/lib';
import { Route } from 'front-end/lib/app/types';
import * as TableComponent from 'front-end/lib/components/table';
import { ComponentView, Dispatch, GlobalComponentMsg, Immutable, immutable, Init, mapComponentDispatch, newRoute, PageGetModal, Update, updateComponentChild, View } from 'front-end/lib/framework';
import { hasUserAcceptedTerms, readManyVisForVendors } from 'front-end/lib/http/api';
import { getLogItemTypeStatusDropdownItems } from 'front-end/lib/pages/vendor-idea/lib';
import { LogItemTypeBadge } from 'front-end/lib/pages/vendor-idea/views/log-item-type-badge';
import LogItemTypeSelectGroupLabel from 'front-end/lib/pages/vendor-idea/views/log-item-type-select-group-label';
import * as Select from 'front-end/lib/views/form-field/select';
import * as ShortText from 'front-end/lib/views/form-field/short-text';
import Link from 'front-end/lib/views/link';
import { default as React, ReactElement } from 'react';
import { Col, Row } from 'reactstrap';
import { compareDates, rawFormatDate } from 'shared/lib';
import { PublicSessionUser } from 'shared/lib/resources/session';
import { PublicVendorIdeaSlimForVendors } from 'shared/lib/resources/vendor-idea';
import { LogItemType, parseLogItemType } from 'shared/lib/resources/vendor-idea/log-item';
import { ADT, profileToName } from 'shared/lib/types';

function formatTableDate(date: Date): string {
  return rawFormatDate(date, 'YYYY-MM-DD', false);
}

// Define Table component.

type TableCellData
  = ADT<'status', LogItemType>
  | ADT<'title', { title: string, viId: string, dispatch: Dispatch<Msg> }>
  | ADT<'dateSubmitted', Date>
  | ADT<'lastUpdated', Date>;

const Table: TableComponent.TableComponent<TableCellData> = TableComponent.component();

const TDView: View<TableComponent.TDProps<TableCellData>> = ({ data }) => {
  const wrap = (child: string | null | ReactElement<any>, wrapText = false, center = false) => {
    return (<td className={`${wrapText ? 'text-wrap' : ''} ${center ? 'text-center' : ''} align-top`}>{child}</td>);
  };
  switch (data.tag) {
    case 'status':
      return wrap((<LogItemTypeBadge logItemType={data.value} />));
    case 'title':
      return wrap((
        <Link onClick={() => data.value.dispatch({ tag: 'editVi', value: data.value.viId })} className='mb-1'>
          {data.value.title}
        </Link>
      ), true);
    case 'dateSubmitted':
    case 'lastUpdated':
      return wrap(formatTableDate(data.value));
  }
}

interface VendorIdea extends PublicVendorIdeaSlimForVendors {
  createdByName: string;
}

export interface State {
  createLoading: number;
  promptCreateConfirmation: boolean;
  promptEditConfirmation?: string;
  vis: VendorIdea[];
  visibleVis: VendorIdea[];
  sessionUser: PublicSessionUser;
  statusFilter: Select.State;
  searchFilter: ShortText.State;
  table: Immutable<TableComponent.State<TableCellData>>;
};

type FormFieldKeys
  = 'statusFilter'
  | 'searchFilter';

export interface Params {
  sessionUser: PublicSessionUser;
}

type InnerMsg
  = ADT<'statusFilter', Select.Value>
  | ADT<'searchFilter', string>
  | ADT<'table', TableComponent.Msg>
  | ADT<'createVi'>
  | ADT<'editVi', string>
  | ADT<'hideCreateConfirmationPrompt'>
  | ADT<'hideEditConfirmationPrompt'>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

export const init: Init<Params, State> = async ({ sessionUser }) => {
  const result = await readManyVisForVendors();
  let vis: VendorIdea[] = [];
  if (result.tag === 'valid') {
    vis = result.value.items
      .map(vi => ({ ...vi, createdByName: profileToName(vi.createdBy.profile) }))
      // Sort vendor ideas by date submitted.
      .sort((a, b) => {
        return compareDates(a.createdAt, b.createdAt) * -1;
      });
  }
  return {
    createLoading: 0,
    promptCreateConfirmation: false,
    promptEditConfirmation: undefined,
    sessionUser,
    vis,
    visibleVis: vis,
    statusFilter: Select.init({
      id: 'vi-list-filter-status',
      required: false,
      label: 'Status',
      placeholder: 'All',
      options: { tag: 'optionGroups', value: getLogItemTypeStatusDropdownItems() }
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

function viMatchesStatus(vi: VendorIdea, filterStatus: LogItemType | null): boolean {
  if (!filterStatus) { return false; }
  return vi.latestStatus === filterStatus;
}

function viMatchesSearch(vi: VendorIdea, query: RegExp): boolean {
  return !!vi.latestVersion.description.title.match(query) || !!vi.createdByName.match(query);
}

function updateAndQuery<K extends FormFieldKeys>(state: Immutable<State>, key: K, value: State[K]['value']): Immutable<State> {
  // Update state with the filter value.
  state = state.setIn([key, 'value'], value);
  // Query the list of available RFIs based on all filters' state.
  const statusQuery = state.statusFilter.value && state.statusFilter.value.value;
  const rawSearchQuery = state.searchFilter.value;
  const searchQuery = rawSearchQuery ? new RegExp(state.searchFilter.value.split(/\s+/).join('.*'), 'i') : null;
  const vis = state.vis.filter(vi => {
    let match = true;
    match = match && (!statusQuery || viMatchesStatus(vi, parseLogItemType(statusQuery)));
    match = match && (!searchQuery || viMatchesSearch(vi, searchQuery));
    return match;
  });
  return state.set('visibleVis', vis); ;
}

const startCreateLoading: UpdateState<State> = makeStartLoading('createLoading');
const stopCreateLoading: UpdateState<State> = makeStopLoading('createLoading');

export const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'statusFilter':
      return [updateAndQuery(state, 'statusFilter', msg.value)];
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
    case 'createVi':
      return [
        startCreateLoading(state),
        async (state, dispatch) => {
          state = stopCreateLoading(state);
          if (state.promptCreateConfirmation || (await hasUserAcceptedTerms(state.sessionUser.id))) {
            dispatch(newRoute({
              tag: 'viCreate',
              value: null
            }));
            return null;
          } else {
            return state.set('promptCreateConfirmation', true);
          }
        }
      ];
    case 'editVi':
      return [
        state,
        async (state, dispatch) => {
          if (state.promptEditConfirmation || (await hasUserAcceptedTerms(state.sessionUser.id))) {
            dispatch(newRoute({
              tag: 'viEdit',
              value: { viId: msg.value }
            }));
            return null;
          } else {
            return state.set('promptEditConfirmation', msg.value);
          }
        }
      ];
    case 'hideCreateConfirmationPrompt':
      return [state.set('promptCreateConfirmation', false)];
    case 'hideEditConfirmationPrompt':
      return [state.set('promptEditConfirmation', undefined)];
    default:
      return [state];
  }
};

const Filters: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const onChangeSelect = (tag: any) => Select.makeOnChange(dispatch, value => ({ tag, value }));
  const onChangeShortText = (tag: any) => ShortText.makeOnChange(dispatch, value => ({ tag, value }));
  return (
    <div>
      <Row>
        <Col xs='12'>
          <h3 className='mb-3'>
            Submission(s)
          </h3>
        </Col>
      </Row>
      <Row className='d-none d-md-flex align-items-end'>
        <Col xs='12' md='5' lg='4'>
          <Select.view
            state={state.statusFilter}
            formatGroupLabel={LogItemTypeSelectGroupLabel}
            onChange={onChangeSelect('statusFilter')} />
        </Col>
        <Col xs='12' md='4' className='ml-md-auto'>
          <ShortText.view
            state={state.searchFilter}
            onChange={onChangeShortText('searchFilter')} />
        </Col>
      </Row>
    </div>
  );
};

const tableHeadCells: TableComponent.THSpec[] = [
  {
    children: 'Status',
    style: {
      width: '25%'
    }
  },
  {
    children: 'Title',
    style: {
      minWidth: '340px',
      width: '55%'
    }
  },
  {
    children: 'Date Submitted',
    style: {
      width: '10%'
    }
  },
  {
    children: 'Last Updated',
    style: {
      width: '10%'
    }
  }
];

function tableBodyRows(vis: VendorIdea[], dispatch: Dispatch<Msg>): Array<Array<TableComponent.TDSpec<TableCellData>>> {
  return vis.map(vi => {
    return [
      TableComponent.makeTDSpec({ tag: 'status' as const, value: vi.latestStatus }),
      TableComponent.makeTDSpec({
        tag: 'title' as const,
        value: {
          viId: vi._id,
          title: vi.latestVersion.description.title,
          dispatch
        }
      }),
      TableComponent.makeTDSpec({ tag: 'dateSubmitted' as const, value: vi.createdAt }),
      TableComponent.makeTDSpec({ tag: 'lastUpdated' as const, value: vi.latestVersion.createdAt })
    ];
  });
}

const ConditionalTable: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (!state.vis.length) { return (<div>There are no VIIs currently available.</div>); }
  if (!state.visibleVis.length) { return (<div>There are no VIIs that match the search criteria.</div>); }
  const dispatchTable: Dispatch<TableComponent.Msg> = mapComponentDispatch(dispatch, value => ({ tag: 'table' as const, value }));
  return (
    <Table.view
      className='text-nowrap'
      style={{ lineHeight: '1.5rem' }}
      headCells={tableHeadCells}
      bodyRows={tableBodyRows(state.visibleVis, dispatch)}
      state={state.table}
      dispatch={dispatchTable} />
  );
}

export const view: ComponentView<State, Msg> = props => {
  return (
    <div>
      <Row className='mb-5'>
        <Col xs='12' md='9' lg='8'>
          <h1>My Vendor-Initiated Ideas</h1>
          <p>
            To submit a Vendor-Initiated Idea (VII), <b>please download and fill out the detailed information portion of the application</b> using the "Download Application – Detailed Information" button below. Once the application has been completed, you may submit your idea for the Procurement Concierge Program's staff to review by clicking the "Create Vendor-Initiated Idea" button and filling out the form provided.
          </p>
          <div className='d-flex flex-column flex-md-row align-items-start'>
            <Link button download color='primary' href={VI_APPLICATION_DOWNLOAD_URL} className='mr-0 mr-md-2 mb-2 mb-md-0'>1. Download Application – Detailed Information</Link>
            <Link button color='info-alt' route={{ tag: 'viCreate', value: null }}>2. Create Vendor-Initiated Idea</Link>
          </div>
        </Col>
      </Row>
      <Filters {...props} />
      <ConditionalTable {...props} />
    </div>
  );
};

export const getModal: PageGetModal<State, Msg> = state => {
  if (state.promptCreateConfirmation) {
    return {
      title: 'Review Terms and Conditions',
      body: 'You must accept the Procurement Concierge Terms and Conditions in order to create a Vendor-Initiated Idea.',
      onCloseMsg: { tag: 'hideCreateConfirmationPrompt', value: undefined },
      actions: [
        {
          text: 'Review Terms & Conditions',
          color: 'primary',
          button: true,
          msg: { tag: 'createVi', value: undefined }
        },
        {
          text: 'Go Back',
          color: 'secondary',
          msg: { tag: 'hideCreateConfirmationPrompt', value: undefined }
        }
      ]
    };
  } else if (state.promptEditConfirmation) {
    return {
      title: 'Review Terms and Conditions',
      body: 'You must accept the Procurement Concierge Terms and Conditions in order to view or edit a Vendor-Initiated Idea.',
      onCloseMsg: { tag: 'hideEditConfirmationPrompt', value: undefined },
      actions: [
        {
          text: 'Review Terms & Conditions',
          color: 'primary',
          button: true,
          msg: { tag: 'editVi', value: state.promptEditConfirmation }
        },
        {
          text: 'Go Back',
          color: 'secondary',
          msg: { tag: 'hideEditConfirmationPrompt', value: undefined }
        }
      ]
    };
  } else {
    return null;
  }
};
