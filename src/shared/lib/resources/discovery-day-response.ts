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
  vendor?: string[];
  attendees?: AttendeeValidationErrors[];
}

export type UpdateRequestBody = Pick<CreateRequestBody, 'attendees'>;

export type UpdateValidationErrors = Omit<CreateValidationErrors, 'vendor'>;
