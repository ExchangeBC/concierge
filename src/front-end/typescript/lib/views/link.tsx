import { default as React, ReactElement } from 'react';
import { Button } from 'reactstrap';

interface Props {
  href: string;
  text?: string;
  buttonColor?: string;
  textColor?: string;
  className?: string;
  buttonTag?: 'button' | 'a' | 'span';
  buttonClassName?: string;
  disabled?: boolean;
  children?: Array<ReactElement<any>>
}

function Link(props: Props) {
  const {
    href,
    buttonColor = 'link',
    textColor = 'primary',
    className = '',
    buttonTag = 'button',
    buttonClassName = '',
    text = '',
    disabled = false,
    children = []
  } = props;
  return (
    <a href={href} style={{ pointerEvents: disabled ? 'none' : undefined }} className={className}>
      <Button color={buttonColor} tag={buttonTag} className={props.buttonColor ? '' : `text-${textColor} ${buttonClassName}`} disabled={disabled}>
        {children.length ? children : text}
      </Button>
    </a>
  );
}

export default Link;
