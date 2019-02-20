import React from 'react';
import { Collapse, DropdownItem, DropdownMenu, DropdownToggle, Nav, Navbar, NavbarBrand, NavbarToggler, NavItem, NavLink, UncontrolledDropdown } from 'reactstrap'
import { Page } from '../app/types';
import { ADT, Component, ComponentMsg, ComponentView, Init, Update } from '../lib/framework';

export type Params = undefined;

export interface State {
  isOpen: boolean;
  content: {
    title: string;
  };
}

export type Msg = ComponentMsg<ADT<'toggleNav'>, Page>;

export const init: Init<Params, State> = async () => {
  return {
    isOpen: false,
    content: {
      title: 'BCGov Concierge'
    }
  };
};

export const update: Update<State, Msg> = (state, msg) => {
  switch (msg.tag) {
    case 'toggleNav':
      return [state.set('isOpen', !state.get('isOpen'))];
    default:
      return [state];
  }
};

export const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const jsState = state.toJSON();
  return (
    <div>
      <Navbar expand='md'>
        <NavbarBrand href='/'>{jsState.content.title}</NavbarBrand>
        <NavbarToggler onClick={() => dispatch({ tag: 'toggleNav', data: undefined })} />
        <Collapse isOpen={jsState.isOpen} navbar>
          <Nav className='ml-auto' navbar>
            <NavItem>
              <NavLink href='/components/'>Components</NavLink>
            </NavItem>
            <NavItem>
              <NavLink href='https://github.com/reactstrap/reactstrap'>GitHub</NavLink>
            </NavItem>
            <UncontrolledDropdown nav inNavbar>
              <DropdownToggle nav caret>
                Options
              </DropdownToggle>
              <DropdownMenu right>
                <DropdownItem>
                  Option 1
                </DropdownItem>
                <DropdownItem>
                  Option 2
                </DropdownItem>
                <DropdownItem divider />
                <DropdownItem>
                  Reset
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>
          </Nav>
        </Collapse>
      </Navbar>
    </div>
  );
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
