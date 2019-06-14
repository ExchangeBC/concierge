import { getString, getStringArray } from 'shared/lib';
import { BusinessType, parseBusinessType, UserType, VendorProfile } from 'shared/lib/types';
import { allValid, getInvalidValue, getValidValue, invalid, optional, valid, validateBusinessName, validateCategories, validateCity, validateContactName, validateCountry, validateEmail, validateGenericString, validateHeadOfficeLocation, validateIndigenousOwnership, validateIndustrySectors, validateNumberOfEmployees, validatePhoneCountryCode, validatePhoneNumber, validatePhoneType, validatePositionTitle, validatePostalCode, validateProvince, validateSignUpReason, validateStreetAddress, Validation, ValidOrInvalid } from './';

export interface VendorProfileValidationErrors {
  businessName?: string[];
  businessType?: string[];
  businessNumber?: string[];
  businessStreetAddress?: string[];
  businessCity?: string[];
  businessProvince?: string[];
  businessPostalCode?: string[];
  businessCountry?: string[];
  contactName?: string[];
  contactPositionTitle?: string[];
  contactEmail?: string[];
  contactPhoneNumber?: string[];
  contactPhoneCountryCode?: string[];
  contactPhoneType?: string[];
  numIndustrySectors?: string[];
  industrySectors?: string[][];
  numCategories?: string[];
  categories?: string[][];
  numberOfEmployees?: string[];
  indigenousOwnership?: string[];
  headOfficeLocation?: string[];
  signUpReason?: string[];
}

export function validateBusinessType(userType: string): Validation<BusinessType> {
  const parsedBusinessType = parseBusinessType(userType);
  if (!parsedBusinessType) {
    return invalid([ 'Please select a valid Business Type; either "buyer", "vendor" or "program_staff".' ]);
  } else {
    return valid(parsedBusinessType);
  }
}

function validateBusinessNumber(businessNumber: string): Validation<string> {
  return validateGenericString(businessNumber, 'Business Number', 1, 20);
}

export function validateVendorProfile(profile: object): ValidOrInvalid<VendorProfile, VendorProfileValidationErrors> {
  const validatedBusinessName = validateBusinessName(getString(profile, 'businessName'));
  const validatedBusinessType = optional(validateBusinessType, getString(profile, 'businessType'));
  const validatedBusinessNumber = optional(validateBusinessNumber, getString(profile, 'businessNumber'));
  const validatedBusinessStreetAddress = optional(validateStreetAddress, getString(profile, 'businessStreetAddress'));
  const validatedBusinessCity = optional(validateCity, getString(profile, 'businessCity'));
  const validatedBusinessProvince = optional(validateProvince, getString(profile, 'businessProvince'));
  const validatedBusinessPostalCode = optional(validatePostalCode, getString(profile, 'businessPostalCode'));
  const validatedBusinessCountry = optional(validateCountry, getString(profile, 'businessCountry'));
  const validatedContactName = validateContactName(getString(profile, 'contactName'));
  const validatedContactPositionTitle = optional(validatePositionTitle, getString(profile, 'contactPositionTitle'));
  const validatedContactEmail = optional(validateEmail, getString(profile, 'contactEmail'));
  const validatedContactPhoneNumber = optional(validatePhoneNumber, getString(profile, 'contactPhoneNumber'));
  const validatedContactPhoneCountryCode = optional(validatePhoneCountryCode, getString(profile, 'contactPhoneCountryCode'));
  const validatedContactPhoneType = optional(validatePhoneType, getString(profile, 'contactPhoneType'));
  const rawIndustrySectors = getStringArray(profile, 'industrySectors');
  const validatedNumIndustrySectors = !rawIndustrySectors.length ? invalid(['Please select at least one Industry Sector.']) : valid(null);
  const validatedIndustrySectors = validateIndustrySectors(rawIndustrySectors);
  const rawCategories = getStringArray(profile, 'categories');
  const validatedNumCategories = !rawCategories.length ? invalid(['Please select at least one Area of Interest.']) : valid(null);
  const validatedCategories = validateCategories(rawCategories, 'Area of Interest');
  const validatedNumberOfEmployees = validateNumberOfEmployees(getString(profile, 'numberOfEmployees'));
  const validatedIndigenousOwnership = validateIndigenousOwnership(getString(profile, 'indigenousOwnership'));
  const validatedHeadOfficeLocation = validateHeadOfficeLocation(getString(profile, 'headOfficeLocation'));
  const validatedSignUpReason = validateSignUpReason(getString(profile, 'signUpReason'));
  if (allValid([validatedBusinessName, validatedBusinessType, validatedBusinessNumber, validatedBusinessStreetAddress, validatedBusinessCity, validatedBusinessProvince, validatedBusinessPostalCode, validatedBusinessCountry, validatedContactName, validatedContactPositionTitle, validatedContactEmail, validatedContactPhoneNumber, validatedContactPhoneCountryCode, validatedContactPhoneType, validatedNumIndustrySectors, validatedIndustrySectors, validatedNumCategories, validatedCategories, validatedIndigenousOwnership, validatedNumberOfEmployees, validatedHeadOfficeLocation, validatedSignUpReason])) {
    return valid({
      type: UserType.Vendor as UserType.Vendor,
      businessName: validatedBusinessName.value as string,
      businessType: getValidValue(validatedBusinessType, undefined),
      businessNumber: getValidValue(validatedBusinessNumber, undefined),
      businessStreetAddress: getValidValue(validatedBusinessStreetAddress, undefined),
      businessCity: getValidValue(validatedBusinessCity, undefined),
      businessProvince: getValidValue(validatedBusinessProvince, undefined),
      businessPostalCode: getValidValue(validatedBusinessPostalCode, undefined),
      businessCountry: getValidValue(validatedBusinessCountry, undefined),
      contactName: getValidValue(validatedContactName, ''),
      contactPositionTitle: getValidValue(validatedContactPositionTitle, undefined),
      contactEmail: getValidValue(validatedContactEmail, undefined),
      contactPhoneNumber: getValidValue(validatedContactPhoneNumber, undefined),
      contactPhoneCountryCode: getValidValue(validatedContactPhoneCountryCode, undefined),
      contactPhoneType: getValidValue(validatedContactPhoneType, undefined),
      industrySectors: getValidValue(validatedIndustrySectors, []),
      categories: getValidValue(validatedCategories, []),
      numberOfEmployees: getValidValue(validatedNumberOfEmployees, undefined),
      indigenousOwnership: getValidValue(validatedIndigenousOwnership, undefined),
      headOfficeLocation: getValidValue(validatedHeadOfficeLocation, undefined),
      signUpReason: getValidValue(validatedSignUpReason, undefined)
    });
  } else {
    return invalid({
      businessName: getInvalidValue(validatedBusinessName, undefined),
      businessType: getInvalidValue(validatedBusinessType, undefined),
      businessNumber: getInvalidValue(validatedBusinessNumber, undefined),
      businessStreetAddress: getInvalidValue(validatedBusinessStreetAddress, undefined),
      businessCity: getInvalidValue(validatedBusinessCity, undefined),
      businessProvince: getInvalidValue(validatedBusinessProvince, undefined),
      businessPostalCode: getInvalidValue(validatedBusinessPostalCode, undefined),
      businessCountry: getInvalidValue(validatedBusinessCountry, undefined),
      contactName: getInvalidValue(validatedContactName, undefined),
      contactPositionTitle: getInvalidValue(validatedContactPositionTitle, undefined),
      contactEmail: getInvalidValue(validatedContactEmail, undefined),
      contactPhoneNumber: getInvalidValue(validatedContactPhoneNumber, undefined),
      contactPhoneCountryCode: getInvalidValue(validatedContactPhoneCountryCode, undefined),
      contactPhoneType: getInvalidValue(validatedContactPhoneType, undefined),
      numIndustrySectors: getInvalidValue(validatedNumIndustrySectors, undefined),
      industrySectors: getInvalidValue(validatedIndustrySectors, undefined),
      numCategories: getInvalidValue(validatedNumCategories, undefined),
      categories: getInvalidValue(validatedCategories, undefined),
      numberOfEmployees: getInvalidValue(validatedNumberOfEmployees, undefined),
      indigenousOwnership: getInvalidValue(validatedIndigenousOwnership, undefined),
      headOfficeLocation: getInvalidValue(validatedHeadOfficeLocation, undefined),
      signUpReason: getInvalidValue(validatedSignUpReason, undefined)
    });
  }
}

export default validateVendorProfile;
