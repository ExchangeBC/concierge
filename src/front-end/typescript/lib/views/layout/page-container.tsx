import * as framework from 'front-end/lib/framework';
import * as FixedBar from 'front-end/lib/views/fixed-bar';
import { default as React, ReactElement } from 'react';
import { Container } from 'reactstrap';

export interface Props {
  children: Array<ReactElement<any>> | ReactElement<any> | string;
  className?: string;
  bottomBarIsFixed?: boolean;
  fullWidth?: boolean;
}

export const View: framework.View<Props> = props => {
  const { bottomBarIsFixed, fullWidth = false } = props;
  // bottomBarIsFixed === undefined -> No bottom bar at all.
  // bottomBarIsFixed === true -> Bottom bar exists and is fixed to the bottom.
  // bottomBarIsFixed === false -> Bottom bar exists and is NOT fixed to the bottom.
  const className = `p${bottomBarIsFixed === false ? 't' : 'y'}-5 mb-${bottomBarIsFixed ? '5' : 'auto'} ${props.className || ''}`;
  const style = {
    paddingBottom: bottomBarIsFixed ? FixedBar.HEIGHT : undefined
  };
  if (fullWidth) {
    return (
      <div className={className} style={style}>
        {props.children}
      </div>
    );
  } else {
    return (
      <div className={className} style={style}>
        <Container>
          {props.children}
        </Container>
      </div>
    );
  }
}

export default View;
