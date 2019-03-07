import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentView, Immutable, Init, Update } from 'front-end/lib/framework';
import { readManyUsers } from 'front-end/lib/http/api';
import Icon from 'front-end/lib/views/icon';
import * as Select from 'front-end/lib/views/input/select';
import * as ShortText from 'front-end/lib/views/input/short-text';
import * as PageContainer from 'front-end/lib/views/layout/page-container';
import Link from 'front-end/lib/views/link';
import { truncate } from 'lodash';
import { default as React, ReactElement } from 'react';
import { Col, Row, Table } from 'reactstrap';
import AVAILABLE_CATEGORIES from 'shared/data/categories';
import { PublicUser } from 'shared/lib/resources/user';
import { ADT, parseUserType, profileToName, UserType, userTypeToTitleCase } from 'shared/lib/types';

const FALLBACK_NAME = 'No Name Provided';

export interface State {
  users: PublicUser[];
  visibleUsers: PublicUser[];
  userTypeFilter: Select.State;
  categoryFilter: Select.State;
  searchFilter: ShortText.State;
};

export type Params = null;

type InnerMsg
  = ADT<'userTypeFilter', string>
  | ADT<'categoryFilter', string>
  | ADT<'searchFilter', string>;

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
    })
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

export const Results: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const truncateString = (s: string) => truncate(s, { length: 50, separator: /\s\+/ });
  let children: ReactElement<any> | Array<ReactElement<any>> = (<tr><td>No users found.</td></tr>);
  if (state.visibleUsers.length) {
    children = state.visibleUsers.map((user, i) => {
      return (
          <tr key={`user-list-results-row-${i}`}>
              <td>{userTypeToTitleCase(user.profile.type)}</td>
              <td>
                <a href={`/profile/${user._id}`}>
                  {truncateString(profileToName(user.profile) || FALLBACK_NAME)}
                </a>
              </td>
              <td>{truncateString(user.email)}</td>
              <td className='text-center'>{user.acceptedTermsAt ? (<Icon name='check' color='body' width={1.5} height={1.5} />) : ''}</td>
          </tr>
      );
    });
  }
  return (
    <Row>
      <Col xs='12'>
        <Table className='text-nowrap mb-0' hover={!!state.visibleUsers.length} responsive>
          <thead>
            <tr>
              <th style={{ width: '140px' }}>Type</th>
              <th style={{ width: '300px' }}>Name</th>
              <th style={{ width: '200px' }}>Email Address</th>
              <th className='text-center' style={{ width: '80px' }}>T&C</th>
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
      <Results {...props} />
    </PageContainer.View>
  );
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
