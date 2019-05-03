import * as framework from 'front-end/lib/framework';
import { default as React, ReactElement } from 'react';
import { Col, Container, Row } from 'reactstrap';

export interface Props {
  className?: string;
  children: Array<ReactElement<any> | null> | ReactElement<any>;
}

export const view: framework.View<Props> = ({ className = '', children }: Props) => {
  return (
    <div className={`bg-light border-top transition-hide fixed-bar position-sticky ${className}`} style={{ bottom: '0px' }}>
      <Container className='h-100'>
        <Row className='h-100' style={{ overflowX: 'auto' }}>
          <Col
            xs='auto'
            md='12'
            style={{ maxWidth: 'initial' }}
            className='d-flex flex-md-row-reverse justify-content-md-start align-items-center py-2'>
            {children}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default view;
