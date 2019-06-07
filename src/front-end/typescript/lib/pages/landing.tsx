import { makePageMetadata } from 'front-end/lib';
import { Route, SharedState } from 'front-end/lib/app/types';
import { ComponentView, emptyPageAlerts, emptyPageBreadcrumbs, GlobalComponentMsg, noPageModal, PageComponent, PageInit, Update, View } from 'front-end/lib/framework';
import Icon from 'front-end/lib/views/icon';
import Link from 'front-end/lib/views/link';
import React from 'react';
import { Col, Container, Row } from 'reactstrap';
import { ADT, UserType, userTypeToTitleCase } from 'shared/lib/types';

export interface State {
  signedIn: boolean;
  userType?: UserType;
};

export type RouteParams = null;

export type Msg = GlobalComponentMsg<ADT<'noop'>, Route>;

const init: PageInit<RouteParams, SharedState, State, Msg> = async ({ shared }) => {
  if (shared.session && shared.session.user) {
    return {
      signedIn: true,
      userType: shared.session.user.type
    };
  } else {
    return {
      signedIn: false
    };
  }
};

const update: Update<State, Msg> = ({ state, msg }) => {
  return [state];
};

const CallToActionButton: View<{ signedIn: boolean, userType?: UserType }> = ({ signedIn, userType }) => {
  let route: Route = { tag: 'signUpBuyer', value: {} };
  let text = 'Get Started';
  if (signedIn) {
    route = {
      tag: 'requestForInformationList',
      value: null
    };
    text = 'View RFIs';
  }
  return (
    <Link button route={route} size='lg' color='info'>{text}</Link>
  );
};

const Hero: ComponentView<State, Msg> = ({ state, dispatch }) => {
  return (
    <div className='bg-light py-6'>
      <Container style={{ minHeight: '35vh' }} className='d-flex flex-column justify-content-center'>
        <Row>
          <Col xs='12' md={{ size: 8, offset: 1 }} lg='7' >
            <h1 className='text-uppercase font-weight-bold mb-4'>
              <span className='text-primary'>Transforming</span> how government interacts with <span className='text-primary'>the marketplace</span>.
            </h1>
          </Col>
        </Row>
        <Row>
          <Col md={{ size: 'auto', offset: 1 }}>
            <CallToActionButton signedIn={state.signedIn} userType={state.userType} />
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
        <Row className='justify-content-center'>
          <Col xs='12' md='10'>
            <h4 className='font-weight-normal'>
              BC's Procurement Concierge Program helps Public Sector Buyers and Vendors make meaningful connections.
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
          <Col xs='12' md='4' className='pt-6 pb-md-6 px-4'>
            <h4 className='mb-3 font-weight-bold'>
              {userTypeToTitleCase(UserType.Buyer)}s
            </h4>
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
          <Col xs='12' md='4' className='py-6 px-4'>
            <h4 className='mb-3 font-weight-bold'>
              {userTypeToTitleCase(UserType.Vendor)}s
            </h4>
            <ul className='pl-3 mb-0'>
              <li>
                Find opportunities to connect with Public Sector Buyers during the pre-market engagement process.
              </li>
              <li>
                Share your innovative solutions with Public Sector Buyers.
              </li>
              <li>
                Respond to Requests for Information and participate in Discovery Day Sessions (coming soon).
              </li>
            </ul>
          </Col>
          <Col xs='12' md='4' className='bg-primary py-6 px-4 text-light mt-md-n3 mb-md-3 d-flex flex-column align-items-start shadow'>
            <h4 className='mb-3'>
              Want to learn more?
            </h4>
            <p>
              Learn how to use the Procurement Concierge Program's Web Application.
            </p>
            <Link button route={{ tag: 'markdown', value: { documentId: 'guide' } }} color='info' className='mt-4 d-block mt-auto'>Read the Guide</Link>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

const Features: ComponentView<State, Msg> = ({ state, dispatch }) => {
  return (
    <div className='py-6'>
      <Container>
        <Row className='justify-content-center'>
          <Col xs='12' md='4' className='pb-5 pb-md-0 px-4 d-flex flex-column justify-content-start align-items-center'>
            <Icon name='rfi' color='secondary' width={4} height={4} />
            <small className='text-uppercase text-center font-weight-bold text-secondary mt-3 mb-2 w-100'>Available Now</small>
            <h4 className='text-center mb-3 font-weight-bold w-100'>
              Requests for Information
            </h4>
            <p className='text-center'>
              Requests for Information ("RFIs") will be posted directly to this website. Public Sector Buyers will work with the Program's staff to develop RFIs, and Vendors will respond using an easy-to-use online form.
            </p>
          </Col>
          <Col xs='12' md='4' className='px-4 d-flex flex-column justify-content-start align-items-center'>
            <Icon name='discovery-day' color='secondary' width={3} height={4} />
            <small className='text-uppercase text-center font-weight-bold text-secondary mt-3 mb-2 w-100'>Available Now</small>
            <h4 className='text-center mb-3 font-weight-bold w-100'>
              Discovery Days
            </h4>
            <p className='text-center'>
              The Program's staff will organise Discovery Day Sessions related to posted Requests for Information ("RFIs") to allow Vendors and Public Sector Buyers to meet and discuss them.
            </p>
          </Col>
          <Col xs='12' md='4' className='pb-5 pb-md-0 px-4 d-flex flex-column justify-content-start align-items-center'>
            <Icon name='matchmaking' color='secondary' width={4.5} height={4} />
            <small className='text-uppercase text-center font-weight-bold text-secondary mt-3 mb-2 w-100'>Coming Soon</small>
            <h4 className='text-center mb-3 font-weight-bold w-100'>
              Matchmaking
            </h4>
            <p className='text-center'>
              The Program's staff will connect Public Sector Buyers and Vendors based on their profiles and areas of interest to facilitate pre-market engagement.
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
          <Col xs='12' md={{ size: 7, offset: 1 }} lg='8'>
            <h4 className='pr-md-3'>
              Create your account today to explore all of the benefits that the Procurement Concierge Program has to offer.
            </h4>
          </Col>
          <Col xs='12' md='3' lg='2' className='d-flex justify-content-md-end align-items-center mt-3 mt-md-0'>
            <CallToActionButton signedIn={state.signedIn} userType={state.userType} />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

const view: ComponentView<State, Msg> = props => {
  return (
    <div>
      <Hero {...props} />
      <LeadingText {...props} />
      <UserPersonas {...props} />
      <Features {...props} />
      <CallToAction {...props} />
    </div>
  );
};

export const component: PageComponent<RouteParams, SharedState, State, Msg> = {
  init,
  update,
  view,
  containerOptions: {
    fullWidth: true,
    paddingTop: false,
    paddingBottom: false
  },
  getMetadata() {
    return makePageMetadata('Welcome');
  },
  getAlerts: emptyPageAlerts,
  getBreadcrumbs: emptyPageBreadcrumbs,
  getModal: noPageModal
};
