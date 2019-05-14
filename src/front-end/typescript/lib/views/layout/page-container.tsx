import * as framework from 'front-end/lib/framework';
import { default as React, ReactElement } from 'react';
import { Container } from 'reactstrap';

export interface Props extends framework.PageContainerOptions {
  children: Array<ReactElement<any>> | ReactElement<any> | string;
  className?: string;
}

export const view: framework.View<Props> = props => {
  const { paddingTop = true, paddingBottom = true, fullWidth = false } = props;
  const className = `${paddingTop ? 'pt-5' : ''} ${paddingBottom ? 'pb-5' : ''} ${props.className || ''} d-flex flex-column flex-grow-1`;
  if (fullWidth) {
    return (
      <div className={className}>
        {props.children}
      </div>
    );
  } else {
    return (
      <div className={className}>
        <Container className='flex-grow-1'>
          {props.children}
        </Container>
      </div>
    );
  }
}

export default view;
