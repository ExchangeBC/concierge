import { default as React } from 'react';
import { Button } from 'reactstrap';

function Link(props: { buttonColor?: string, textColor?: string, href: string, text: string }) {
  const buttonColor = props.buttonColor || 'link';
  const textColor = props.textColor || 'primary';
  return (
    <a href={props.href}>
      <Button color={buttonColor} className={props.buttonColor ? '' : `text-${textColor}`}>
        {props.text}
      </Button>
    </a>
  );
}

export default Link;
