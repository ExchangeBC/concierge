import * as BuyerProfileSchema from 'back-end/schemas/buyer-profile';
import * as ProgramStaffProfileSchema from 'back-end/schemas/program-staff-profile';
import * as VendorProfileSchema from 'back-end/schemas/vendor-profile';
import { UserType } from 'shared/lib/types';
import { invalid, valid, Validation, ValidOrInvalid } from 'shared/lib/validators';
import { BuyerProfileValidationErrors, validateBuyerProfile } from 'shared/lib/validators/buyer-profile';
import { ProgramStaffProfileValidationErrors, validateProgramStaffProfile } from 'shared/lib/validators/program-staff-profile';
import { validateVendorProfile, VendorProfileValidationErrors } from 'shared/lib/validators/vendor-profile';

export type Profile = BuyerProfileSchema.Data | ProgramStaffProfileSchema.Data | VendorProfileSchema.Data;

export type ProfileValidationErrors = BuyerProfileValidationErrors | VendorProfileValidationErrors | ProgramStaffProfileValidationErrors;

export type FullProfileValidationErrors = ProfileValidationErrors | string[];

export async function validateProfile(profile: object, validatedUserType: Validation<UserType>): Promise<ValidOrInvalid<Profile, FullProfileValidationErrors>> {
  if (validatedUserType.tag === 'invalid') {
    return invalid(['Cannot validate a user profile without a valid user type.']);
  }
  let validatedProfile: ValidOrInvalid<Profile, ProfileValidationErrors> | undefined;
  switch (validatedUserType.value) {
    case UserType.Buyer:
      validatedProfile = await validateBuyerProfile(profile);
      break;
    case UserType.Vendor:
      validatedProfile = validateVendorProfile(profile);
      break;
    case UserType.ProgramStaff:
      validatedProfile = validateProgramStaffProfile(profile);
      break;
  }
  if (!validatedProfile) {
    return invalid(['Unable to validate profile']);
  }
  switch (validatedProfile.tag) {
    case 'invalid':
      return invalid(validatedProfile.value);
    case 'valid':
      return valid(validatedProfile.value);
  }
}
