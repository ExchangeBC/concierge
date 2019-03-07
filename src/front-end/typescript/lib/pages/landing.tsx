import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentView, Init, Update } from 'front-end/lib/framework';
import Icon from 'front-end/lib/views/icon';
import * as PageContainer from 'front-end/lib/views/layout/page-container';
import Link from 'front-end/lib/views/link';
import React from 'react';
import { Col, Container, Row } from 'reactstrap';
import { UserType, userTypeToTitleCase } from 'shared/lib/types';

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
            <h1 className='text-uppercase text-light font-weight-bold mb-4'>
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
    <div className='bg-light pb-sm-6 pb-md-0'>
      <Container>
        <Row className='justify-content-center'>
          <Col xs='12' md='4' xl='3' className='pt-6 pb-md-6 px-4'>
            <h5 className='mb-3 font-weight-bold'>
              {userTypeToTitleCase(UserType.Buyer)}s
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
          <Col xs='12' md='4' xl='3' className='py-6 px-4'>
            <h5 className='mb-3 font-weight-bold'>
              {userTypeToTitleCase(UserType.Vendor)}s
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
/*<Col xs='12' md='4' className='bg-dark py-6 px-4 text-light mt-md-m3 mb-md-3'>
  <h5 className='mb-3'>
    Want to learn more about the Program?
  </h5>
  <p>
    Learn how to use the Program's Web Application.
  </p>
  <Link page={{ tag: 'guide', value: null }} buttonColor='info' text='Read the Guide' className='mt-4 d-block' />
</Col>*/

const Features: ComponentView<State, Msg> = ({ state, dispatch }) => {
  return (
    <div className='py-6'>
      <Container>
        <Row className='justify-content-center'>
          <Col xs='12' md='4' xl='3' className='pb-5 pb-md-0 px-4 d-flex flex-column justify-content-start align-items-center'>
            <Icon name='message' color='secondary' width={72} height={72} />
            <small className='text-uppercase font-weight-bold text-secondary mt-3 mb-2'>Coming Soon</small>
            <h5 className='text-center mb-3 font-weight-bold'>
              Match-Making
            </h5>
            <p>
              The Program's staff will connect Public Sector Buyers and Vendors based on their profiles and areas of interest to facilitate pre-market engagement.
            </p>
          </Col>
          <Col xs='12' md='4' xl='3' className='pb-5 pb-md-0 px-4 d-flex flex-column justify-content-start align-items-center'>
            <Icon name='file' color='secondary' width={72} height={72} />
            <small className='text-uppercase font-weight-bold text-secondary mt-3 mb-2'>Coming Soon</small>
            <h5 className='text-center mb-3 font-weight-bold'>
              Requests for Information
            </h5>
            <p>
              Public Sector Buyers can work with the Program's staff to publish Requests for Information ("RFIs") directly to this website. Vendors can respond to them using an easy-to-use online form.
            </p>
          </Col>
          <Col xs='12' md='4' xl='3' className='px-4 d-flex flex-column justify-content-start align-items-center'>
            <Icon name='calendar' color='secondary' width={72} height={72} />
            <small className='text-uppercase font-weight-bold text-secondary mt-3 mb-2'>Coming Soon</small>
            <h5 className='text-center mb-3 font-weight-bold'>
              Discovery Days
            </h5>
            <p>
              Public Sector Buyers can organise Discovery Day Sessions related to their Requests For Information ("RFIs"). Vendors can attend these sessions to meet Public Sector Buyers and discuss these RFIs.
            </p>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

const CallToAction: ComponentView<State, Msg> = ({ state, dispatch }) => {
  return (
    <div className='py-6 bg-light'>
      <Container>
        <Row>
          <Col xs='12' md='9'>
            <h4>
              Create your account today to explore all of the benefits that the Procurement Concierge Program has to offer.
            </h4>
          </Col>
          <Col xs='12' md='3' className='d-flex justify-content-md-end mt-3 mt-md-0'>
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
