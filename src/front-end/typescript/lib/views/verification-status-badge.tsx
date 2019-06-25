import { View } from 'front-end/lib/framework';
import { BootstrapColor } from 'front-end/lib/types';
import Icon from 'front-end/lib/views/icon';
import { CSSProperties, default as React } from 'react';
import { Badge as BootstrapBadge } from 'reactstrap';
import { VerificationStatus, verificationStatusToTitleCase } from 'shared/lib/types';

interface Props {
  verificationStatus: VerificationStatus;
  className?: string;
  style?: CSSProperties;
}

export function verificationStatusToColor(s: VerificationStatus): BootstrapColor {
  switch (s) {
    case VerificationStatus.Verified:
      return 'success';
    case VerificationStatus.UnderReview:
    case VerificationStatus.Unverified:
      return 'warning';
    case VerificationStatus.Declined:
      return 'danger';
  }
}

export const VerificationStatusIcon: View<Pick<Props, 'verificationStatus' | 'className'> & { colored?: boolean, large?: boolean }> = ({ verificationStatus, colored, className, large }) => {
  const color = colored ? verificationStatusToColor(verificationStatus) : undefined;
  const size = large ? 1.25 : 1;
  switch (verificationStatus) {
    case VerificationStatus.Unverified:
    case VerificationStatus.UnderReview:
      return (<Icon name='exclamation-circle' color={color} width={size} height={size} className={className} />);
    case VerificationStatus.Verified:
      return (<Icon name='check' color={color} width={size} height={size} className={className} />);
    case VerificationStatus.Declined:
      return (<Icon name='times-circle' color={color} width={size} height={size} className={className} />);
  }
};

export const Badge: View<Props> = props => {
  const { verificationStatus, className = '', style = {} } = props;
  return (
    <BootstrapBadge color={verificationStatusToColor(verificationStatus)} className={`text-uppercase font-size-regular align-items-center ${className}`} style={{ ...style, padding: '0.4rem' }}>
      <VerificationStatusIcon verificationStatus={verificationStatus} className='mr-1' />
      {verificationStatusToTitleCase(verificationStatus)}
    </BootstrapBadge>
  );
};

export default Badge;
