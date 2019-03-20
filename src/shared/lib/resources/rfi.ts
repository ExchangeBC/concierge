import { PublicFile } from 'shared/lib/resources/file';
import { PublicUser } from 'shared/lib/resources/user';
import { Addendum } from 'shared/lib/types';

export interface PublicVersion {
  createdAt: Date;
  closingAt: Date;
  rfiNumber: string;
  title: string;
  description: string;
  publicSectorEntity: string;
  categories: string[];
  discoveryDay: boolean;
  addenda: Addendum[];
  attachments: PublicFile[];
  programStaffContact: PublicUser;
  buyerContact?: PublicUser; // Only defined for Program Staff.
}

// TODO stub implementation.
interface PublicDiscoveryDayResponse {
  empty: true;
}

export interface PublicRfi {
  _id: string;
  createdAt: Date;
  publishedAt: Date;
  latestVersion?: PublicVersion;
  discoveryDayResponses?: PublicDiscoveryDayResponse[]; // Only defined for Program Staff.
}
