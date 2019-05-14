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

export interface CreateRequestBody {
  email: string;
  password: string;
  profile: Profile;
  acceptedTerms?: boolean;
}

export interface CreateValidationErrors {
  permissions?: string[];
  email?: string[];
  password?: string[];
  profile?: FullProfileValidationErrors;
}

export interface UpdateRequestBody {
  id: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  profile?: Profile;
  acceptedTerms?: boolean;
}

export interface UpdateValidationErrors extends CreateValidationErrors {
  id?: string[];
  currentPassword?: string[];
  acceptedTerms?: string[];
}
