import AppRouter from 'front-end/lib/app/router';
import { Page } from 'front-end/lib/app/types';
import { default as React, MouseEvent, ReactElement } from 'react';
import { Button } from 'reactstrap';

// TODO refactor this view and provide a better, cleaner API.

interface Props {
  href?: string;
  page?: Page;
  text?: string;
  buttonColor?: string;
  textColor?: string;
  className?: string;
  buttonTag?: 'button' | 'a' | 'span';
  buttonClassName?: string;
  disabled?: boolean;
  nav?: boolean;
  children?: Array<ReactElement<any>> | string;
  onClick?(): void;
}

function Link(props: Props) {
  const {
    buttonColor = 'link',
    textColor = 'primary',
    className = '',
    buttonTag = 'button',
    buttonClassName = '',
    text = '',
    disabled = false,
    nav = false,
    children = [],
    onClick
  } = props;
  const href = props.page ? AppRouter.pageToUrl(props.page) : (props.href || undefined);
  const aProps = {
    onClick: (e: MouseEvent<HTMLAnchorElement>) => {
      if (disabled) { e.preventDefault(); }
      if (onClick) { onClick(); }
    },
    style: { cursor: disabled ? 'default' : 'pointer' },
    className: `${nav ? 'nav-link py-0 py-md-2 ' : ''}${className}`,
    href: disabled ? undefined : href
  };
  const buttonProps = {
    color: buttonColor,
    tag: buttonTag,
    className: `${nav && buttonColor !== 'link' ? 'mb-2 mb-md-0 ' : ''}${!props.buttonColor && props.textColor ? `text-${textColor} ` : ''}${buttonClassName}`,
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
