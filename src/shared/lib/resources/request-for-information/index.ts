import { diffDates } from 'shared/lib';
import { PublicDiscoveryDayResponse } from 'shared/lib/resources/discovery-day-response';
import { PublicFile } from 'shared/lib/resources/file';
import { PublicUser } from 'shared/lib/resources/user';
import { Addendum, RfiStatus } from 'shared/lib/types';

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

export interface CreateValidationErrors {
  permissions?: string[];
  contentType?: string[];
  closingDate?: string[];
  closingTime?: string[];
  rfiNumber?: string[];
  title?: string[];
  description?: string[];
  publicSectorEntity?: string[];
  numCategories?: string[];
  categories?: string[][];
  discoveryDay?: string[];
  addenda?: string[][];
  attachments?: string[][];
  buyerContact?: string[];
  programStaffContact?: string[];
}

export interface UpdateValidationErrors extends CreateValidationErrors {
  rfiId?: string[];
}

/**
 * Constant to be used as an Addendum's description
 * to mark it for deletion when updating an RFI.
 */

export const DELETE_ADDENDUM_TOKEN = '$$__DELETE_ADDENDUM_TOKEN__$$';

export const RFI_EXPIRY_WINDOW_DAYS = 2;

export function rfiClosingAtToRfiStatus(closingAt: Date): RfiStatus {
  const days = diffDates(closingAt, new Date(), 'days');
  if (days >= (-1 * RFI_EXPIRY_WINDOW_DAYS) && days <= 0) {
    return RfiStatus.Closed;
  } else if (days > 0) {
    return RfiStatus.Open;
  } else {
    return RfiStatus.Expired;
  }
}

export function rfiToRfiStatus(rfi: PublicRfi): RfiStatus {
  return rfiClosingAtToRfiStatus(rfi.latestVersion.closingAt);
}
