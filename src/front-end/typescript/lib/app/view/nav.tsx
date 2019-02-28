import { Page } from 'front-end/lib/app/types';
import { View } from 'front-end/lib/framework';
import { Session } from 'front-end/lib/http/api';
import Link from 'front-end/lib/views/link';
import { get } from 'lodash';
import React from 'react';
import { Col, Container, NavbarBrand, Row } from 'reactstrap'
import { UserType } from 'shared/lib/types';

interface Props {
  activePage: Page;
  session?: Session;
}

const ContextualLinks: View<Props> = ({ activePage, session }) => {
  const isSettingsPage = activePage.tag === 'settings';
  const isUserListPage = activePage.tag === 'userList';
  const isRequestForInformationListPage = activePage.tag === 'requestForInformationList';
  const activeClass = (active: boolean) => active ? 'text-light' : 'text-secondary';
  switch (get(session, ['user', 'type'])) {
    case UserType.Buyer:
      return (
        <div>
          <Link href='/requests-for-information' text='Requests For Information' buttonClassName={activeClass(isRequestForInformationListPage)} />
          <Link href='/settings' text='Account Settings' buttonClassName={activeClass(isSettingsPage)} />
        </div>
      );
    case UserType.Vendor:
      return (
        <div>
          <Link href='/requests-for-information' text='Requests For Information' buttonClassName={activeClass(isRequestForInformationListPage)} />
          <Link href='/settings' text='Account Settings' buttonClassName={activeClass(isSettingsPage)} />
        </div>
      );
    case UserType.ProgramStaff:
      return (
        <div>
          <Link href='/requests-for-information' text='Requests For Information' buttonClassName={activeClass(isRequestForInformationListPage)} />
          <Link href='/users' text='Users' buttonClassName={activeClass(isUserListPage)} />
          <Link href='/settings' text='Account Settings' buttonClassName={activeClass(isSettingsPage)} />
        </div>
      );
    default:
      return (<div></div>);
  }
};

const AuthLinks: View<Props> = ({ session }) => {
  if (session && session.user) {
    return (
      <div className='ml-auto'>
        <Link href='' text={session.user.email} textColor='secondary' disabled />
        <Link href='/sign-out' text='Sign Out' textColor='secondary' />
      </div>
    );
  } else {
    return (
      <div className='ml-auto'>
        <Link href='/' text='Sign In' textColor='light' />
        <Link href='/sign-up/buyer' text='Sign Up' buttonColor='primary' />
      </div>
    );
  }
};

const Nav: View<Props> = props => {
  return (
    <nav className='w-100 bg-dark py-2'>
      <Container>
        <Row>
          <Col xs='12' className='d-flex align-items-center'>
            <NavbarBrand href='/'>
              <img src='https://bcdevexchange.org/modules/core/client/img/logo/new-logo-white.svg' style={{ height: '45px' }}/>
            </NavbarBrand>
            <ContextualLinks {...props} />
            <AuthLinks {...props} />
          </Col>
        </Row>
      </Container>
    </nav>
  );
};

export default Nav;
