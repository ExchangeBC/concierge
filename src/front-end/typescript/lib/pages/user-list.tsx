import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentView, Immutable, Init, Update } from 'front-end/lib/framework';
import { readManyUsers } from 'front-end/lib/http/api';
import * as Select from 'front-end/lib/views/input/select';
import * as ShortText from 'front-end/lib/views/input/short-text';
import Link from 'front-end/lib/views/link';
import { default as React, ReactElement } from 'react';
import { Col, Row, Table } from 'reactstrap';
import AVAILABLE_CATEGORIES from 'shared/data/categories';
import { PublicUser } from 'shared/lib/resources/user';
import { ADT, profileToName, UserType, userTypeToTitleCase } from 'shared/lib/types';

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
    users = result.value.items;
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

function validateAndUpdate(state: Immutable<State>, key?: string, value?: string): Immutable<State> {
  if (key && value !== undefined) {
    state = state.setIn([key, 'value'], value);
  }
  return state;
}

export const update: Update<State, Msg> = (state, msg) => {
  switch (msg.tag) {
    case 'userTypeFilter':
      return [validateAndUpdate(state, 'userTypeFilter', msg.value)];
    case 'categoryFilter':
      return [validateAndUpdate(state, 'categoryFilter', msg.value)];
    case 'searchFilter':
      return [validateAndUpdate(state, 'searchFilter', msg.value)];
    default:
      return [state];
  }
};

export const Filters: ComponentView<State, Msg> = ({ state, dispatch }) => {
  return (
    <Row>
      <Col xs='12'>
      </Col>
    </Row>
  );
};

export const Results: ComponentView<State, Msg> = ({ state, dispatch }) => {
  let children: ReactElement<any> | Array<ReactElement<any>> = (<tr><td>No users found.</td></tr>);
  if (state.visibleUsers.length) {
    children = state.visibleUsers.map((user, i) => {
      return (
          <tr key={`user-list-results-row-${i}`}>
              <td>{userTypeToTitleCase(user.profile.type)}</td>
              <td>
                <a href={`/profile/${user._id}`}>
                  {profileToName(user.profile)}
                </a>
              </td>
              <td>{user.email}</td>
              <td>{user.acceptedTermsAt ? 'Yes' : 'No'}</td>
          </tr>
      );
    });
  }
  return (
    <Row>
      <Col xs='12'>
        <Table hover responsive className='text-nowrap mb-0'>
          <thead>
            <tr>
              <th>Type</th>
              <th>Name</th>
              <th>Email Address</th>
              <th>Terms?</th>
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
    <div>
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
    </div>
  );
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
