import AVAILABLE_MINISTRIES from 'shared/data/ministries';
import { getString, getStringArray } from 'shared/lib';
import { BuyerProfile } from 'shared/lib/types';
import { allValid, getInvalidValue, getValidValue, invalid, optional, valid, validateCategories, validateCity, validateCountry, validateFirstName, validateGenericString, validateIndustrySectors, validateLastName, validatePhoneCountryCode, validatePhoneNumber, validatePhoneType, validatePositionTitle, validatePostalCode, validateProvince, validateStreetAddress, validateStringArray, Validation, ValidOrInvalid } from './';

export interface BuyerProfileValidationErrors {
  firstName: string[];
  lastName: string[];
  positionTitle: string[];
  ministry: string[];
  branch: string[];
  contactStreetAddress: string[];
  contactCity: string[];
  contactProvince: string[];
  contactPostalCode: string[];
  contactCountry: string[];
  contactPhoneNumber: string[];
  contactPhoneCountryCode: string[];
  contactPhoneType: string[];
  industrySectors: string[];
  areasOfInterest: string[];
}

export function validateMinistry(ministry: string): Validation<string> {
  const result = validateStringArray([ministry], AVAILABLE_MINISTRIES, 'Ministry');
  switch (result.tag) {
    case 'valid':
      return valid(ministry);
    case 'invalid':
      return result;
  }
}

export function validateBranch(branch: string): Validation<string> {
  return validateGenericString(branch, 'Branch');
}

export function validateBuyerProfile(profile: object): ValidOrInvalid<BuyerProfile, BuyerProfileValidationErrors> {
  const validatedFirstName = optional(validateFirstName, getString(profile, 'firstName'), '');
  const validatedLastName = optional(validateLastName, getString(profile, 'lastName'), '');
  const validatedPositionTitle = optional(validatePositionTitle, getString(profile, 'positionTitle'), '');
  const validatedMinistry = optional(validateMinistry, getString(profile, 'ministry'), '');
  const validatedBranch = optional(validateBranch, getString(profile, 'branch'), '');
  const validatedContactStreetAddress = optional(validateStreetAddress, getString(profile, 'contactStreetAddress'), '');
  const validatedContactCity = optional(validateCity, getString(profile, 'contactCity'), '');
  const validatedContactProvince = optional(validateProvince, getString(profile, 'contactProvince'), '');
  const validatedContactPostalCode = optional(validatePostalCode, getString(profile, 'contactPostalCode'), '');
  const validatedContactCountry = optional(validateCountry, getString(profile, 'contactCountry'), '');
  const validatedContactPhoneNumber = optional(validatePhoneNumber, getString(profile, 'contactPhoneNumber'), '');
  const validatedContactPhoneCountryCode = optional(validatePhoneCountryCode, getString(profile, 'contactPhoneCountryCode'), '');
  const validatedContactPhoneType = optional(validatePhoneType, getString(profile, 'contactPhoneType'), '');
  const validatedIndustrySectors = optional(validateIndustrySectors, getStringArray(profile, 'industrySectors'), []);
  const validatedAreasOfInterest = optional(v => validateCategories(v, 'Areas of Interest'), getStringArray(profile, 'areasOfInterest'), []);
  if (allValid([validatedFirstName, validatedLastName, validatedPositionTitle, validatedMinistry, validatedBranch, validatedContactStreetAddress, validatedContactCity, validatedContactProvince, validatedContactPostalCode, validatedContactCountry, validatedContactPhoneNumber, validatedContactPhoneCountryCode, validatedContactPhoneType, validatedIndustrySectors, validatedAreasOfInterest])) {
    return valid({
      type: 'buyer' as 'buyer',
      firstName: getValidValue(validatedFirstName, undefined),
      lastName: getValidValue(validatedLastName, undefined),
      positionTitle: getValidValue(validatedPositionTitle, undefined),
      ministry: getValidValue(validatedMinistry, undefined),
      branch: getValidValue(validatedBranch, undefined),
      contactStreetAddress: getValidValue(validatedContactStreetAddress, undefined),
      contactCity: getValidValue(validatedContactCity, undefined),
      contactProvince: getValidValue(validatedContactProvince, undefined),
      contactPostalCode: getValidValue(validatedContactPostalCode, undefined),
      contactCountry: getValidValue(validatedContactCountry, undefined),
      contactPhoneNumber: getValidValue(validatedContactPhoneNumber, undefined),
      contactPhoneCountryCode: getValidValue(validatedContactPhoneCountryCode, undefined),
      contactPhoneType: getValidValue(validatedContactPhoneType, undefined),
      industrySectors: getValidValue(validatedIndustrySectors, undefined),
      areasOfInterest: getValidValue(validatedAreasOfInterest, undefined)
    });
  } else {
    return invalid({
      firstName: getInvalidValue(validatedFirstName, [] as string[]),
      lastName: getInvalidValue(validatedLastName, [] as string[]),
      positionTitle: getInvalidValue(validatedPositionTitle, [] as string[]),
      ministry: getInvalidValue(validatedMinistry, [] as string[]),
      branch: getInvalidValue(validatedBranch, [] as string[]),
      contactStreetAddress: getInvalidValue(validatedContactStreetAddress, [] as string[]),
      contactCity: getInvalidValue(validatedContactCity, [] as string[]),
      contactProvince: getInvalidValue(validatedContactProvince, [] as string[]),
      contactPostalCode: getInvalidValue(validatedContactPostalCode, [] as string[]),
      contactCountry: getInvalidValue(validatedContactCountry, [] as string[]),
      contactPhoneNumber: getInvalidValue(validatedContactPhoneNumber, [] as string[]),
      contactPhoneCountryCode: getInvalidValue(validatedContactPhoneCountryCode, [] as string[]),
      contactPhoneType: getInvalidValue(validatedContactPhoneType, [] as string[]),
      industrySectors: getInvalidValue(validatedIndustrySectors, [] as string[]),
      areasOfInterest: getInvalidValue(validatedAreasOfInterest, [] as string[])
    });
  }
}

export default validateBuyerProfile;
