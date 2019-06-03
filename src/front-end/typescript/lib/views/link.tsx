import router from 'front-end/lib/app/router';
import { Route } from 'front-end/lib/app/types';
import { ButtonColor, TextColor } from 'front-end/lib/types';
import { CSSProperties, default as React, MouseEvent, ReactElement } from 'react';

// TODO refactor this view and provide a better, cleaner API.

interface BaseProps {
  children: Array<ReactElement<any> | string> | ReactElement<any> | string;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  href?: string;
  route?: Route;
  onClick?(): void;
}

interface AnchorProps extends BaseProps {
  button?: false;
  color?: TextColor;
  nav?: boolean;
}

interface ButtonProps extends BaseProps {
  button: true;
  outline?: boolean;
  color?: ButtonColor;
  size?: 'sm' | 'md' | 'lg';
}

type Props = AnchorProps | ButtonProps;

function AnchorLink(props: AnchorProps) {
  // Initialize props.
  const {
    color,
    nav = false,
    className = '',
    disabled = false,
    children,
    // href defaults to empty string so browser styles work properly.
    href = '',
    route,
    onClick
  } = props;
  // Give precedence to the `route` prop over the `href` prop.
  const finalHref: string
    = disabled
    ? ''
    : route
    ? router.routeToUrl(route)
    : href;
  let finalClassName = className;
  finalClassName += nav ? ' nav-link' : '';
  finalClassName += disabled ? ' disabled' : '';
  finalClassName += color ? ` text-${color}` : '';
  const finalOnClick = onClick && ((e: MouseEvent<HTMLAnchorElement>) => {
    if (disabled) { e.preventDefault(); }
    onClick();
  });
  return (
    <a href={finalHref} onClick={finalOnClick} className={finalClassName}>
      {children}
    </a>
  );
}

function ButtonLink(props: ButtonProps) {
  const {
    color,
    size = 'md',
    className = '',
    outline = false
  } = props;
  const anchorProps: AnchorProps = {
    ...props,
    button: false,
    color: undefined,
    className: `${className} btn btn-${size} ${color ? `btn-${outline ? 'outline-' : ''}${color}` : ''}`
  };
  return (
    <AnchorLink {...anchorProps} />
  );
}

function Link(props: Props) {
  if (props.button) {
    return (<ButtonLink {...props} />);
  } else {
    return (<AnchorLink {...props} />);
  }
}

export default Link;
