import { Page } from 'front-end/lib/app/types';
import { View } from 'front-end/lib/framework';
import { Session } from 'front-end/lib/http/api';
import Link from 'front-end/lib/views/link';
import { get } from 'lodash';
import React from 'react';
import { Collapse, Container, Nav, Navbar, NavbarBrand, NavbarToggler, NavItem } from 'reactstrap'
import { UserType } from 'shared/lib/types';

interface Props {
  isOpen: boolean;
  activePage: Page;
  session?: Session;
  toggleIsOpen(): void;
}

const ContextualLinks: View<Props> = ({ activePage, session }) => {
  const isSettingsPage = activePage.tag === 'settings';
  const isUserListPage = activePage.tag === 'userList';
  const isRequestForInformationListPage = activePage.tag === 'requestForInformationList';
  const activeClass = (active: boolean) => active ? 'text-light' : 'text-secondary';
  switch (get(session, ['user', 'type'])) {
    case UserType.Buyer:
      return (
        <Nav navbar>
          <NavItem>
            <Link nav href='/requests-for-information' text='RFIs' buttonClassName={activeClass(isRequestForInformationListPage)} />
          </NavItem>
          <NavItem>
            <Link nav href='/settings' text='Settings' buttonClassName={activeClass(isSettingsPage)} />
          </NavItem>
        </Nav>
      );
    case UserType.Vendor:
      return (
        <Nav navbar>
          <NavItem>
            <Link nav href='/requests-for-information' text='RFIs' buttonClassName={activeClass(isRequestForInformationListPage)} />
          </NavItem>
          <NavItem>
            <Link nav href='/settings' text='Settings' buttonClassName={activeClass(isSettingsPage)} />
          </NavItem>
        </Nav>
      );
    case UserType.ProgramStaff:
      return (
        <Nav navbar>
          <NavItem>
            <Link nav href='/requests-for-information' text='RFIs' buttonClassName={activeClass(isRequestForInformationListPage)} />
          </NavItem>
          <NavItem>
            <Link nav href='/users' text='Users' buttonClassName={activeClass(isUserListPage)} />
          </NavItem>
          <NavItem>
            <Link nav href='/settings' text='Settings' buttonClassName={activeClass(isSettingsPage)} />
          </NavItem>
        </Nav>
      );
    default:
      return (<div></div>);
  }
};

const AuthLinks: View<Props> = ({ session }) => {
  if (session && session.user) {
    return (
      <Nav navbar className='ml-md-auto'>
        <NavItem className='d-none d-md-block'>
          <Link nav href='' text={session.user.email} textColor='secondary' disabled />
        </NavItem>
        <NavItem>
          <Link nav href='/sign-out' text='Sign Out' textColor='secondary' />
        </NavItem>
      </Nav>
    );
  } else {
    return (
      <Nav navbar className='ml-md-auto'>
        <NavItem>
          <Link nav href='/sign-in' text='Sign In' textColor='light' />
        </NavItem>
        <NavItem>
          <Link nav href='/sign-up/buyer' text='Sign Up' buttonColor='primary' />
        </NavItem>
      </Nav>
    );
  }
};

const Navigation: View<Props> = props => {
  return (
    <Navbar expand='md' dark color='dark'>
      <Container>
        <NavbarBrand href='/'>
          <img src='https://bcdevexchange.org/modules/core/client/img/logo/new-logo-white.svg' style={{ height: '45px' }}/>
        </NavbarBrand>
        <NavbarToggler className='ml-auto' onClick={() => props.toggleIsOpen()} />
        <Collapse isOpen={props.isOpen} navbar>
          <ContextualLinks {...props} />
          <AuthLinks {...props} />
        </Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
