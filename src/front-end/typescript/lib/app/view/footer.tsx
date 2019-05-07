import { View } from 'front-end/lib/framework';
import Link from 'front-end/lib/views/link';
import React from 'react';
import { Col, Container, Row } from 'reactstrap'

export interface State {
  title: string;
}

const Links: View<{}> = () => {
  return (
    <Row className='mb-3'>
      <Col xs='12' className='d-flex flex-column flex-md-row justify-content-center align-items-center'>
        <Link href='/about' color='secondary' className='pr-md-3'>About</Link>
        <Link href='/copyright' color='secondary' className='pr-md-3'>Copyright</Link>
        <Link href='/disclaimer' color='secondary' className='pr-md-3'>Disclaimer</Link>
        <Link href='/privacy' color='secondary' className='pr-md-3'>Privacy</Link>
        <Link href='/accessibility' color='secondary'>Accessibility</Link>
      </Col>
    </Row>
  );
};

const SupportedBy: View<{}> = () => {
  return (
    <Row>
      <Col xs='12' className='text-center'>
        <img
          src='/images/bcgov_logo.svg'
          alt='Supported by the Province of British Columbia'
          style={{ width: '165px' }} />
      </Col>
    </Row>
  );
};

const Footer: View<{}> = () => {
  return (
    <footer className='w-100 bg-dark text-secondary'>
      <Container className='py-5'>
        <Links />
        <SupportedBy />
      </Container>
    </footer>
  );
};

export default Footer;
