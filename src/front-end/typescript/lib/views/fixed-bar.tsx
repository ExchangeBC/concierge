import { View } from 'front-end/lib/framework';
import { default as React, ReactElement } from 'react';
import { Col, Container, Row } from 'reactstrap';

export interface Props {
  location: 'top' | 'bottom';
  distance?: number;
  children: Array<ReactElement<any>> | ReactElement<any>;
}

const FixedBar: View<Props> = ({ location, distance = 0, children }) => {
  const style = {
    transform: `translateY(${location === 'top' ? distance : distance * -1}px)`,
    transition: 'transform 100ms'
  };
  return (
    <div className={`fixed-${location} bg-light border-top transition-hide`} style={style}>
      <Container>
        <Row>
          <Col xs='12' className='fixed-bar d-flex flex-md-row-reverse justify-content-xs-center justify-content-md-start align-items-center py-2'>
            {children}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default FixedBar;
