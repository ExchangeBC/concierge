import { PublicUser } from 'shared/lib/resources/user';
import { Omit } from 'shared/lib/types';

export interface Attendee {
  name: string;
  email: string;
  remote: boolean;
}

export interface PublicDiscoveryDayResponse {
  createdAt: Date;
  updatedAt: Date;
  vendor: PublicUser;
  attendees: Attendee[];
}

export interface CreateRequestBody {
  rfiId: string;
  vendorId: string;
  attendees: Attendee[];
}

export interface AttendeeValidationErrors {
  name?: string[];
  email?: string[];
  remote?: string[];
}

export interface CreateValidationErrors {
  permissions?: string[];
  contentType?: string[];
  rfiId?: string[];
  vendorId?: string[];
  attendees?: AttendeeValidationErrors[];
}

export type UpdateRequestBody = Pick<CreateRequestBody, 'attendees'>;

export type UpdateValidationErrors = Omit<CreateValidationErrors, 'vendorId'>;

type AttendeeIndex = Record<string, Attendee | undefined>;

function indexAttendeesByEmail(attendees: Attendee[]): AttendeeIndex {
  return attendees.reduce((acc: AttendeeIndex, attendee) => {
    return {
      ...acc,
      [attendee.email]: attendee
    };
  }, {});
}

interface AttendeeDiff {
  created: Attendee[];
  updated: Attendee[];
  deleted: Attendee[];
}

/**
 * Diff attendees to determine which attendees
 * are new, which have been updated, and which have
 * been removed.
 */

export function diffAttendees(oldAttendees: Attendee[], newAttendees: Attendee[]): AttendeeDiff {
  const oldByEmail = indexAttendeesByEmail(oldAttendees);
  const newByEmail = indexAttendeesByEmail(newAttendees);
  const created = newAttendees.filter(attendee => !oldByEmail[attendee.email]);
  const updated = newAttendees.filter(attendee => {
    const comparison = oldByEmail[attendee.email];
    if (!comparison) { return false; }
    return attendee.name !== comparison.name || attendee.remote !== comparison.remote;
  });
  const deleted = oldAttendees.filter(attendee => !newByEmail[attendee.email]);
  return { created, updated, deleted };
}
