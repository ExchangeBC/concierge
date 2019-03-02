import { Profile } from 'shared/lib/types';
import { FullProfileValidationErrors } from 'shared/lib/validators/profile';

export interface PublicUser {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  email: string;
  acceptedTermsAt?: Date;
  active: boolean;
  profile: Profile;
}

export interface CreateValidationErrors {
  permissions?: string[];
  email?: string[];
  password?: string[];
  profile?: FullProfileValidationErrors;
}

export interface UpdateValidationErrors extends CreateValidationErrors {
  id?: string[];
  currentPassword?: string[];
  acceptedTerms?: string[];
}
