import { makePageMetadata, makeStartLoading, makeStopLoading, UpdateState } from 'front-end/lib';
import router from 'front-end/lib/app/router';
import { Route, SharedState } from 'front-end/lib/app/types';
import * as Table from 'front-end/lib/components/table';
import { ComponentView, Dispatch, emptyPageAlerts, emptyPageBreadcrumbs, GlobalComponentMsg, Immutable, immutable, mapComponentDispatch, newRoute, PageComponent, PageInit, Update, updateComponentChild } from 'front-end/lib/framework';
import { hasUserAcceptedTerms, readManyRfis } from 'front-end/lib/http/api';
import StatusBadge from 'front-end/lib/pages/request-for-information/views/status-badge';
import { WarningId } from 'front-end/lib/pages/terms-and-conditions';
import * as Select from 'front-end/lib/views/form-field/select';
import * as ShortText from 'front-end/lib/views/form-field/short-text';
import Icon from 'front-end/lib/views/icon';
import Link from 'front-end/lib/views/link';
import { get } from 'lodash';
import React from 'react';
import { Col, Row } from 'reactstrap';
import AVAILABLE_CATEGORIES from 'shared/data/categories';
import { compareDates, rawFormatDate } from 'shared/lib';
import { PublicRfi, rfiToRfiStatus } from 'shared/lib/resources/request-for-information';
import { PublicSessionUser } from 'shared/lib/resources/session';
import { ADT, parseRfiStatus, RfiStatus, rfiStatusToTitleCase, UserType } from 'shared/lib/types';

// Add status property to each RFI
// as we want to cache the RFI status on each one up front.
interface Rfi extends PublicRfi {
  status: RfiStatus;
}

export interface State {
  rfis: Rfi[];
  sessionUser?: PublicSessionUser;
  visibleRfis: Rfi[];
  createLoading: number;
  promptCreateConfirmation: boolean;
  statusFilter: Select.State;
  categoryFilter: Select.State;
  searchFilter: ShortText.State;
  table: Immutable<Table.State>;
  promptEditConfirmation?: string;
}

type FormFieldKeys = 'statusFilter' | 'categoryFilter' | 'searchFilter';

export type RouteParams = null;

type InnerMsg = ADT<'statusFilter', Select.Value> | ADT<'categoryFilter', Select.Value> | ADT<'searchFilter', string> | ADT<'table', Table.Msg> | ADT<'createRfi'> | ADT<'hideCreateConfirmationPrompt'> | ADT<'editRfi', string> | ADT<'hideEditConfirmationPrompt'>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

const init: PageInit<RouteParams, SharedState, State, Msg> = async ({ shared }) => {
  const { session } = shared;
  const sessionUser = session && session.user;
  const result = await readManyRfis();
  let rfis: Rfi[] = [];
  if (result.tag === 'valid') {
    // Cache status on each RFI.
    rfis = result.value.items.map((rfi) => ({
      ...rfi,
      status: rfiToRfiStatus(rfi)
    }));
    // Sort rfis by status first, then name.
    rfis = rfis.sort((a, b) => {
      if (a.status === b.status) {
        return compareDates(a.publishedAt || a.createdAt, b.publishedAt || b.createdAt) * -1;
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
    createLoading: 0,
    promptCreateConfirmation: false,
    promptEditConfirmation: undefined,
    sessionUser,
    rfis,
    visibleRfis: rfis,
    statusFilter: Select.init({
      id: 'rfi-list-filter-status',
      required: false,
      label: 'Status',
      placeholder: 'All',
      options: {
        tag: 'options',
        value: [
          { value: RfiStatus.Open, label: rfiStatusToTitleCase(RfiStatus.Open) },
          { value: RfiStatus.Closed, label: rfiStatusToTitleCase(RfiStatus.Closed) }
        ]
      }
    }),
    categoryFilter: Select.init({
      id: 'rfi-list-filter-category',
      required: false,
      label: 'Commodity Code',
      placeholder: 'All',
      options: {
        tag: 'options',
        value: AVAILABLE_CATEGORIES.toJS().map((value) => ({ label: value, value }))
      }
    }),
    searchFilter: ShortText.init({
      id: 'rfi-list-filter-search',
      type: 'text',
      required: false,
      placeholder: 'Search'
    }),
    table: immutable(
      await Table.init({
        idNamespace: 'rfi-list'
      })
    )
  };
};

function rfiMatchesStatus(rfi: Rfi, filterStatus: RfiStatus | null): boolean {
  if (!filterStatus) {
    return false;
  }
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
  return !!rfi.latestVersion.title.match(query) || !!rfi.latestVersion.publicSectorEntity.match(query);
}

function updateAndQuery<K extends FormFieldKeys>(state: Immutable<State>, key: K, value: State[K]['value']): Immutable<State> {
  // Update state with the filter value.
  state = state.setIn([key, 'value'], value);
  // Query the list of available RFIs based on all filters' state.
  const statusQuery = state.statusFilter.value && state.statusFilter.value.value;
  const categoryQuery = state.categoryFilter.value && state.categoryFilter.value.value;
  const rawSearchQuery = state.searchFilter.value;
  const searchQuery = rawSearchQuery ? new RegExp(state.searchFilter.value.split(/\s+/).join('.*'), 'i') : null;
  const rfis = state.rfis.filter((rfi) => {
    let match = true;
    match = match && (!statusQuery || rfiMatchesStatus(rfi, parseRfiStatus(statusQuery)));
    match = match && (!categoryQuery || rfiMatchesCategory(rfi, categoryQuery));
    match = match && (!searchQuery || rfiMatchesSearch(rfi, searchQuery));
    return match;
  });
  return state.set('visibleRfis', rfis);
}

const startCreateLoading: UpdateState<State> = makeStartLoading('createLoading');
const stopCreateLoading: UpdateState<State> = makeStopLoading('createLoading');

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
        mapChildMsg: (value) => ({ tag: 'table' as const, value }),
        childStatePath: ['table'],
        childUpdate: Table.update,
        childMsg: msg.value
      });
    case 'createRfi':
      return [
        startCreateLoading(state),
        async (state, dispatch) => {
          state = stopCreateLoading(state);
          if (!state.sessionUser) {
            return state;
          } else if (state.promptCreateConfirmation || (await hasUserAcceptedTerms(state.sessionUser.id))) {
            dispatch(
              newRoute({
                tag: 'requestForInformationCreate',
                value: null
              })
            );
            return null;
          } else {
            return state.set('promptCreateConfirmation', true);
          }
        }
      ];
    case 'hideCreateConfirmationPrompt':
      return [state.set('promptCreateConfirmation', false)];
    case 'editRfi':
      return [
        state,
        async (state, dispatch) => {
          if (!state.sessionUser) {
            return state;
          } else if (state.promptEditConfirmation || (await hasUserAcceptedTerms(state.sessionUser.id))) {
            dispatch(
              newRoute({
                tag: 'requestForInformationEdit',
                value: { rfiId: msg.value }
              })
            );
            return null;
          } else {
            return state.set('promptEditConfirmation', msg.value);
          }
        }
      ];
    case 'hideEditConfirmationPrompt':
      return [state.set('promptEditConfirmation', undefined)];
    default:
      return [state];
  }
};

const Filters: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const onChangeSelect = (tag: any) => Select.makeOnChange(dispatch, (value) => ({ tag, value }));
  const onChangeShortText = (tag: any) => ShortText.makeOnChange(dispatch, (value) => ({ tag, value }));
  const categoryFilterElement =
    get(state.sessionUser, 'type') !== UserType.ProgramStaff ? null : (
      <Col xs="12" md="4">
        <Select.view state={state.categoryFilter} onChange={onChangeSelect('categoryFilter')} />
      </Col>
    );
  return (
    <div>
      <Row>
        <Col xs="12">
          <h6 className="text-secondary mb-3 d-none d-md-block">Filter By:</h6>
        </Col>
      </Row>
      <Row className="d-none d-md-flex align-items-end">
        <Col xs="12" md="3">
          <Select.view state={state.statusFilter} onChange={onChangeSelect('statusFilter')} />
        </Col>
        {categoryFilterElement}
        <Col xs="12" md="4" className="ml-md-auto">
          <ShortText.view state={state.searchFilter} onChange={onChangeShortText('searchFilter')} />
        </Col>
      </Row>
    </div>
  );
};

const programStaffTableHeadCells: Table.THSpec[] = [
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
    children: <Icon name="calendar" color="secondary" />,
    tooltipText: 'Discovery Day',
    className: 'text-center',
    style: {
      width: '50px'
    }
  }
];

const nonProgramStaffTableHeadCells: Table.THSpec[] = [
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
    children: <Icon name="calendar" color="secondary" />,
    tooltipText: 'Discovery Day Session Available',
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

function formatTableDate(date: Date): string {
  return rawFormatDate(date, 'YYYY-MM-DD', false);
}

function programStaffTableBodyRows(rfis: Rfi[], dispatch: Dispatch<Msg>): Table.RowsSpec {
  const className = (center?: boolean, wrap?: boolean) => `align-top ${center ? 'text-center' : ''} ${wrap ? 'text-wrap' : ''}`;
  return rfis.map((rfi) => {
    const version = rfi.latestVersion;
    return [
      {
        children: version.rfiNumber,
        className: className()
      },
      {
        children: <StatusBadge status={rfi.status} />,
        className: className()
      },
      {
        children: (
          <Link onClick={() => dispatch({ tag: 'editRfi', value: rfi._id })} className="mb-1">
            {version.title}
          </Link>
        ),
        className: className(false, true)
      },
      {
        children: version.publicSectorEntity,
        className: className(false, true)
      },
      {
        children: formatTableDate(version.createdAt),
        className: className()
      },
      {
        children: formatTableDate(version.closingAt),
        className: className()
      },
      {
        children: version.discoveryDay ? <Icon name="check" color="body" width={1.25} height={1.25} /> : null,
        className: className(true, false),
        tooltipText: version.discoveryDay && 'Discovery Day Session Available'
      }
    ];
  });
}

function nonProgramStaffTableBodyRows(rfis: Rfi[]): Table.RowsSpec {
  const className = (center?: boolean, wrap?: boolean) => `align-top ${center ? 'text-center' : ''} ${wrap ? 'text-wrap' : ''}`;
  return rfis.map((rfi) => {
    const version = rfi.latestVersion;
    return [
      {
        children: version.rfiNumber,
        className: className()
      },
      {
        children: (rfi.publishedAt && formatTableDate(rfi.publishedAt)) || '',
        className: className()
      },
      {
        children: <StatusBadge status={rfi.status} />,
        className: className()
      },
      {
        children: (
          <div>
            <Link route={{ tag: 'requestForInformationView', value: { rfiId: rfi._id } }}>{version.title}</Link>
            <div className="small text-uppercase text-secondary pt-1" style={{ lineHeight: '1.25rem' }}>
              {version.publicSectorEntity}
            </div>
          </div>
        ),
        className: className(false, true)
      },
      {
        children: formatTableDate(version.closingAt),
        className: className()
      },
      {
        children: version.discoveryDay ? <Icon name="check" color="body" width={1.25} height={1.25} /> : null,
        className: className(true, false),
        tooltipText: version.discoveryDay && 'Discovery Day Session Available'
      },
      {
        children: formatTableDate(version.createdAt),
        className: className()
      }
    ];
  });
}

const ConditionalTable: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (!state.rfis.length) {
    return <div>There are currently no Requests for Information available.</div>;
  }
  if (!state.visibleRfis.length) {
    return <div>There are currently no Requests for Information that match the search criteria.</div>;
  }
  const isProgramStaff = get(state.sessionUser, 'type') === UserType.ProgramStaff;
  const headCells = isProgramStaff ? programStaffTableHeadCells : nonProgramStaffTableHeadCells;
  const bodyRows = isProgramStaff ? programStaffTableBodyRows(state.visibleRfis, dispatch) : nonProgramStaffTableBodyRows(state.visibleRfis);
  const dispatchTable: Dispatch<Table.Msg> = mapComponentDispatch(dispatch, (value) => ({ tag: 'table' as const, value }));
  return <Table.view className="text-nowrap" style={{ lineHeight: '1.5rem' }} headCells={headCells} bodyRows={bodyRows} state={state.table} dispatch={dispatchTable} />;
};

const ConditionalCreateButton: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (get(state.sessionUser, 'type') !== UserType.ProgramStaff) {
    return null;
  }
  return (
    <Col xs="12" md="auto">
      <Link onClick={() => dispatch({ tag: 'createRfi', value: undefined })} button color="primary">
        Create an RFI
      </Link>
    </Col>
  );
};

const view: ComponentView<State, Msg> = (props) => {
  return (
    <div>
      <Row className="mb-5 mb-md-2 justify-content-md-between">
        <Col xs="12" md="auto">
          <h1 className="mb-3 mb-md-0">Requests for Information</h1>
        </Col>
        <ConditionalCreateButton {...props} />
      </Row>
      <Row className="mb-3 d-none d-md-flex">
        <Col xs="12" md="8">
          <p>Click on a Request for Information's (RFI's) title in the table below to view it.</p>
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
  getModal(state) {
    if (state.promptCreateConfirmation) {
      return {
        title: 'Review Terms and Conditions',
        body: 'You must accept the Procurement Concierge Terms and Conditions in order to create a Request for Information.',
        onCloseMsg: { tag: 'hideCreateConfirmationPrompt', value: undefined },
        actions: [
          {
            text: 'Review Terms & Conditions',
            color: 'primary',
            button: true,
            msg: { tag: 'createRfi', value: undefined }
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
        body: 'You must accept the Procurement Concierge Terms and Conditions in order to edit a Request for Information.',
        onCloseMsg: { tag: 'hideEditConfirmationPrompt', value: undefined },
        actions: [
          {
            text: 'Review Terms & Conditions',
            color: 'primary',
            button: true,
            msg: newRoute({
              tag: 'termsAndConditions',
              value: {
                warningId: WarningId.EditRfi,
                redirectOnAccept: router.routeToUrl({
                  tag: 'requestForInformationEdit',
                  value: {
                    rfiId: state.promptEditConfirmation
                  }
                }),
                redirectOnSkip: router.routeToUrl({
                  tag: 'requestForInformationList',
                  value: null
                })
              }
            })
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
  }
};
