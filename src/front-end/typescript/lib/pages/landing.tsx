import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentView, Init, Update } from 'front-end/lib/framework';
import * as PageContainer from 'front-end/lib/views/layout/page-container';
import Link from 'front-end/lib/views/link';
import React from 'react';
import { Col, Container, Row } from 'reactstrap';

export type Params = null;

export interface State {
  empty: true;
};

export type Msg = ComponentMsg<null, Page>;

export const init: Init<Params, State> = async () => {
  return { empty: true };
};

export const update: Update<State, Msg> = (state, msg) => {
  return [state];
};

const Hero: ComponentView<State, Msg> = ({ state, dispatch }) => {
  return (
    <div className='bg-dark py-6'>
      <Container>
        <Row>
          <Col xs='12' md='8' xl='6'>
            <h1 className='text-uppercase text-light font-weight-bold mb-5'>
              <span className='text-info'>Transforming</span> how government interacts with <span className='text-info'>the marketplace</span>.
            </h1>
          </Col>
        </Row>
        <Row>
          <Col>
            <Link page={{ tag: 'signUpBuyer', value: {} }} buttonSize='lg' buttonColor='primary' text='Get Started' />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

const LeadingText: ComponentView<State, Msg> = ({ state, dispatch }) => {
  return (
    <div className='py-6'>
      <Container>
        <Row>
          <Col xs='12'>
            <h4>
              The Province of British Columbia's Procurement Concierge Program helps Public Sector Buyers and Vendors make meaningful connections.
            </h4>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

const UserPersonas: ComponentView<State, Msg> = ({ state, dispatch }) => {
  return (
    <div className='bg-light pb-sm-5 pb-md-0'>
      <Container>
        <Row className='justify-content-center'>
          <Col xs='12' md='4' className='pt-5 pb-md-5 px-4'>
            <h5 className='mb-3'>
              Public Sector Buyers
            </h5>
            <ul className='pl-3 mb-0'>
              <li>
                Work with the Program's staff during the pre-market engagement process.
              </li>
              <li>
                Gain a better understanding of the marketplace.
              </li>
              <li>
                Post a Request for Information and offer Discovery Day Sessions to Vendors (coming soon).
              </li>
            </ul>
          </Col>
          <Col xs='12' md='4' className='py-5 px-4'>
            <h5 className='mb-3'>
              Vendors
            </h5>
            <ul className='pl-3 mb-0'>
              <li>
                Find opportunities to connect with Public Sector Buyers during the pre-market engagement process.
              </li>
              <li>
                Share your innovative solutions with Public Sector Buyers.
              </li>
              <li>
                Resond to Requests for Information and participate in Discovery Day Sessions (coming soon).
              </li>
            </ul>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

// TODO use this code for the guide call-to-action.
/*<Col xs='12' md='4' className='bg-dark py-5 px-4 text-light mt-md-m3 mb-md-3'>
  <h5 className='mb-3'>
    Want to learn more about the Program?
  </h5>
  <p>
    Learn how to use the Program's Web Application.
  </p>
  <Link page={{ tag: 'guide', value: null }} buttonColor='info' text='Read the Guide' className='mt-4 d-block' />
</Col>*/

const Features: ComponentView<State, Msg> = ({ state, dispatch }) => {
  return null;
};

const CallToAction: ComponentView<State, Msg> = ({ state, dispatch }) => {
  return (
    <div className='py-6'>
      <Container>
        <Row>
          <Col xs='12' md='8'>
            <h4>
              Create your account today to explore all of the benefits that the Procurement Concierge Program has to offer.
            </h4>
          </Col>
          <Col xs='12' md='4' className='d-flex justify-content-md-end mt-3 mt-md-0'>
            <Link page={{ tag: 'signUpBuyer', value: {} }} text='Get Started' buttonColor='primary' className='d-flex align-items-center' />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export const view: ComponentView<State, Msg> = props => {
  return (
    <PageContainer.View fullWidth>
      <Hero {...props} />
      <LeadingText {...props} />
      <UserPersonas {...props} />
      <Features {...props} />
      <CallToAction {...props} />
    </PageContainer.View>
  );
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
