import { getString } from 'shared/lib';
import { Profile, UserType } from 'shared/lib/types';
import { invalid, valid, validateUserType, ValidOrInvalid } from 'shared/lib/validators';
import { BuyerProfileValidationErrors, validateBuyerProfile } from 'shared/lib/validators/buyer-profile';
import { ProgramStaffProfileValidationErrors, validateProgramStaffProfile } from 'shared/lib/validators/program-staff-profile';
import { validateVendorProfile, VendorProfileValidationErrors } from 'shared/lib/validators/vendor-profile';

export type ProfileValidationErrors = BuyerProfileValidationErrors | VendorProfileValidationErrors | ProgramStaffProfileValidationErrors;

export type FullProfileValidationErrors = ProfileValidationErrors | string[];

export function validateProfile(profile: object): ValidOrInvalid<Profile, FullProfileValidationErrors> {
  const validatedUserType = validateUserType(getString(profile, 'type'));
  if (validatedUserType.tag === 'invalid') {
    return invalid(['Cannot validate a user profile without a valid user type.']);
  }
  let validatedProfile: ValidOrInvalid<Profile, ProfileValidationErrors> | undefined;
  switch (validatedUserType.value) {
    case UserType.Buyer:
      validatedProfile = validateBuyerProfile(profile);
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
