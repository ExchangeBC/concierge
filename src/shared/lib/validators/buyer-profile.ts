import { getString, getStringArray } from 'shared/lib';
import { BuyerProfile, UserType } from 'shared/lib/types';
import { allValid, getInvalidValue, getValidValue, invalid, optional, valid, validateCategories, validateCity, validateCountry, validateFirstName, validateGenericString, validateIndustrySectors, validateLastName, validatePhoneCountryCode, validatePhoneNumber, validatePhoneType, validatePositionTitle, validatePostalCode, validateProvince, validateStreetAddress, Validation, ValidOrInvalid } from './';

export interface BuyerProfileValidationErrors {
  firstName?: string[];
  lastName?: string[];
  positionTitle?: string[];
  publicSectorEntity?: string[];
  branch?: string[];
  contactStreetAddress?: string[];
  contactCity?: string[];
  contactProvince?: string[];
  contactPostalCode?: string[];
  contactCountry?: string[];
  contactPhoneNumber?: string[];
  contactPhoneCountryCode?: string[];
  contactPhoneType?: string[];
  industrySectors?: string[][];
  areasOfInterest?: string[][];
}

export function validatePublicSectorEntity(value: string): Validation<string> {
  return validateGenericString(value, 'Public Sector Entities');
}

export function validateBranch(branch: string): Validation<string> {
  return validateGenericString(branch, 'Branch');
}

export function validateBuyerProfile(profile: object): ValidOrInvalid<BuyerProfile, BuyerProfileValidationErrors> {
  const validatedFirstName = validateFirstName(getString(profile, 'firstName'));
  const validatedLastName = validateLastName(getString(profile, 'lastName'));
  const validatedPositionTitle = validatePositionTitle(getString(profile, 'positionTitle'));
  const validatedPublicSectorEntity = validatePublicSectorEntity(getString(profile, 'publicSectorEntity'));
  const validatedBranch = optional(validateBranch, getString(profile, 'branch'));
  const validatedContactStreetAddress = optional(validateStreetAddress, getString(profile, 'contactStreetAddress'));
  const validatedContactCity = optional(validateCity, getString(profile, 'contactCity'));
  const validatedContactProvince = optional(validateProvince, getString(profile, 'contactProvince'));
  const validatedContactPostalCode = optional(validatePostalCode, getString(profile, 'contactPostalCode'));
  const validatedContactCountry = optional(validateCountry, getString(profile, 'contactCountry'));
  const validatedContactPhoneNumber = optional(validatePhoneNumber, getString(profile, 'contactPhoneNumber'));
  const validatedContactPhoneCountryCode = optional(validatePhoneCountryCode, getString(profile, 'contactPhoneCountryCode'));
  const validatedContactPhoneType = optional(validatePhoneType, getString(profile, 'contactPhoneType'));
  const validatedIndustrySectors = optional(validateIndustrySectors, getStringArray(profile, 'industrySectors'));
  const validatedAreasOfInterest = optional(v => validateCategories(v, 'Area of Interest'), getStringArray(profile, 'areasOfInterest'));
  if (allValid([validatedFirstName, validatedLastName, validatedPositionTitle, validatedPublicSectorEntity, validatedBranch, validatedContactStreetAddress, validatedContactCity, validatedContactProvince, validatedContactPostalCode, validatedContactCountry, validatedContactPhoneNumber, validatedContactPhoneCountryCode, validatedContactPhoneType, validatedIndustrySectors, validatedAreasOfInterest])) {
    return valid({
      type: UserType.Buyer as UserType.Buyer,
      firstName: validatedFirstName.value as string,
      lastName: validatedLastName.value as string,
      positionTitle: validatedPositionTitle.value as string,
      publicSectorEntity: validatedPublicSectorEntity.value as string,
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
      publicSectorEntity: getInvalidValue(validatedPublicSectorEntity, [] as string[]),
      branch: getInvalidValue(validatedBranch, [] as string[]),
      contactStreetAddress: getInvalidValue(validatedContactStreetAddress, [] as string[]),
      contactCity: getInvalidValue(validatedContactCity, [] as string[]),
      contactProvince: getInvalidValue(validatedContactProvince, [] as string[]),
      contactPostalCode: getInvalidValue(validatedContactPostalCode, [] as string[]),
      contactCountry: getInvalidValue(validatedContactCountry, [] as string[]),
      contactPhoneNumber: getInvalidValue(validatedContactPhoneNumber, [] as string[]),
      contactPhoneCountryCode: getInvalidValue(validatedContactPhoneCountryCode, [] as string[]),
      contactPhoneType: getInvalidValue(validatedContactPhoneType, [] as string[]),
      industrySectors: getInvalidValue(validatedIndustrySectors, [] as string[][]),
      areasOfInterest: getInvalidValue(validatedAreasOfInterest, [] as string[][])
    });
  }
}

export default validateBuyerProfile;
