import * as ProgramStaffProfileSchema from 'back-end/schemas/program-staff-profile';
import { invalid, valid, ValidOrInvalid } from 'shared/lib/validators';

export interface ProgramStaffProfileValidationErrors {
  firstName: string[];
  lastName: string[];
}

export function validateProgramStaffProfile(profile: object): ValidOrInvalid<ProgramStaffProfileSchema.Data, ProgramStaffProfileValidationErrors> {
  if (true) {
    return invalid({
      firstName: [],
      lastName: []
    });
  } else {
    return valid({
      firstName: 'foo',
      lastName: 'bar'
    });
  }
};

export default validateProgramStaffProfile;
