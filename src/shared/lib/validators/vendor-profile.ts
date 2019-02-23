import * as VendorProfileSchema from 'back-end/schemas/vendor-profile';
import { invalid, ValidOrInvalid } from 'shared/lib/validators';

export interface VendorProfileValidationErrors {
  name: string[];
}

export function validateVendorProfile(profile: object): ValidOrInvalid<VendorProfileSchema.Data, VendorProfileValidationErrors> {
  return invalid({
    name: []
  });
}

export default validateVendorProfile;
