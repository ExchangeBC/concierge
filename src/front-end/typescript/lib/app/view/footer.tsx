import { CONTACT_EMAIL } from 'front-end/config';
import { View } from 'front-end/lib/framework';
import Link from 'front-end/lib/views/link';
import React from 'react';
import { Col, Container, Row } from 'reactstrap';

export interface State {
  title: string;
}

const Sep: View<{}> = () => {
  return (
    <span className="pt-2 pt-md-0 px-md-1 px-lg-2" style={{ opacity: 0.5 }}>
      <span className="d-none d-md-inline">|</span>
    </span>
  );
};

const ProvinceLogo: View<{}> = () => {
  return <img src="/images/bcgov_logo.svg" alt="The Province of British Columbia" style={{ width: '165px' }} className="order-2 order-md-0" />;
};

const Links: View<{}> = () => {
  return (
    <div className="d-flex flex-column flex-md-row flex-md-nowrap justify-content-md-start align-items-center mb-3 mb-md-0 font-size-small">
      <Link route={{ tag: 'landing', value: null }} color="light">
        Home
      </Link>
      <Sep />
      <Link route={{ tag: 'markdown', value: { documentId: 'about' } }} color="light">
        About
      </Link>
      <Sep />
      <Link route={{ tag: 'markdown', value: { documentId: 'disclaimer' } }} color="light">
        Disclaimer
      </Link>
      <Sep />
      <Link route={{ tag: 'markdown', value: { documentId: 'privacy' } }} color="light">
        Privacy
      </Link>
      <Sep />
      <Link route={{ tag: 'markdown', value: { documentId: 'accessibility' } }} color="light">
        Accessibility
      </Link>
      <Sep />
      <Link route={{ tag: 'markdown', value: { documentId: 'copyright' } }} color="light">
        Copyright
      </Link>
      <Sep />
      <Link href={`mailto:${CONTACT_EMAIL}`} color="light">
        Contact Us
      </Link>
    </div>
  );
};

const FeedbackButton: View<{}> = () => {
  return (
    <Link route={{ tag: 'feedback', value: null }} color="light" size="sm" className="mb-4 mb-md-0 ml-md-auto" button outline>
      Send Feedback
    </Link>
  );
};

const Footer: View<{}> = () => {
  return (
    <footer className="w-100 bg-info text-light border-top-gov">
      <Container className="py-4">
        <Row>
          <Col xs="12" className="d-flex flex-column flex-md-row flex-md-wrap align-items-center">
            <ProvinceLogo />
            <Links />
            <FeedbackButton />
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
