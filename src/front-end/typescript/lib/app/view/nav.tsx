import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentView, Init, Update } from 'front-end/lib/framework';
import React from 'react';
import { Button, Col, Container, Nav, Navbar, NavbarBrand, NavItem, NavLink, Row } from 'reactstrap'
import { ADT } from 'shared/lib/types';

export type Params = undefined;

export interface State {
  title: string;
}

type InnerMsg
  = ADT<'toggleNav'>;

export type Msg = ComponentMsg<InnerMsg, Page>;

export const init: Init<Params, State> = async () => {
  return {
    title: 'Concierge'
  };
};

export const update: Update<State, Msg> = (state, msg) => {
  switch (msg.tag) {
    default:
      return [state];
  }
};

export const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  return (
    <Navbar expand='md' color='dark'>
      <Container>
        <Row className='w-100'>
          <Col xs='12' className='d-flex'>
            <NavbarBrand href='/'>
              <img src='https://bcdevexchange.org/modules/core/client/img/logo/new-logo-white.svg' style={{ height: '45px' }}/>
            </NavbarBrand>
            // Contextual nav based on active user's type.
            <Nav navbar>
              <NavItem>
                <NavLink href='/'>
                  <Button color='link'>
                    Users
                  </Button>
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink href='/'>
                  <Button color='link'>
                    RFIs
                  </Button>
                </NavLink>
              </NavItem>
            </Nav>
            // Authentication nav.
            // TODO user's email and logout button.
            <Nav navbar className='ml-auto'>
              <NavItem>
                <NavLink href='/'>
                  <Button color='link'>
                    Sign In
                  </Button>
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink href='/sign-up'>
                  <Button color='primary'>
                    Sign Up
                  </Button>
                </NavLink>
              </NavItem>
            </Nav>
          </Col>
        </Row>
      </Container>
    </Navbar>
  );
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
