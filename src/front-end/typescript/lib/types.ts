import { diffDates } from 'shared/lib';
import { PublicRfi } from 'shared/lib/resources/request-for-information';

export type BootstrapColor = 'body' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' | 'muted' | 'white';

export enum RfiStatus {
  Open = 'OPEN',
  Closed = 'CLOSED',
  Expired = 'EXPIRED'
}

export function parseRfiStatus(raw: string): RfiStatus | null {
  switch (raw.toUpperCase()) {
    case RfiStatus.Open:
      return RfiStatus.Open;
    case RfiStatus.Closed:
      return RfiStatus.Closed;
    case RfiStatus.Expired:
      return RfiStatus.Expired;
    default:
      return null;
  }
}

export function rfiStatusToTitleCase(s: RfiStatus): string {
  switch (s) {
    case RfiStatus.Open:
      return 'Open';
    case RfiStatus.Closed:
    case RfiStatus.Expired:
      return 'Closed';
  }
}

const RFI_EXPIRY_WINDOW_DAYS = 2;

export function rfiToRfiStatus(rfi: PublicRfi): RfiStatus | null {
  const { latestVersion } = rfi;
  if (!latestVersion) {
    return null;
  }
  const days = diffDates(latestVersion.closingAt, new Date(), 'days');
  if (days >= (-1 * RFI_EXPIRY_WINDOW_DAYS) && days <= 0) {
    return RfiStatus.Expired;
  } else if (days > 0) {
    return RfiStatus.Open;
  } else {
    return RfiStatus.Closed;
  }
}
