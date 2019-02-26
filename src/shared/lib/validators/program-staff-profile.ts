import { getString } from 'shared/lib';
import { ProgramStaffProfile } from 'shared/lib/types';
import { allValid, getInvalidValue, getValidValue, invalid, optional, valid, validateCity, validateCountry, validateFirstName, validateLastName, validatePhoneCountryCode, validatePhoneNumber, validatePhoneType, validatePositionTitle, validatePostalCode, validateProvince, validateStreetAddress, ValidOrInvalid } from './';

export interface ProgramStaffProfileValidationErrors {
  firstName: string[];
  lastName: string[];
  positionTitle: string[];
  contactStreetAddress: string[];
  contactCity: string[];
  contactProvince: string[];
  contactPostalCode: string[];
  contactCountry: string[];
  contactPhoneNumber: string[];
  contactPhoneCountryCode: string[];
  contactPhoneType: string[];
}

export function validateProgramStaffProfile(profile: object): ValidOrInvalid<ProgramStaffProfile, ProgramStaffProfileValidationErrors> {
  const validatedFirstName = optional(validateFirstName, getString(profile, 'firstName'));
  const validatedLastName = optional(validateLastName, getString(profile, 'lastName'));
  const validatedPositionTitle = optional(validatePositionTitle, getString(profile, 'positionTitle'));
  const validatedContactStreetAddress = optional(validateStreetAddress, getString(profile, 'contactStreetAddress'));
  const validatedContactCity = optional(validateCity, getString(profile, 'contactCity'));
  const validatedContactProvince = optional(validateProvince, getString(profile, 'contactProvince'));
  const validatedContactPostalCode = optional(validatePostalCode, getString(profile, 'contactPostalCode'));
  const validatedContactCountry = optional(validateCountry, getString(profile, 'contactCountry'));
  const validatedContactPhoneNumber = optional(validatePhoneNumber, getString(profile, 'contactPhoneNumber'));
  const validatedContactPhoneCountryCode = optional(validatePhoneCountryCode, getString(profile, 'contactPhoneCountryCode'));
  const validatedContactPhoneType = optional(validatePhoneType, getString(profile, 'contactPhoneType'));
  if (allValid([validatedFirstName, validatedLastName, validatedPositionTitle, validatedContactStreetAddress, validatedContactCity, validatedContactProvince, validatedContactPostalCode, validatedContactCountry, validatedContactPhoneNumber, validatedContactPhoneCountryCode, validatedContactPhoneType])) {
    return valid({
      type: 'program_staff' as 'program_staff',
      firstName: getValidValue(validatedFirstName, undefined),
      lastName: getValidValue(validatedLastName, undefined),
      positionTitle: getValidValue(validatedPositionTitle, undefined),
      contactStreetAddress: getValidValue(validatedContactStreetAddress, undefined),
      contactCity: getValidValue(validatedContactCity, undefined),
      contactProvince: getValidValue(validatedContactProvince, undefined),
      contactPostalCode: getValidValue(validatedContactPostalCode, undefined),
      contactCountry: getValidValue(validatedContactCountry, undefined),
      contactPhoneNumber: getValidValue(validatedContactPhoneNumber, undefined),
      contactPhoneCountryCode: getValidValue(validatedContactPhoneCountryCode, undefined),
      contactPhoneType: getValidValue(validatedContactPhoneType, undefined)
    });
  } else {
    return invalid({
      firstName: getInvalidValue(validatedFirstName, [] as string[]),
      lastName: getInvalidValue(validatedLastName, [] as string[]),
      positionTitle: getInvalidValue(validatedPositionTitle, [] as string[]),
      contactStreetAddress: getInvalidValue(validatedContactStreetAddress, [] as string[]),
      contactCity: getInvalidValue(validatedContactCity, [] as string[]),
      contactProvince: getInvalidValue(validatedContactProvince, [] as string[]),
      contactPostalCode: getInvalidValue(validatedContactPostalCode, [] as string[]),
      contactCountry: getInvalidValue(validatedContactCountry, [] as string[]),
      contactPhoneNumber: getInvalidValue(validatedContactPhoneNumber, [] as string[]),
      contactPhoneCountryCode: getInvalidValue(validatedContactPhoneCountryCode, [] as string[]),
      contactPhoneType: getInvalidValue(validatedContactPhoneType, [] as string[])
    });
  }
}

export default validateProgramStaffProfile;
