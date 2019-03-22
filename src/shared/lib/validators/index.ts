import { Set } from 'immutable';
import { isEmpty, uniq } from 'lodash';
import moment from 'moment';
import AVAILABLE_CATEGORIES from 'shared/data/categories';
import AVAILABLE_INDUSTRY_SECTORS from 'shared/data/industry-sectors';
import { formatDateAndTime } from 'shared/lib';
import { ADT, parsePhoneType, parseUserType, PhoneType, UserType } from 'shared/lib/types';

export type ValidOrInvalid<Valid, Invalid> = ADT<'valid', Valid> | ADT<'invalid', Invalid>;

export type Validation<Value> = ValidOrInvalid<Value, string[]>;

export type ArrayValidation<Value> = ValidOrInvalid<Value, string[][]>;

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
export function optional<Value, Valid, Invalid>(fn: (v: Value) => ValidOrInvalid<Valid, Invalid>, v: Value): ValidOrInvalid<Valid | undefined, Invalid> {
  return isEmpty(v) ? valid(undefined) : fn(v);
}

export function validateBoolean(value: any): Validation<boolean> {
  if (value === true || value === 'true') {
    return valid(true);
  } else if (value === false || value === 'false') {
    return valid(false);
  } else {
    return invalid(['Not a valid boolean or boolean string']);
  }
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

export function validateArray<A, B>(raw: A[], validate: (v: A) => Validation<B>): ArrayValidation<B[]> {
  const validations = raw.map(v => validate(v));
  if (allValid(validations)) {
    return valid(validations.map(({ value }) => value as B));
  } else {
    return invalid(validations.map(validation => getInvalidValue(validation, [])));
  }
}

export async function validateArrayAsync<A, B>(raw: A[], validate: (v: A) => Promise<Validation<B>>): Promise<ArrayValidation<B[]>> {
  const validations = await Promise.all(raw.map(v => validate(v)));
  if (allValid(validations)) {
    return valid(validations.map(({ value }) => value as B));
  } else {
    return invalid(validations.map(validation => getInvalidValue(validation, [])));
  }
}

export function validateStringInArray(value: string, availableValues: Set<string>, name: string, indefiniteArticle = 'a', caseSensitive = false): Validation<string> {
  if (!value) {
    return invalid([`Please select ${indefiniteArticle} ${name}`]);
  }
  if (!caseSensitive) {
    availableValues = availableValues.map(v => v.toUpperCase());
    value = value.toUpperCase();
  }
  if (!availableValues.includes(value)) {
    return invalid([`"${value}" is not a valid ${name}.`]);
  } else {
    return valid(value);
  }
}

export function validateStringArray(values: string[], availableValues: Set<string>, name: string, indefiniteArticle = 'a', caseSensitive = false, unique = true): ArrayValidation<string[]> {
  const result = validateArray(values, value => {
    return validateStringInArray(value, availableValues, name, indefiniteArticle, caseSensitive);
  });
  switch (result.tag) {
    case 'valid':
      return valid(uniq(result.value as string[]));
    case 'invalid':
      return result;
  }
}

export function validateDate(raw: string, minDate?: Date, maxDate?: Date): Validation<Date> {
  const parsed = moment(raw);
  const isValid: boolean = parsed.isValid();
  const epoch: number | null = isValid ? parsed.valueOf() : null;
  const date: Date | null = (epoch && new Date(epoch)) || null;
  const validMinDate = !minDate || (epoch && epoch >= minDate.getTime());
  const validMaxDate = !maxDate || (epoch && epoch >= maxDate.getTime())
  if (date && validMinDate && validMaxDate) {
    return valid(date);
  } else {
    const errors: string[] = [];
    if (!validMinDate && minDate && date) {
      errors.push(`Please select a date/time at or after ${formatDateAndTime(minDate)}`);
    }
    if (!validMaxDate && maxDate && date) {
      errors.push(`Please select a date/time at or earlier than ${formatDateAndTime(maxDate)}`);
    }
    if (!errors.length) {
      errors.push('Please enter a valid date.');
    }
    return invalid(errors);
  }
}

export function validateStringId(id: string, name = 'ID'): Validation<string> {
  return validateGenericString(id, name);
}

export function validateEmail(email: string): Validation<string> {
  email = email.toLowerCase();
  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/i)) {
    return invalid([ 'Please enter a valid email.' ]);
  } else {
    return valid(email);
  }
}

export function validatePassword(password: string): Validation<string> {
  const hasNumber = !!password.match(/[0-9]/);
  const hasLowercaseLetter = !!password.match(/[a-z]/);
  const hasUppercaseLetter = !!password.match(/[A-Z]/);
  const errors: string[] = [];
  if (password.length < 8) { errors.push('Passwords must be at least 8 characters long.'); }
  if (!hasLowercaseLetter) { errors.push('Passwords must contain at least one lowercase letter.'); }
  if (!hasUppercaseLetter) { errors.push('Passwords must contain at least one uppercase letter.'); }
  if (!hasNumber) { errors.push('Passwords must contain at least one number.'); }
  if (errors.length) {
    return invalid(errors);
  } else {
    return valid(password);
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
  return validateGenericString(province, 'Province/State');
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

export function validateCategories(categories: string[], name = 'Category', indefiniteArticle = 'a'): ArrayValidation<string[]> {
  return validateStringArray(categories, AVAILABLE_CATEGORIES, name, indefiniteArticle, true, true);
}

export function validatePositionTitle(positionTitle: string): Validation<string> {
  return validateGenericString(positionTitle, 'Position Title');
}

export function validateIndustrySectors(industrySectors: string[]): ArrayValidation<string[]> {
  return validateStringArray(industrySectors, AVAILABLE_INDUSTRY_SECTORS, 'Industry Sector', 'an', true, true);
}
