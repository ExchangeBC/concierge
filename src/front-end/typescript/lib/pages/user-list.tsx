import { Page } from 'front-end/lib/app/types';
import * as TableComponent from 'front-end/lib/components/table';
import { Component, ComponentMsg, ComponentView, Dispatch, immutable, Immutable, Init, mapComponentDispatch, Update, updateComponentChild, View } from 'front-end/lib/framework';
import { readManyUsers } from 'front-end/lib/http/api';
import Icon from 'front-end/lib/views/icon';
import * as Select from 'front-end/lib/views/input/select';
import * as ShortText from 'front-end/lib/views/input/short-text';
import * as PageContainer from 'front-end/lib/views/layout/page-container';
import Link from 'front-end/lib/views/link';
import { default as React, ReactElement } from 'react';
import { Col, Row } from 'reactstrap';
import AVAILABLE_CATEGORIES from 'shared/data/categories';
import { PublicUser } from 'shared/lib/resources/user';
import { ADT, parseUserType, profileToName, UserType, userTypeToTitleCase } from 'shared/lib/types';

const FALLBACK_NAME = 'No Name Provided';

// Define Table component.

type TableCellData
  = ADT<'userType', UserType>
  | ADT<'name', { href: string, text: string }>
  | ADT<'email', string>
  | ADT<'acceptedTerms', boolean>;

const Table: TableComponent.TableComponent<TableCellData> = TableComponent.component();

const TDView: View<TableComponent.TDProps<TableCellData>> = ({ data }) => {
  const wrap = (child: string | null | ReactElement<any>) => {
    return (<td>{child}</td>);
  };
  switch (data.tag) {
    case 'userType':
      return wrap(userTypeToTitleCase(data.value));
    case 'name':
      return wrap((<a href={data.value.href}>{data.value.text}</a>));
    case 'email':
      return wrap(data.value);
    case 'acceptedTerms':
      return wrap(data.value ? (<Icon name='check' color='body' width={1.5} height={1.5} />) : null);
  }
}

export interface State {
  users: PublicUser[];
  visibleUsers: PublicUser[];
  userTypeFilter: Select.State;
  categoryFilter: Select.State;
  searchFilter: ShortText.State;
  table: Immutable<TableComponent.State<TableCellData>>;
};

export type Params = null;

type InnerMsg
  = ADT<'userTypeFilter', string>
  | ADT<'categoryFilter', string>
  | ADT<'searchFilter', string>
  | ADT<'table', TableComponent.Msg>;

export type Msg = ComponentMsg<InnerMsg, Page>;

export const init: Init<Params, State> = async () => {
  const result = await readManyUsers();
  let users: PublicUser[] = [];
  if (result.tag === 'valid') {
    // Sort users by user type first, then name.
    users = result.value.items.sort((a, b) => {
      if (a.profile.type === b.profile.type) {
        const aName = profileToName(a.profile) || FALLBACK_NAME;
        const bName = profileToName(b.profile) || FALLBACK_NAME;
        return aName.localeCompare(bName, 'en', { sensitivity: 'base' });
      } else {
        return a.profile.type.localeCompare(b.profile.type, 'en');
      }
    });
  }
  return {
    users,
    visibleUsers: users,
    userTypeFilter: Select.init({
      id: 'user-list-filter-user-type',
      value: '',
      required: false,
      label: 'User Type',
      unselectedLabel: 'All',
      options: [
        { value: UserType.Buyer, label: userTypeToTitleCase(UserType.Buyer) },
        { value: UserType.Vendor, label: userTypeToTitleCase(UserType.Vendor) },
        { value: UserType.ProgramStaff, label: userTypeToTitleCase(UserType.ProgramStaff) }
      ]
    }),
    categoryFilter: Select.init({
      id: 'user-list-filter-category',
      value: '',
      required: false,
      label: 'Commodity Code',
      unselectedLabel: 'All',
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
};

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
  return !!name && !!name.match(query);
}

function updateAndQuery(state: Immutable<State>, key?: string, value?: string): Immutable<State> {
  // Update state with the filter value.
  if (key && value !== undefined) {
    state = state.setIn([key, 'value'], value);
  }
  // Query the list of available users based on all filters' state.
  const userTypeQuery = state.userTypeFilter.value;
  const categoryQuery = state.categoryFilter.value;
  const rawSearchQuery = state.searchFilter.value;
  const searchQuery = rawSearchQuery ? new RegExp(state.searchFilter.value.split('').join('.*'), 'i') : null;
  const users = state.users.filter(user => {
    let match = true;
    match = match && (!userTypeQuery || userMatchesUserType(user, parseUserType(userTypeQuery)));
    match = match && (!categoryQuery || userMatchesCategory(user, categoryQuery));
    match = match && (!searchQuery || userMatchesSearch(user, searchQuery));
    return match;
  });
  return state.set('visibleUsers', users); ;
}

export const update: Update<State, Msg> = (state, msg) => {
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
  );
};

const tableHeadCells: TableComponent.THSpec[] = [
  { children: 'Type' },
  {
    children: 'Name',
    style: {
      minWidth: '280px'
    }
  },
  {
    children: 'Email Address',
    style: {
      minWidth: '210px'
    }
  },
  { children: 'T&C' }
];

function tableBodyRows(users: PublicUser[]): Array<Array<TableComponent.TDSpec<TableCellData>>> {
  return users.map(user => {
    return [
      TableComponent.makeTDSpec({ tag: 'userType' as 'userType', value: user.profile.type }),
      TableComponent.makeTDSpec({
        tag: 'name' as 'name',
        value: {
          // TODO after refactoring <Link>, use it here somehow.
          href: `/profiles/${user._id}`,
          text: profileToName(user.profile) || FALLBACK_NAME
        }
      }),
      TableComponent.makeTDSpec({ tag: 'email' as 'email', value: user.email }),
      TableComponent.makeTDSpec({ tag: 'acceptedTerms' as 'acceptedTerms', value: !!user.acceptedTermsAt })
    ];
  });
}

export const ConditionalTable: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (!state.visibleUsers.length) { return (<div>No users found.</div>); }
  const bodyRows = tableBodyRows(state.visibleUsers);
  const dispatchTable: Dispatch<ComponentMsg<TableComponent.Msg, Page>> = mapComponentDispatch(dispatch, value => ({ tag: 'table', value }));
  return (
    <Table.view
      className='text-nowrap'
      headCells={tableHeadCells}
      bodyRows={bodyRows}
      state={state.table}
      dispatch={dispatchTable} />
  );
}

export const view: ComponentView<State, Msg> = props => {
  return (
    <PageContainer.View paddingY>
      <Row className='mb-5 mb-md-2 justify-content-md-between'>
        <Col xs='12' md='auto'>
          <h1 className='mb-3 mb-md-0'>Concierge Users</h1>
        </Col>
        <Col xs='12' md='auto'>
          <Link page={{ tag: 'signUpProgramStaff', value: {} }} buttonColor='secondary' text='Create a Program Staff Account' />
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
    </PageContainer.View>
  );
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
