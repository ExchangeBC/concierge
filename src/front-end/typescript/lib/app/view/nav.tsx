import { View } from 'front-end/lib/framework';
import Link from 'front-end/lib/views/link';
import React from 'react';
import { Col, Container, NavbarBrand, Row } from 'reactstrap'

const Nav: View<{}> = () => {
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
            <div className='ml-auto'>
              <Link href='/' text='Sign In' textColor='light' />
              <Link href='/sign-up' text='Sign Up' buttonColor='primary' />
            </div>
          </Col>
        </Row>
      </Container>
    </nav>
  );
};

export default Nav;
