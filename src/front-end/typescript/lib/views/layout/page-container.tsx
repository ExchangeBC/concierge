import * as framework from 'front-end/lib/framework';
import * as FixedBar from 'front-end/lib/views/fixed-bar';
import { default as React, ReactElement } from 'react';
import { Container } from 'reactstrap';

export interface Props {
  children: Array<ReactElement<any>> | ReactElement<any> | string;
  className?: string;
  fullWidth?: boolean;
  paddingY?: boolean;
  paddingTop?: boolean;
  paddingBottom?: boolean;
  marginFixedBar?: boolean;
}

export const View: framework.View<Props> = props => {
  const { paddingY = false, paddingTop = false, paddingBottom = false, marginFixedBar = false, fullWidth = false } = props;
  const className = `${paddingY || paddingTop ? 'pt-5' : ''} ${paddingY || paddingBottom ? 'pb-5' : ''} ${props.className || ''}`;
  const style = {
    marginBottom: marginFixedBar ? `${FixedBar.HEIGHT}px` : 'auto'
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
