import * as framework from 'front-end/lib/framework';
import { default as React, ReactElement } from 'react';
import { Col, Container, Row } from 'reactstrap';

export const HEIGHT = 80;

export interface Props {
  location?: 'top' | 'bottom';
  className?: string;
  children: Array<ReactElement<any>> | ReactElement<any>;
}

export const View: framework.View<Props> = ({ location, className = '', children }: Props) => {
  return (
    <div className={`${location ? `fixed-${location}` : ''} mt-5 bg-light border-top transition-hide ${className}`}>
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

export default View;
