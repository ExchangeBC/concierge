import { View } from 'front-end/lib/framework';
import { CSSProperties, default as React } from 'react';
import { Badge as BootstrapBadge } from 'reactstrap';
import { diffDates } from 'shared/lib';
import { PublicRfi } from 'shared/lib/resources/request-for-information';

const EXPIRY_WINDOW_DAYS = 2;

type Status = 'open' | 'closed' | 'expired' | 'preview' | 'unknown';

interface Props {
  status: Status;
  className?: string;
  style?: CSSProperties;
}

export function statusToColor(s: Status): 'success' | 'danger' | 'secondary' {
  switch (s) {
    case 'open':
      return 'success';
    case 'closed':
    case 'expired':
      return 'danger';
    case 'preview':
    case 'unknown':
      return 'secondary';
  }
}

export function statusToText(s: Status): string {
  switch (s) {
    case 'open':
      return 'Open';
    case 'closed':
    case 'expired':
      return 'Closed';
    case 'preview':
      return 'Preview';
    case 'unknown':
      return 'Unknown';
  }
}

export function rfiToStatus(rfi: PublicRfi): Status {
  const { latestVersion } = rfi;
  if (!latestVersion) {
    return 'unknown';
  }
  const days = diffDates(latestVersion.closingAt, new Date(), 'days');
  if (days <= (-1 * EXPIRY_WINDOW_DAYS)) {
    return 'expired';
  } else if (days > 0) {
    return 'open';
  } else {
    return 'closed';
  }
}

export const Badge: View<Props> = props => {
  const { status: statusText, className, style = {} } = props;
  return (
    <BootstrapBadge color={statusToColor(statusText)} className={className} style={style || {}}>
      {statusToText(statusText)}
    </BootstrapBadge>
  );
};
