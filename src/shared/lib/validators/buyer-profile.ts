import { getString, getStringArray } from 'shared/lib';
import { BuyerProfile, parseVerificationStatus, UserType, VerificationStatus } from 'shared/lib/types';
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
  numIndustrySectors?: string[];
  industrySectors?: string[][];
  numCategories?: string[];
  categories?: string[][];
}

export function validatePublicSectorEntity(value: string): Validation<string> {
  return validateGenericString(value, 'Public Sector Entities');
}

export function validateBranch(branch: string): Validation<string | undefined> {
  return optional(b => validateGenericString(b, 'Branch'), branch);
}

export function validateVerificationStatus(raw: string): Validation<VerificationStatus> {
  const parsed = parseVerificationStatus(raw);
  return parsed ? valid(parsed) : invalid([`Verification Status must be one of: ${VerificationStatus.Unverified}, ${VerificationStatus.UnderReview}, ${VerificationStatus.Verified}, ${VerificationStatus.Unverified}.`]);
}

export function validateBuyerProfile(profile: object): ValidOrInvalid<BuyerProfile, BuyerProfileValidationErrors> {
  const validatedFirstName = validateFirstName(getString(profile, 'firstName'));
  const validatedLastName = validateLastName(getString(profile, 'lastName'));
  const validatedPositionTitle = validatePositionTitle(getString(profile, 'positionTitle'));
  const validatedPublicSectorEntity = validatePublicSectorEntity(getString(profile, 'publicSectorEntity'));
  const validatedBranch = validateBranch(getString(profile, 'branch'));
  const validatedContactStreetAddress = optional(validateStreetAddress, getString(profile, 'contactStreetAddress'));
  const validatedContactCity = validateCity(getString(profile, 'contactCity'));
  const validatedContactProvince = optional(validateProvince, getString(profile, 'contactProvince'));
  const validatedContactPostalCode = optional(validatePostalCode, getString(profile, 'contactPostalCode'));
  const validatedContactCountry = optional(validateCountry, getString(profile, 'contactCountry'));
  const validatedContactPhoneNumber = optional(validatePhoneNumber, getString(profile, 'contactPhoneNumber'));
  const validatedContactPhoneCountryCode = optional(validatePhoneCountryCode, getString(profile, 'contactPhoneCountryCode'));
  const validatedContactPhoneType = optional(validatePhoneType, getString(profile, 'contactPhoneType'));
  const rawIndustrySectors = getStringArray(profile, 'industrySectors');
  const validatedNumIndustrySectors = !rawIndustrySectors.length ? invalid(['Please select at least one Industry Sector.']) : valid(null);
  const validatedIndustrySectors = validateIndustrySectors(rawIndustrySectors);
  const rawCategories = getStringArray(profile, 'categories');
  const validatedNumCategories = !rawCategories.length ? invalid(['Please select at least one Area of Interest.']) : valid(null);
  const validatedCategories = validateCategories(rawCategories, 'Area of Interest');
  const validatedVerificationStatus = validateVerificationStatus(getString(profile, 'verificationStatus'));
  if (allValid([validatedFirstName, validatedLastName, validatedPositionTitle, validatedPublicSectorEntity, validatedBranch, validatedContactStreetAddress, validatedContactCity, validatedContactProvince, validatedContactPostalCode, validatedContactCountry, validatedContactPhoneNumber, validatedContactPhoneCountryCode, validatedContactPhoneType, validatedNumIndustrySectors, validatedIndustrySectors, validatedNumCategories, validatedCategories, validatedVerificationStatus])) {
    return valid({
      type: UserType.Buyer as UserType.Buyer,
      firstName: validatedFirstName.value as string,
      lastName: validatedLastName.value as string,
      positionTitle: validatedPositionTitle.value as string,
      publicSectorEntity: validatedPublicSectorEntity.value as string,
      branch: getValidValue(validatedBranch, undefined),
      contactStreetAddress: getValidValue(validatedContactStreetAddress, undefined),
      contactCity: getValidValue(validatedContactCity, ''),
      contactProvince: getValidValue(validatedContactProvince, undefined),
      contactPostalCode: getValidValue(validatedContactPostalCode, undefined),
      contactCountry: getValidValue(validatedContactCountry, undefined),
      contactPhoneNumber: getValidValue(validatedContactPhoneNumber, undefined),
      contactPhoneCountryCode: getValidValue(validatedContactPhoneCountryCode, undefined),
      contactPhoneType: getValidValue(validatedContactPhoneType, undefined),
      industrySectors: getValidValue(validatedIndustrySectors, []),
      categories: getValidValue(validatedCategories, []),
      verificationStatus: getValidValue(validatedVerificationStatus, VerificationStatus.Unverified)
    });
  } else {
    return invalid({
      firstName: getInvalidValue(validatedFirstName, []),
      lastName: getInvalidValue(validatedLastName, []),
      positionTitle: getInvalidValue(validatedPositionTitle, []),
      publicSectorEntity: getInvalidValue(validatedPublicSectorEntity, []),
      branch: getInvalidValue(validatedBranch, []),
      contactStreetAddress: getInvalidValue(validatedContactStreetAddress, []),
      contactCity: getInvalidValue(validatedContactCity, []),
      contactProvince: getInvalidValue(validatedContactProvince, []),
      contactPostalCode: getInvalidValue(validatedContactPostalCode, []),
      contactCountry: getInvalidValue(validatedContactCountry, []),
      contactPhoneNumber: getInvalidValue(validatedContactPhoneNumber, []),
      contactPhoneCountryCode: getInvalidValue(validatedContactPhoneCountryCode, []),
      contactPhoneType: getInvalidValue(validatedContactPhoneType, []),
      numIndustrySectors: getInvalidValue(validatedNumIndustrySectors, undefined),
      industrySectors: getInvalidValue(validatedIndustrySectors, []),
      numCategories: getInvalidValue(validatedNumCategories, undefined),
      categories: getInvalidValue(validatedCategories, []),
      verificationStatus: getInvalidValue(validatedVerificationStatus, [])
    });
  }
}

export default validateBuyerProfile;
