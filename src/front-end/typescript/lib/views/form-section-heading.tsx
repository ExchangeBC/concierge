import { View } from 'front-end/lib/framework';
import { default as React, ReactElement } from 'react';
import { Col, Row } from 'reactstrap';

const view: View<{ text: string, children?: Array<ReactElement<any>> | ReactElement<any> }> = ({ text, children }) => {
  return (
    <Row className='mb-3'>
      <Col xs='12'>
        {text ? (<h3>{text}</h3>) : null}
        {children}
      </Col>
    </Row>
  );
};

export default view;
