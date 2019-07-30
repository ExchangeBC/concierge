import { FALLBACK_USER_NAME } from 'front-end/config';
import { makePageMetadata, makeStartLoading, makeStopLoading, UpdateState } from 'front-end/lib';
import { isUserType } from 'front-end/lib/access-control';
import router from 'front-end/lib/app/router';
import { Route, SharedState } from 'front-end/lib/app/types';
import * as TableComponent from 'front-end/lib/components/table';
import { ComponentView, Dispatch, emptyPageAlerts, emptyPageBreadcrumbs, GlobalComponentMsg, immutable, Immutable, mapComponentDispatch, newRoute, PageComponent, PageInit, replaceRoute, Update, updateComponentChild, View } from 'front-end/lib/framework';
import { hasUserAcceptedTerms, readManyUsers } from 'front-end/lib/http/api';
import * as Select from 'front-end/lib/views/form-field/select';
import * as ShortText from 'front-end/lib/views/form-field/short-text';
import Icon from 'front-end/lib/views/icon';
import Link from 'front-end/lib/views/link';
import { VerificationStatusIcon } from 'front-end/lib/views/verification-status-badge';
import { get } from 'lodash';
import { default as React, ReactElement } from 'react';
import { Col, Row } from 'reactstrap';
import AVAILABLE_CATEGORIES from 'shared/data/categories';
import { PublicSessionUser } from 'shared/lib/resources/session';
import { PublicUser } from 'shared/lib/resources/user';
import { ADT, parseUserType, profileToName, UserType, userTypeToTitleCase, VerificationStatus } from 'shared/lib/types';

// Define Table component.

type TableCellData
  = ADT<'verificationStatus', VerificationStatus | null>
  | ADT<'userType', UserType>
  | ADT<'name', { userId: string, text: string, dispatch: Dispatch<Msg> }>
  | ADT<'publicSectorEntity', string>
  | ADT<'email', string>
  | ADT<'acceptedTerms', boolean>;

const Table: TableComponent.TableComponent<TableCellData> = TableComponent.component();

const TDView: View<TableComponent.TDProps<TableCellData>> = ({ data }) => {
  const wrap = (child: string | null | ReactElement<any>, center = false) => {
    return (<td className={`align-top ${center ? 'text-center' : ''}`}>{child}</td>);
  };
  switch (data.tag) {
    case 'verificationStatus':
      if (!data.value) { return wrap(null); }
      return wrap((<VerificationStatusIcon verificationStatus={data.value} colored large />), true);
    case 'userType':
      return wrap(userTypeToTitleCase(data.value));
    case 'name':
    return (
      <td className='align-top text-wrap'>
        <Link onClick={() => data.value.dispatch({ tag: 'viewUser', value: data.value.userId })}>{data.value.text}</Link>
      </td>);
    case 'publicSectorEntity':
      return wrap(data.value);
    case 'email':
      return wrap(data.value);
    case 'acceptedTerms':
      return wrap(data.value ? (<Icon name='check' color='body' width={1.25} height={1.25} />) : null, true);
  }
}

export interface State {
  createLoading: number;
  users: PublicUser[];
  visibleUsers: PublicUser[];
  userTypeFilter: Select.State;
  categoryFilter: Select.State;
  searchFilter: ShortText.State;
  table: Immutable<TableComponent.State<TableCellData>>;
  promptCreateConfirmation: boolean;
  promptViewConfirmation?: string;
  sessionUser?: PublicSessionUser;
};

type FormFieldKeys
  = 'userTypeFilter'
  | 'categoryFilter'
  | 'searchFilter';

export type RouteParams = null;

type InnerMsg
  = ADT<'userTypeFilter', Select.Value>
  | ADT<'categoryFilter', Select.Value>
  | ADT<'searchFilter', string>
  | ADT<'table', TableComponent.Msg>
  | ADT<'createAccount'>
  | ADT<'hideCreateConfirmationPrompt'>
  | ADT<'viewUser', string>
  | ADT<'hideViewConfirmationPrompt'>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

async function makeInitState(): Promise<State> {
  return {
    createLoading: 0,
    users: [],
    visibleUsers: [],
    promptCreateConfirmation: false,
    promptViewConfirmation: undefined,
    userTypeFilter: Select.init({
      id: 'user-list-filter-user-type',
      required: false,
      label: 'User Type',
      placeholder: 'All',
      options: [
        { value: UserType.Buyer, label: userTypeToTitleCase(UserType.Buyer) },
        { value: UserType.Vendor, label: userTypeToTitleCase(UserType.Vendor) },
        { value: UserType.ProgramStaff, label: userTypeToTitleCase(UserType.ProgramStaff) }
      ]
    }),
    categoryFilter: Select.init({
      id: 'user-list-filter-category',
      required: false,
      label: 'Commodity Code',
      placeholder: 'All',
      options: AVAILABLE_CATEGORIES.toJS().map(value => ({ label: value, value }))
    }),
    searchFilter: ShortText.init({
      id: 'user-list-filter-search',
      type: 'text',
      required: false,
      placeholder: 'Search'
    }),
    table: immutable(await Table.init({
      idNamespace: 'user-list',
      THView: TableComponent.DefaultTHView,
      TDView
    }))
  };
}

const init: PageInit<RouteParams, SharedState, State, Msg> = isUserType({

  userTypes: [UserType.ProgramStaff],

  async success({ shared }) {
    const result = await readManyUsers();
    let users: PublicUser[] = [];
    if (result.tag === 'valid') {
      // Sort users by user type first, then name.
      users = result.value.items.sort((a, b) => {
        if (a.profile.type === b.profile.type) {
          const aName = profileToName(a.profile) || FALLBACK_USER_NAME;
          const bName = profileToName(b.profile) || FALLBACK_USER_NAME;
          return aName.localeCompare(bName, 'en', { sensitivity: 'base' });
        } else {
          return a.profile.type.localeCompare(b.profile.type, 'en');
        }
      });
    }
    const initState = await makeInitState();
    return {
      ...initState,
      users,
      visibleUsers: users,
      sessionUser: shared.sessionUser
    };
  },

  async fail({ routeParams, dispatch }) {
    dispatch(replaceRoute({
      tag: 'signIn' as const,
      value: {
        redirectOnSuccess: router.routeToUrl({
          tag: 'userList',
          value: routeParams
        })
      }
    }));
    return await makeInitState();
  }

});

function userMatchesUserType(user: PublicUser, userType: UserType | null): boolean {
  return !!userType && user.profile.type === userType;
}

function userMatchesCategory(user: PublicUser, category: string): boolean {
  switch (user.profile.type) {
    case UserType.Buyer:
      return !!user.profile.categories && user.profile.categories.includes(category);
    case UserType.Vendor:
      return !!user.profile.categories && user.profile.categories.includes(category);
    case UserType.ProgramStaff:
      return false;
  }
}

function userMatchesSearch(user: PublicUser, query: RegExp): boolean {
  const name = profileToName(user.profile);
  const matchingName = () => !!name && !!name.match(query);
  const matchingEntity = () => user.profile.type === UserType.Buyer && !!user.profile.publicSectorEntity.match(query);
  return matchingName() || matchingEntity();
}

function updateAndQuery<K extends FormFieldKeys>(state: Immutable<State>, key: K, value: State[K]['value']): Immutable<State> {
  // Update state with the filter value.
  state = state.setIn([key, 'value'], value);
  // Query the list of available users based on all filters' state.
  const userTypeQuery = state.userTypeFilter.value && state.userTypeFilter.value.value;
  const categoryQuery = state.categoryFilter.value && state.categoryFilter.value.value;
  const rawSearchQuery = state.searchFilter.value;
  const searchQuery = rawSearchQuery ? new RegExp(state.searchFilter.value.split(/\s+/).join('.*'), 'i') : null;
  const users = state.users.filter(user => {
    let match = true;
    match = match && (!userTypeQuery || userMatchesUserType(user, parseUserType(userTypeQuery)));
    match = match && (!categoryQuery || userMatchesCategory(user, categoryQuery));
    match = match && (!searchQuery || userMatchesSearch(user, searchQuery));
    return match;
  });
  return state.set('visibleUsers', users); ;
}

const startCreateLoading: UpdateState<State> = makeStartLoading('createLoading');
const stopCreateLoading: UpdateState<State> = makeStopLoading('createLoading');

const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'userTypeFilter':
      return [updateAndQuery(state, 'userTypeFilter', msg.value)];
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
    case 'createAccount':
      return [
        startCreateLoading(state),
        async (state, dispatch) => {
          state = stopCreateLoading(state);
          if (!state.sessionUser) {
            return state;
          } else if (state.promptCreateConfirmation || (await hasUserAcceptedTerms(state.sessionUser.id))) {
            dispatch(newRoute({
              tag: 'signUpProgramStaff',
              value: null
            }));
            return null;
          } else {
            return state.set('promptCreateConfirmation', true);
          }
        }
      ];
    case 'hideCreateConfirmationPrompt':
      return [state.set('promptCreateConfirmation', false)];
    case 'viewUser':
      return [
        state,
        async (state, dispatch) => {
          if (!state.sessionUser) {
            return state;
          } else if (state.promptViewConfirmation || (await hasUserAcceptedTerms(state.sessionUser.id))) {
            dispatch(newRoute({
              tag: 'userView',
              value: { profileUserId: msg.value }
            }));
            return null;
          } else {
            return state.set('promptViewConfirmation', msg.value);
          }
        }
      ];
    case 'hideViewConfirmationPrompt':
      return [state.set('promptViewConfirmation', undefined)];
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
          <h6 className='text-secondary mb-3 d-none d-md-block'>
            Filter By:
          </h6>
        </Col>
      </Row>
      <Row className='d-none d-md-flex align-items-end'>
        <Col xs='12' md='3'>
          <Select.view
            state={state.userTypeFilter}
            onChange={onChangeSelect('userTypeFilter')} />
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
    </div>
  );
};

const tableHeadCells: TableComponent.THSpec[] = [
  {
    children: 'Status',
    style: {
      width: '80px'
    }
  },
  {
    children: 'Type',
    style: {
      width: '180px'
    }
  },
  {
    children: 'Name',
    style: {
      minWidth: '200px'
    }
  },
  {
    children: 'Public Sector Entity',
    style: {
      minWidth: '200px'
    }
  },
  {
    children: 'Email Address',
    style: {
      minWidth: '200px'
    }
  },
  {
    children: 'T&C',
    className: 'text-center',
    style: {
      width: '65px'
    }
  }
];

function tableBodyRows(users: PublicUser[], dispatch: Dispatch<Msg>): Array<Array<TableComponent.TDSpec<TableCellData>>> {
  return users.map(user => {
    return [
      TableComponent.makeTDSpec({ tag: 'verificationStatus' as const, value: get(user.profile, 'verificationStatus', null) }),
      TableComponent.makeTDSpec({ tag: 'userType' as const, value: user.profile.type }),
      TableComponent.makeTDSpec({
        tag: 'name' as const,
        value: {
          userId: user._id,
          text: profileToName(user.profile) || FALLBACK_USER_NAME,
          dispatch
        }
      }),
      TableComponent.makeTDSpec({
        tag: 'publicSectorEntity' as const,
        value: (user.profile.type === UserType.Buyer && user.profile.publicSectorEntity) || ''
      }),
      TableComponent.makeTDSpec({ tag: 'email' as const, value: user.email }),
      TableComponent.makeTDSpec({ tag: 'acceptedTerms' as const, value: !!user.acceptedTermsAt })
    ];
  });
}

const ConditionalTable: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (!state.visibleUsers.length) { return (<div>There are no users that match the search criteria.</div>); }
  const bodyRows = tableBodyRows(state.visibleUsers, dispatch);
  const dispatchTable: Dispatch<TableComponent.Msg> = mapComponentDispatch(dispatch, value => ({ tag: 'table' as const, value }));
  return (
    <Table.view
      className='text-nowrap'
      headCells={tableHeadCells}
      bodyRows={bodyRows}
      state={state.table}
      dispatch={dispatchTable} />
  );
}

const view: ComponentView<State, Msg> = props => {
  return (
    <div>
      <Row className='mb-5 mb-md-2 justify-content-md-between'>
        <Col xs='12' md='auto'>
          <h1 className='mb-3 mb-md-0'>Concierge Users</h1>
        </Col>
        <Col xs='12' md='auto'>
          <Link onClick={() => props.dispatch({ tag: 'createAccount', value: undefined })} button color='primary'>Create a Program Staff Account</Link>
        </Col>
      </Row>
      <Row className='mb-3 d-none d-md-flex'>
        <Col xs='12' md='8'>
          <p>
            Click on a user's name in the table below to view their profile.
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
    return makePageMetadata('Users');
  },
  getBreadcrumbs: emptyPageBreadcrumbs,
  getModal(state) {
    if (state.promptCreateConfirmation) {
      return {
        title: 'Review Terms and Conditions',
        body: 'You must accept the Procurement Concierge Terms and Conditions in order to create another account.',
        onCloseMsg: { tag: 'hideCreateConfirmationPrompt', value: undefined },
        actions: [
          {
            text: 'Review Terms & Conditions',
            color: 'primary',
            button: true,
            msg: { tag: 'createAccount', value: undefined }
          },
          {
            text: 'Go Back',
            color: 'secondary',
            msg: { tag: 'hideCreateConfirmationPrompt', value: undefined }
          }
        ]
      };
    } else if (state.promptViewConfirmation) {
      return {
        title: 'Review Terms and Conditions',
        body: 'You must accept the Procurement Concierge Terms and Conditions in order to view this user\'s profile.',
        onCloseMsg: { tag: 'hideViewConfirmationPrompt', value: undefined },
        actions: [
          {
            text: 'Review Terms & Conditions',
            color: 'primary',
            button: true,
            msg: { tag: 'viewUser', value: state.promptViewConfirmation }
          },
          {
            text: 'Go Back',
            color: 'secondary',
            msg: { tag: 'hideViewConfirmationPrompt', value: undefined }
          }
        ]
      };
    } else {
      return null;
    }
  }
};
