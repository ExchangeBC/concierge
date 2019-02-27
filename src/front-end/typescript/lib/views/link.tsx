import { default as React } from 'react';
import { Button } from 'reactstrap';

interface Props {
  buttonColor?: string;
  textColor?: string;
  href: string;
  text: string;
  disabled?: boolean;
}

function Link(props: Props) {
  const { buttonColor = 'link', textColor = 'primary', href, text, disabled = false } = props;
  return (
    <a href={href} style={{ pointerEvents: disabled ? 'none' : undefined }}>
      <Button color={buttonColor} className={props.buttonColor ? '' : `text-${textColor}`} disabled={disabled}>
        {text}
      </Button>
    </a>
  );
}

export default Link;
