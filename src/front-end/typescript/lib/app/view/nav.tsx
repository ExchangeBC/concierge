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
  const activeClass = (active: boolean) => active ? 'font-weight-bold text-body' : 'text-dark';
  const onClick = () => toggleIsOpen(false);
  const buttonClassName = (isActive: boolean) => `${activeClass(isActive)} px-0 px-md-3`;
  if (!session || !session.user) {
    return (
      <Nav navbar>
        <NavItem>
          <Link nav href='/requests-for-information' text='RFIs' buttonClassName={buttonClassName(isRequestForInformationListPage)} onClick={onClick} />
        </NavItem>
      </Nav>
    );
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
            <Link nav href='/requests-for-information' text='RFIs' buttonClassName={buttonClassName(isRequestForInformationListPage)} onClick={onClick} />
          </NavItem>
          <NavItem>
            <Link nav page={myProfilePage} text='My Profile' buttonClassName={buttonClassName(isMyProfilePage)} onClick={onClick} />
          </NavItem>
        </Nav>
      );
    case UserType.Vendor:
      return (
        <Nav navbar>
          <NavItem>
            <Link nav href='/requests-for-information' text='RFIs' buttonClassName={buttonClassName(isRequestForInformationListPage)} onClick={onClick} />
          </NavItem>
          <NavItem>
            <Link nav page={myProfilePage} text='My Profile' buttonClassName={buttonClassName(isMyProfilePage)} onClick={onClick} />
          </NavItem>
        </Nav>
      );
    case UserType.ProgramStaff:
      return (
        <Nav navbar>
          <NavItem>
            <Link nav href='/requests-for-information' text='RFIs' buttonClassName={buttonClassName(isRequestForInformationListPage)} onClick={onClick} />
          </NavItem>
          <NavItem>
            <Link nav href='/users' text='Users' buttonClassName={buttonClassName(isUserListPage)} onClick={onClick} />
          </NavItem>
          <NavItem>
            <Link nav page={myProfilePage} text='My Profile' buttonClassName={buttonClassName(isMyProfilePage)} onClick={onClick} />
          </NavItem>
        </Nav>
      );
  }
};

const AuthLinks: View<Props> = ({ session, toggleIsOpen }) => {
  const onClick = () => toggleIsOpen(false);
  if (session && session.user) {
    return (
      <Nav navbar className='ml-md-auto'>
        <NavItem className='d-none d-md-block'>
          <Link nav href='' text={session.user.email} textColor='dark' buttonClassName='px-0 px-md-3' disabled />
        </NavItem>
        <NavItem>
          <Link nav href='/sign-out' text='Sign Out' textColor='dark' onClick={onClick} className='pr-md-0' buttonClassName='px-0 pl-md-3' />
        </NavItem>
      </Nav>
    );
  } else {
    return (
      <Nav navbar className='ml-md-auto'>
        <NavItem>
          <Link nav href='/sign-in' text='Sign In' textColor='dark' onClick={onClick} buttonClassName='px-0 px-md-3' />
        </NavItem>
        <NavItem>
          <Link nav href='/sign-up/buyer' text='Sign Up' buttonColor='info' onClick={onClick} className='pr-0 mt-2 mt-md-0' />
        </NavItem>
      </Nav>
    );
  }
};

const Navigation: View<Props> = props => {
  return (
    <Navbar expand='md' light color='light' className='border-bottom'>
      <Container className='px-sm-3'>
        <NavbarBrand href='/'>
          <img src='/images/logo.svg' style={{ height: '2.25rem' }} alt='Procurement Concierge Program' />
        </NavbarBrand>
        <NavbarToggler className='ml-auto' onClick={() => props.toggleIsOpen()} />
        <Collapse isOpen={props.isOpen} className='pt-3 pt-md-0' navbar>
          <ContextualLinks {...props} />
          <AuthLinks {...props} />
        </Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
