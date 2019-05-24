import { makePageMetadata } from 'front-end/lib';
import { Route, SharedState } from 'front-end/lib/app/types';
import { ComponentView, emptyPageAlerts, GlobalComponentMsg, PageComponent, PageInit, Update } from 'front-end/lib/framework';
import Link from 'front-end/lib/views/link';
import React from 'react';
import { Col, Row } from 'reactstrap';
import { ADT } from 'shared/lib/types';

type RfiId = string;

export type NoticeId
  = ADT<'notFound'>
  | ADT<'changePassword'>
  | ADT<'resetPassword'>
  | ADT<'forgotPassword'>
  | ADT<'feedbackSubmitted'>
  | ADT<'rfiResponseSubmitted', RfiId>
  | ADT<'rfiNonVendorResponse', RfiId>
  | ADT<'rfiExpiredResponse', RfiId>;

function noticeIdToState(noticeId: NoticeId): State {
  switch (noticeId.tag) {

    case 'notFound':
      return {
        title: 'Page Not Found',
        body: 'The page you are looking for does not exist.',
        button: {
          text: 'Return to the Home Page',
          route: {
            tag: 'landing',
            value: null
          }
        }
      };

    case 'changePassword':
      return {
        title: 'Password Changed',
        body: 'Your password has been successfully changed.'
      };

    case 'resetPassword':
      return {
        title: 'Password Reset',
        body: 'Your password has been successfully reset.',
        button: {
          text: 'Sign In',
          route: {
            tag: 'signIn',
            value: {}
          }
        }
      };

    case 'forgotPassword':
      return {
        title: 'You\'ve Got Mail',
        body: 'We have sent you an email with instructions on how to reset your password.',
        button: {
          text: 'Return to the Home Page',
          route: {
            tag: 'landing',
            value: null
          }
        }
      };

    case 'feedbackSubmitted':
      return {
        title: 'Feedback Sent',
        body: 'You have successfully sent your feedback.  Thank you!',
        button: {
          text: 'Return to the Home Page',
          route: {
            tag: 'landing',
            value: null
          }
        }
      }

    case 'rfiResponseSubmitted':
      return {
        title: 'Thank you',
        body: 'Your response to this Request for Information has been successfully submitted.',
        button: {
          text: 'View the RFI Description',
          route: {
            tag: 'requestForInformationView' as 'requestForInformationView',
            value: {
              rfiId: noticeId.value
            }
          }
        }
      };

    case 'rfiNonVendorResponse':
      return {
        title: 'Only Vendors can respond to RFIs',
        body: 'You must be signed in as a Vendor to respond to this Request for Information.',
        button: {
          text: 'View the RFI Description',
          route: {
            tag: 'requestForInformationView' as 'requestForInformationView',
            value: {
              rfiId: noticeId.value
            }
          }
        }
      };

    case 'rfiExpiredResponse':
      return {
        title: 'This RFI has closed',
        body: 'This RFI is no longer accepting responses from Vendors.',
        button: {
          text: 'View the RFI Description',
          route: {
            tag: 'requestForInformationView' as 'requestForInformationView',
            value: {
              rfiId: noticeId.value
            }
          }
        }
      };

  }
}

export interface RouteParams {
  noticeId: NoticeId;
};

export interface State {
  title: string;
  body: string;
  button?: {
    text: string;
    route: Route;
  }
}

export type Msg = GlobalComponentMsg<null, Route>;

const init: PageInit<RouteParams, SharedState, State, Msg> = async ({ routeParams }) => {
  return noticeIdToState(routeParams.noticeId);
};

const update: Update<State, Msg> = ({ state, msg }) => {
  return [state];
};

const ConditionalButton: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (state.button) {
    return (
      <Row>
        <Col xs='12'>
          <Link route={state.button.route} button color='info'>{state.button.text}</Link>
        </Col>
      </Row>
    );
  } else {
    return null;
  }
};

const view: ComponentView<State, Msg> = props => {
  const { state } = props;
  return (
    <div>
      <Row className='mb-3'>
        <Col xs='12'>
          <h1>{state.title}</h1>
        </Col>
      </Row>
      <Row className='mb-3 pb-3'>
        <Col xs='12'>
          <p>{state.body}</p>
        </Col>
      </Row>
      <ConditionalButton {...props} />
    </div>
  );
};

export const component: PageComponent<RouteParams, SharedState, State, Msg> = {
  init,
  update,
  view,
  getAlerts: emptyPageAlerts,
  getMetadata({ title }) {
    return makePageMetadata(title);
  }
};
