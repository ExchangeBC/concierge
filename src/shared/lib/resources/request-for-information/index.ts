import { diffDates } from 'shared/lib';
import { PublicDiscoveryDayResponse } from 'shared/lib/resources/discovery-day-response';
import { PublicFile } from 'shared/lib/resources/file';
import { PublicUser } from 'shared/lib/resources/user';
import { Addendum, RfiStatus } from 'shared/lib/types';

export interface PublicDiscoveryDay {
  description?: string;
  occurringAt: Date;
  location: string;
  venue: string;
  remoteAccess: string;
}

export function discoveryDayHasChanged(oldDiscoveryDay: PublicDiscoveryDay, newDiscoveryDay: PublicDiscoveryDay): boolean {
  return oldDiscoveryDay.occurringAt.toString() !== newDiscoveryDay.occurringAt.toString()
      || oldDiscoveryDay.venue !== newDiscoveryDay.venue
      || oldDiscoveryDay.remoteAccess !== newDiscoveryDay.remoteAccess;
}

export interface PublicVersion {
  createdAt: Date;
  closingAt: Date;
  gracePeriodDays: number;
  rfiNumber: string;
  title: string;
  description: string;
  publicSectorEntity: string;
  categories: string[];
  discoveryDay?: PublicDiscoveryDay;
  addenda: Addendum[];
  attachments: PublicFile[];
  programStaffContact: {
    _id?: string; // Only defined for Program Staff.
    firstName: string;
    lastName: string;
    positionTitle: string;
  };
  buyerContact?: PublicUser; // Only defined for Program Staff.
}

export interface PublicRfi {
  _id: string;
  createdAt: Date;
  publishedAt: Date;
  latestVersion: PublicVersion;
  discoveryDayResponses?: PublicDiscoveryDayResponse[]; // Only defined for Program Staff.
}

export interface CreateDiscoveryDayBody {
  description?: string;
  date: string;
  time: string;
  location: string;
  venue: string;
  remoteAccess: string;
}

export interface CreateRequestBody {
  rfiNumber: string;
  title: string;
  publicSectorEntity: string;
  description: string;
  discoveryDay?: CreateDiscoveryDayBody;
  closingDate: string;
  closingTime: string;
  gracePeriodDays?: number;
  buyerContact: string;
  programStaffContact: string;
  categories: string[];
  attachments: string[];
  addenda: string[];
}

export interface DiscoveryDayValidationErrors {
  description?: string[];
  date?: string[];
  time?: string[];
  location?: string[];
  venue?: string[];
  remoteAccess?: string[];
}

export interface CreateValidationErrors {
  permissions?: string[];
  contentType?: string[];
  closingDate?: string[];
  closingTime?: string[];
  gracePeriodDays?: string[];
  rfiNumber?: string[];
  title?: string[];
  description?: string[];
  publicSectorEntity?: string[];
  numCategories?: string[];
  categories?: string[][];
  discoveryDay?: DiscoveryDayValidationErrors;
  addenda?: string[][];
  attachments?: string[][];
  buyerContact?: string[];
  programStaffContact?: string[];
}

export type UpdateRequestBody = CreateRequestBody;

export interface UpdateValidationErrors extends CreateValidationErrors {
  rfiId?: string[];
}

/**
 * Constant to be used as an Addendum's description
 * to mark it for deletion when updating an RFI.
 */

export const DELETE_ADDENDUM_TOKEN = '$$__DELETE_ADDENDUM_TOKEN__$$';

export function determineRfiStatus(closingAt: Date, gracePeriodDays: number): RfiStatus {
  const days = diffDates(closingAt, new Date(), 'days');
  if (days >= (-1 * gracePeriodDays) && days <= 0) {
    return RfiStatus.Closed;
  } else if (days > 0) {
    return RfiStatus.Open;
  } else {
    return RfiStatus.Expired;
  }
}

export function rfiToRfiStatus(rfi: PublicRfi): RfiStatus {
  return determineRfiStatus(rfi.latestVersion.closingAt, rfi.latestVersion.gracePeriodDays);
}
