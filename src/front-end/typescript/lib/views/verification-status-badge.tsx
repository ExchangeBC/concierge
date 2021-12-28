import { View } from 'front-end/lib/framework';
import { BootstrapColor } from 'front-end/lib/types';
import Icon from 'front-end/lib/views/icon';
import { CSSProperties, default as React } from 'react';
import { Badge as BootstrapBadge } from 'reactstrap';
import { VerificationStatus, verificationStatusToTitleCase } from 'shared/lib/types';

interface VerificationStatusProps {
  verificationStatus: VerificationStatus;
  className?: string;
  style?: CSSProperties;
}

interface AccountStatusProps {
  active: boolean;
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

export function accountStatusToColor(active: boolean): BootstrapColor {
  return active ? 'success' : 'danger';
}

export const VerificationStatusIcon: View<Pick<VerificationStatusProps, 'verificationStatus' | 'className'> & { colored?: boolean; large?: boolean }> = ({ verificationStatus, colored, className, large }) => {
  const color = colored ? verificationStatusToColor(verificationStatus) : undefined;
  const size = large ? 1.25 : 1;
  switch (verificationStatus) {
    case VerificationStatus.Unverified:
    case VerificationStatus.UnderReview:
      return <Icon name="exclamation-circle" color={color} width={size} height={size} className={className} />;
    case VerificationStatus.Verified:
      return <Icon name="check" color={color} width={size} height={size} className={className} />;
    case VerificationStatus.Declined:
      return <Icon name="times-circle" color={color} width={size} height={size} className={className} />;
  }
};

export const AccountStatusIcon: View<Pick<AccountStatusProps, 'active' | 'className'> & { colored?: boolean; large?: boolean }> = ({ active, colored, className, large }) => {
  const color = colored ? accountStatusToColor(active) : undefined;
  const size = large ? 1.25 : 1;
  return active ? <Icon name="check" color={color} width={size} height={size} className={className} /> : <Icon name="times-circle" color={color} width={size} height={size} className={className} />;
};

export const Badge: View<VerificationStatusProps> = (props) => {
  const { verificationStatus, className = '', style = {} } = props;
  return (
    <BootstrapBadge color={verificationStatusToColor(verificationStatus)} className={`text-uppercase font-size-regular align-items-center ${className}`} style={{ ...style }}>
      <VerificationStatusIcon verificationStatus={verificationStatus} className="mr-1" />
      {verificationStatusToTitleCase(verificationStatus)}
    </BootstrapBadge>
  );
};

export default Badge;
