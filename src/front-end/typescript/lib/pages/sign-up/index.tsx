import { makePageMetadata } from 'front-end/lib';
import { isSignedOut } from 'front-end/lib/access-control';
import { Route, SharedState } from 'front-end/lib/app/types';
import { ComponentView, emptyPageAlerts, emptyPageBreadcrumbs, GlobalComponentMsg, noPageModal, PageComponent, PageInit, replaceRoute, Update } from 'front-end/lib/framework';
import Icon from 'front-end/lib/views/icon';
import Link from 'front-end/lib/views/link';
import { default as React } from 'react';
import { Card, CardText, CardTitle, Col, Row } from 'reactstrap';
import { ADT, UserType, userTypeToTitleCase } from 'shared/lib/types';

export interface State {
  empty?: undefined;
};

type InnerMsg = ADT<'noop'>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

export type RouteParams = null;

const init: PageInit<RouteParams, SharedState, State, Msg> = isSignedOut({

  async success({ routeParams }) {
    return {};
  },

  async fail({ dispatch }) {
    dispatch(replaceRoute({
      tag: 'requestForInformationList' as const,
      value: null
    }));
    return {};
  }

});

const update: Update<State, Msg> = ({ state }) => {
  return [state];
};

const view: ComponentView<State, Msg> = props => {
  return (
    <div>
      <Row>
        <Col xs='12'>
          <div className='small text-secondary font-weight-bold text-uppercase'>Step 1 of 4</div>
          <h1>Let's Get Started!</h1>
        </Col>
      </Row>
      <Row className='mb-5'>
        <Col xs='12' md='8'>
          <p>
            Review the options below and select the type of account that you would like to create. Already have an account?{' '}
            <Link route={{ tag: 'signIn', value: {} }}>Sign in here</Link>.
          </p>
        </Col>
      </Row>
      <Row className='justify-content-center mb-4 mb-md-5'>
        <Col xs='12' sm='8' md='5' lg='4' className='mb-4 mb-md-0'>
          <Card body className='text-center shadow-sm h-100 d-flex flex-column justify-content-center'>
            <Icon name='buyer' color='secondary' width={4} height={4} className='mb-4 mx-auto' />
            <CardTitle className='h3'>{userTypeToTitleCase(UserType.Buyer)}</CardTitle>
            <CardText>
              Work with the Program's staff during the pre-market engagement process to
              post Requests for Information and offer Discovery Sessions to Vendors.
            </CardText>
            <Link button route={{ tag: 'signUpBuyer', value: {} }} color='primary' className='mt-auto w-100'>Select</Link>
          </Card>
        </Col>
        <Col xs='12' sm='8' md='5' lg='4'>
          <Card body className='text-center mb-3 mb-md-0 shadow-sm h-100 d-flex flex-column align-items-center justify-content-center'>
            <Icon name='vendor' color='secondary' width={4} height={4} className='mb-4 mx-auto' />
            <CardTitle className='h3'>{userTypeToTitleCase(UserType.Vendor)}</CardTitle>
            <CardText>
              Find opportunities to connect with Public Sector Buyers during the pre-market engagement process.
              Respond to Requests for Information and attend Discovery Sessions.
            </CardText>
            <Link button route={{ tag: 'signUpVendor', value: {} }} color='primary' className='mt-auto w-100'>Select</Link>
          </Card>
        </Col>
      </Row>
      <Row>
        <Col className='text-center'>
          <Link route={{ tag: 'landing', value: null }} color='secondary'>Cancel</Link>
        </Col>
      </Row>
    </div>
  );
};

export const component: PageComponent<RouteParams, SharedState, State, Msg> = {
  init,
  update,
  view,
  getAlerts: emptyPageAlerts,
  getMetadata() {
    return makePageMetadata('Create an Account');
  },
  getBreadcrumbs: emptyPageBreadcrumbs,
  getModal: noPageModal
};
