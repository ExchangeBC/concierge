import { View } from 'front-end/lib/framework';
import { Session } from 'front-end/lib/http/api';
import Link from 'front-end/lib/views/link';
import React from 'react';
import { Col, Container, NavbarBrand, Row } from 'reactstrap'

interface State {
  session?: Session;
}

const AuthLinks: View<State> = ({ session }) => {
  if (session && session.user) {
    return (
      <div className='ml-auto'>
        <Link href='' text={session.user.email} textColor='secondary' disabled />
        <Link href='/sign-out' text='Sign Out' textColor='light' />
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

const Nav: View<State> = ({ session }) => {
  return (
    <nav className='w-100 bg-dark py-2'>
      <Container>
        <Row>
          <Col xs='12' className='d-flex align-items-center'>
            <NavbarBrand href='/'>
              <img src='https://bcdevexchange.org/modules/core/client/img/logo/new-logo-white.svg' style={{ height: '45px' }}/>
            </NavbarBrand>
            <div>
              <Link href='/' text='Users' textColor='light' />
              <Link href='/' text='RFIs' textColor='light' />
            </div>
            <AuthLinks session={session} />
          </Col>
        </Row>
      </Container>
    </nav>
  );
};

export default Nav;
