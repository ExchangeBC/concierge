import { default as React, MouseEvent, ReactElement } from 'react';
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
  const aProps = {
    onClick: (e: MouseEvent<HTMLAnchorElement>) => disabled ? e.preventDefault() : undefined,
    style: { cursor: disabled ? 'default' : 'pointer' },
    className,
    href: disabled ? undefined : href
  };
  const buttonProps = {
    color: buttonColor,
    tag: buttonTag,
    className: `${!props.buttonColor && props.textColor ? `text-${textColor}` : ''} ${buttonClassName}`,
    disabled
  }
  return (
    <a {...aProps}>
      <Button {...buttonProps}>
        {children.length ? children : text}
      </Button>
    </a>
  );
}

export default Link;
