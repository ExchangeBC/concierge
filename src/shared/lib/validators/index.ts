import bcrypt from 'bcrypt';
import { Set } from 'immutable';
import { isEqual } from 'lodash';
import AVAILABLE_CATEGORIES from 'shared/data/categories';
import AVAILABLE_INDUSTRY_SECTORS from 'shared/data/industry-sectors';
import { ADT, parsePhoneType, parseUserType, PhoneType, UserType } from 'shared/lib/types';

export type ValidOrInvalid<Valid, Invalid> = ADT<'valid', Valid> | ADT<'invalid', Invalid>;

export type Validation<Value> = ValidOrInvalid<Value, string[]>;

export function valid<Valid>(value: Valid): ValidOrInvalid<Valid, any> {
  return {
    tag: 'valid',
    value
  };
}

export function invalid<Invalid>(value: Invalid): ValidOrInvalid<any, Invalid> {
  return {
    tag: 'invalid',
    value
  };
}

export function allValid(results: Array<ValidOrInvalid<any, any>>): boolean {
  for (const result of results) {
    switch (result.tag) {
      case 'valid':
        continue;
      case 'invalid':
        return false;
    }
  }
  return true;
}

export function allInvalid(results: Array<ValidOrInvalid<any, any>>): boolean {
  for (const result of results) {
    switch (result.tag) {
      case 'valid':
        return false;
      case 'invalid':
        continue;
    }
  }
  return true;
}

export function getValidValue<Valid, Fallback>(result: ValidOrInvalid<Valid, any>, fallback: Fallback): Valid | Fallback {
  switch (result.tag) {
    case 'valid':
      return result.value;
    case 'invalid':
      return fallback;
  }
}

export function getInvalidValue<Invalid, Fallback>(result: ValidOrInvalid<any, Invalid>, fallback: Fallback): Invalid | Fallback {
  switch (result.tag) {
    case 'valid':
      return fallback;
    case 'invalid':
      return result.value;
  }
}

// Validate a field only if it is truthy.
export function optional<Value, Valid, Invalid>(fn: (v: Value) => ValidOrInvalid<Valid, Invalid>, v: Value, undefinedValue: Value): ValidOrInvalid<Valid | undefined, Invalid> {
  return isEqual(v, undefinedValue) ? valid(undefined) : fn(v);
}

export function validateGenericString(value: string, name: string, min = 1, max = 100, characters = 'characters'): Validation<string> {
  if (value.length < min || value.length > max) {
    return invalid([`${name} must be between ${min} and ${max} ${characters} long.`]);
  } else {
    return valid(value);
  }
}

export function validateNumberString(value: string, name: string, min?: number, max?: number): Validation<string> {
  value = value.replace(/[^0-9]/g, '');
  return validateGenericString(value, name, min, max, 'numbers');
}

export function validateStringArray(values: string[], availableValues: Set<string>, name: string): Validation<string[]> {
  availableValues = availableValues.map(v => v.toUpperCase());
  values.map(v => v.toUpperCase());
  const errors: string[] = values.reduce((acc, v) => {
    if (!availableValues.includes(v)) {
      acc.push(`"${v}" is not a valid ${name}.`);
    }
    return acc;
  }, [] as string[]);
  if (errors.length) {
    return invalid(errors);
  } else {
    return valid(values);
  }
}

/*function validateObjectId(objectId: string, name: string): Validation<string> {
  if (mongoose.Types.ObjectId.isValid(objectId)) {
    return valid(objectId);
  } else {
    return invalid([ `${name} is an invalid ObjectId.` ]);
  }
}*/

export function validateEmail(email: string): Validation<string> {
  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/i)) {
    return invalid([ 'Please enter a valid email.' ]);
  } else {
    return valid(email);
  }
}

export async function validatePassword(password: string, hashPassword = true): Promise<Validation<string>> {
  const hasNumber = !!password.match(/[0-9]/);
  const hasLowercaseLetter = !!password.match(/[a-z]/);
  const hasUppercaseLetter = !!password.match(/[A-Z]/);
  const errors: string[] = [];
  if (password.length < 8) { errors.push('Passwords must be at least 8 characters long.'); }
  if (!hasNumber || !hasLowercaseLetter || !hasUppercaseLetter) { errors.push('Passwords must contain at least one number, lowercase letter and uppercase letter.'); }
  if (errors.length) {
    return invalid(errors);
  } else {
    return valid(hashPassword ? await bcrypt.hash(password, 10) : password);
  }
}

export function validateUserType(userType: string): Validation<UserType> {
  const parsedUserType = parseUserType(userType);
  if (!parsedUserType) {
    return invalid([ 'Please select a valid User Type; either "buyer", "vendor" or "program_staff".' ]);
  } else {
    return valid(parsedUserType);
  }
}

export function validateName(value: string, name: string): Validation<string> {
  return validateGenericString(value, name);
}

export function validateFirstName(firstName: string): Validation<string> {
  return validateName(firstName, 'First Name');
}

export function validateLastName(lastName: string): Validation<string> {
  return validateName(lastName, 'Last Name');
}

export function validateBusinessName(businessName: string): Validation<string> {
  return validateName(businessName, 'Business Name');
}

export function validateContactName(contactName: string): Validation<string> {
  return validateName(contactName, 'Contact Name');
}

export function validateStreetAddress(streetAddress: string): Validation<string> {
  return validateGenericString(streetAddress, 'Street Address');
}

export function validateCity(city: string): Validation<string> {
  return validateGenericString(city, 'City');
}

export function validateProvince(province: string): Validation<string> {
  return validateGenericString(province, 'Province');
}

export function validatePostalCode(postalCode: string): Validation<string> {
  return validateGenericString(postalCode, 'Postal Code');
}

export function validateCountry(country: string): Validation<string> {
  return validateGenericString(country, 'Country');
}

export function validatePhoneNumber(phoneNumber: string): Validation<string> {
  return validateNumberString(phoneNumber, 'Phone Number', 4, 30);
}

export function validatePhoneCountryCode(phoneCountryCode: string): Validation<string> {
  return validateNumberString(phoneCountryCode, 'Phone Country Code', 1, 3);
}

export function validatePhoneType(phoneType: string): Validation<PhoneType> {
  const parsedPhoneType = parsePhoneType(phoneType);
  if (!parsedPhoneType) {
    return invalid([ 'Please select a valid Phone Type; either "office" or "cell_phone".' ]);
  } else {
    return valid(parsedPhoneType);
  }
}

export function validateCategories(categories: string[], name = 'Category'): Validation<string[]> {
  return validateStringArray(categories, AVAILABLE_CATEGORIES, name);
}

export function validatePositionTitle(positionTitle: string): Validation<string> {
  return validateGenericString(positionTitle, 'Position Title');
}

export function validateIndustrySectors(industrySectors: string[]): Validation<string[]> {
  return validateStringArray(industrySectors, AVAILABLE_INDUSTRY_SECTORS, 'Industry Sector');
}
