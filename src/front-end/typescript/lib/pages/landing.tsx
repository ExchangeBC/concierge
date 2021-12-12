import { makePageMetadata } from 'front-end/lib';
import { Route, SharedState } from 'front-end/lib/app/types';
import { ComponentView, emptyPageAlerts, emptyPageBreadcrumbs, GlobalComponentMsg, noPageModal, PageComponent, PageInit, Update } from 'front-end/lib/framework';
import Icon from 'front-end/lib/views/icon';
import Link from 'front-end/lib/views/link';
import React from 'react';
import { Col, Container, Row } from 'reactstrap';
import { ADT, UserType, userTypeToTitleCase } from 'shared/lib/types';

export interface State {
  signedIn: boolean;
}

export type RouteParams = null;

export type Msg = GlobalComponentMsg<ADT<'noop'>, Route>;

const init: PageInit<RouteParams, SharedState, State, Msg> = async ({ shared }) => ({
  signedIn: !!(shared.session && shared.session.user)
});

const update: Update<State, Msg> = ({ state, msg }) => {
  return [state];
};

const Hero: ComponentView<State, Msg> = ({ state, dispatch }) => {
  return (
    <div
      className="bg-info py-6"
      style={{
        backgroundImage: 'url("/images/hero_image.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <Container style={{ height: '40vh', maxHeight: '600px' }} className="d-flex flex-column justify-content-center">
        <Row className="mb-4">
          <Col className="text-white">
            <div className="font-weight-bold font-size-large">The Province of British Columbia's</div>
            <h1 className="font-weight-bolder mb-3 display-4">
              Procurement Concierge&nbsp;
              <br className="d-lg-none" />
              Web App
            </h1>
            <h2 className="h4 font-weight-normal">Transforming how government interacts with the marketplace.</h2>
          </Col>
        </Row>
        <Row>
          <Col className="d-flex flex-nowrap">
            <Link button outline={!state.signedIn} route={{ tag: 'requestForInformationList', value: null }} size="lg" color={state.signedIn ? 'primary' : 'light'} className="mr-3">
              View RFIs
            </Link>
            {state.signedIn ? null : (
              <Link button route={{ tag: 'signUp', value: null }} size="lg" color="primary">
                Get Started
              </Link>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

const Intro: ComponentView<State, Msg> = ({ state, dispatch }) => {
  return (
    <Container>
      <Row>
        <Col xs="12" md="8" className="py-6 pr-md-5">
          <h4 className="mb-3">Vendors and Public Sector Buyers create meaningful connections with the assistance of BC's Procurement Concierge Program.</h4>
          <p className="mb-5">The Procurement Concierge Web App is the tool used for the pre-market engagement process in the Province of British Columbia under the Procurement Concierge Program ("The Program").</p>
          <Row>
            <Col xs="12" md="6" className="mb-5 mb-md-0">
              <h5 className="mb-3 font-weight-bold text-info-alt-2">{userTypeToTitleCase(UserType.Buyer)}s</h5>
              <ul className="pl-3 mb-0">
                <li>Work with the Program's staff during the pre-market engagement process.</li>
                <li>Gain a better understanding of the marketplace.</li>
                <li>Post a Request for Information and offer Discovery Day sessions to Vendors.</li>
              </ul>
            </Col>
            <Col xs="12" md="6">
              <h5 className="mb-3 font-weight-bold text-info-alt-2">{userTypeToTitleCase(UserType.Vendor)}s</h5>
              <ul className="pl-3 mb-0">
                <li>Find opportunities to connect with Public Sector Buyers during the pre-market engagement process.</li>
                <li>Share your innovative solutions with Public Sector Buyers.</li>
                <li>Respond to Requests for Information and participate in Discovery Day sessions.</li>
              </ul>
            </Col>
          </Row>
        </Col>
        <Col xs="12" md="4" className="bg-info-alt-2 position-relative">
          <div className="d-none d-md-block position-absolute bg-info-alt-2" style={{ width: '100vw', top: 0, bottom: 0, left: '90%', zIndex: -1 }}></div>
          <div className="d-none d-sm-block d-md-none position-absolute bg-info-alt-2" style={{ width: '100vw', top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', zIndex: -1 }}></div>
          <div className="py-6 pl-md-5">
            <h3 className="mb-3 text-white">Do you need help?</h3>
            <p className="text-white mb-5">An instructional guide has been created to help you through the account setup process, and teach you how to use the many features that the Procurement Concierge Web App has to offer.</p>
            <Link button route={{ tag: 'markdown', value: { documentId: 'guide' } }} color="primary" className="d-inline-block">
              Read the Guide
            </Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

const Features: ComponentView<State, Msg> = ({ state, dispatch }) => {
  return (
    <div className="py-6 bg-light">
      <Container>
        <Row className="justify-content-center">
          <Col xs="12" md="4" className="px-4 d-flex flex-column justify-content-start align-items-center">
            <Icon name="rfi" color="secondary" width={4} height={4} />
            <h4 className="text-center my-3 font-weight-bold w-100">Requests for Information</h4>
            <p className="text-center mb-0">Requests for Information (RFIs) are posted directly to this web app. Public Sector Buyers can work with the Ministry of Citizen's Services staff to develop RFIs, and Vendors respond by using a simple, online form.</p>
          </Col>
          <Col xs="12" md="4" className="my-5 my-md-0 px-4 d-flex flex-column justify-content-start align-items-center">
            <Icon name="discovery-day" color="secondary" width={3} height={4} />
            <h4 className="text-center my-3 font-weight-bold w-100">Discovery Day Sessions</h4>
            <p className="text-center mb-0">The Procurement Concierge Program organizes Discovery Day sessions quarterly to bring together Public Sector Buyers and Vendors for in-person meetings to present RFIs and achieve a mutual understanding of a government issue or problem.</p>
          </Col>
          <Col xs="12" md="4" className="px-4 d-flex flex-column justify-content-start align-items-center">
            <Icon name="matchmaking" color="secondary" width={4.5} height={4} />
            <h4 className="text-center my-3 font-weight-bold w-100">Unsolicited Proposals</h4>
            <p className="text-center mb-0">
              Vendors with innovative goods and services that could solve government problems can submit proposals through this web app. More information on eligibility criteria, proposal screening, and matching processes can be found{' '}
              <Link newTab route={{ tag: 'notice', value: { noticeId: { tag: 'comingSoon', value: undefined } } }}>
                here
              </Link>
              .
            </p>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

const CallToAction: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (state.signedIn) {
    return null;
  }
  return (
    <div className="py-6 bg-info-alt-2">
      <Container>
        <Row>
          <Col xs="12" md={{ size: 7, offset: 1 }} lg="8">
            <h4 className="pr-md-3 text-white font-weight-normal">Create your account today to explore all of the benefits that the Procurement Concierge Program has to offer.</h4>
          </Col>
          <Col xs="12" md="3" lg="2" className="d-flex justify-content-md-end align-items-center mt-3 mt-md-0">
            <Link button route={{ tag: 'signUp', value: null }} size="lg" color="primary">
              Get Started
            </Link>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

const view: ComponentView<State, Msg> = (props) => {
  return (
    <div>
      <Hero {...props} />
      <Intro {...props} />
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
