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
  toggleIsOpen(open?: boolean): void;
}

const ContextualLinks: View<Props> = ({ activePage, session, toggleIsOpen }) => {
  const isMyProfilePage = activePage.tag === 'profile' && activePage.value.profileUserId === get(session, ['user', 'id']);
  const isUserListPage = activePage.tag === 'userList';
  const isRequestForInformationListPage = activePage.tag === 'requestForInformationList';
  const activeClass = (active: boolean) => active ? 'font-weight-bold text-white' : 'text-light';
  const onClick = () => toggleIsOpen(false);
  if (!session || !session.user) {
    return (<div></div>);
  }
  const myProfilePage: Page = {
    tag: 'profile',
    value: {
      profileUserId: session.user.id
    }
  };
  switch (session.user.type) {
    case UserType.Buyer:
      return (
        <Nav navbar>
          <NavItem>
            <Link nav href='/requests-for-information' text='RFIs' buttonClassName={activeClass(isRequestForInformationListPage)} onClick={onClick} />
          </NavItem>
          <NavItem>
            <Link nav page={myProfilePage} text='My Profile' buttonClassName={activeClass(isMyProfilePage)} onClick={onClick} />
          </NavItem>
        </Nav>
      );
    case UserType.Vendor:
      return (
        <Nav navbar>
          <NavItem>
            <Link nav href='/requests-for-information' text='RFIs' buttonClassName={activeClass(isRequestForInformationListPage)} onClick={onClick} />
          </NavItem>
          <NavItem>
            <Link nav page={myProfilePage} text='My Profile' buttonClassName={activeClass(isMyProfilePage)} onClick={onClick} />
          </NavItem>
        </Nav>
      );
    case UserType.ProgramStaff:
      return (
        <Nav navbar>
          <NavItem>
            <Link nav href='/requests-for-information' text='RFIs' buttonClassName={activeClass(isRequestForInformationListPage)} onClick={onClick} />
          </NavItem>
          <NavItem>
            <Link nav href='/users' text='Users' buttonClassName={activeClass(isUserListPage)} onClick={onClick} />
          </NavItem>
          <NavItem>
            <Link nav page={myProfilePage} text='My Profile' buttonClassName={activeClass(isMyProfilePage)} onClick={onClick} />
          </NavItem>
        </Nav>
      );
    default:
      return (<div></div>);
  }
};

const AuthLinks: View<Props> = ({ session, toggleIsOpen }) => {
  const onClick = () => toggleIsOpen(false);
  if (session && session.user) {
    return (
      <Nav navbar className='ml-md-auto'>
        <NavItem className='d-none d-md-block'>
          <Link nav href='' text={session.user.email} textColor='light' onClick={onClick} disabled />
        </NavItem>
        <NavItem>
          <Link nav href='/sign-out' text='Sign Out' textColor='light' onClick={onClick} />
        </NavItem>
      </Nav>
    );
  } else {
    return (
      <Nav navbar className='ml-md-auto'>
        <NavItem>
          <Link nav href='/sign-in' text='Sign In' textColor='light' onClick={onClick} />
        </NavItem>
        <NavItem>
          <Link nav href='/sign-up/buyer' text='Sign Up' buttonColor='primary' onClick={onClick} />
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
          <img src='/images/logo.svg' style={{ height: '45px' }}/>
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
