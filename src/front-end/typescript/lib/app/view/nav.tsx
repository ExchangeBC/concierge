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

function Link(props: { buttonColor?: string, href: string, text: string }) {
  return (
    <NavItem>
      <NavLink href={props.href}>
        <Button color={props.buttonColor || 'link'} className={props.buttonColor ? '' : 'text-light'}>
          {props.text}
        </Button>
      </NavLink>
    </NavItem>
  );
}

export const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  return (
    <Navbar expand='md' color='dark'>
      <Container>
        <Row className='w-100'>
          <Col xs='12' className='d-flex'>
            <NavbarBrand href='/'>
              <img src='https://bcdevexchange.org/modules/core/client/img/logo/new-logo-white.svg' style={{ height: '45px' }}/>
            </NavbarBrand>
            <Nav navbar>
              <Link href='/' text='Users' />
              <Link href='/' text='RFIs' />
            </Nav>
            <Nav navbar className='ml-auto'>
              <Link href='/' text='Sign In' />
              <Link href='/sign-up' text='Sign Up' buttonColor='primary' />
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
