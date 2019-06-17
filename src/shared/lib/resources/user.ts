import { BuyerProfile, Omit, Profile, ProgramStaffProfile, VendorProfile } from 'shared/lib/types';
import { FullProfileValidationErrors } from 'shared/lib/validators/profile';

type BuyerWithoutVerificationStatus = Omit<BuyerProfile, 'verificationStatus'>;

type BuyerWithOptionalVerificationStatus = Omit<BuyerProfile, 'verificationStatus'> & Partial<Pick<BuyerProfile, 'verificationStatus'>>;

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
  profile: VendorProfile | ProgramStaffProfile | BuyerWithoutVerificationStatus;
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
  profile?: VendorProfile | ProgramStaffProfile | BuyerWithOptionalVerificationStatus;
  acceptedTerms?: boolean;
}

export interface UpdateValidationErrors extends CreateValidationErrors {
  id?: string[];
  currentPassword?: string[];
  acceptedTerms?: string[];
}
