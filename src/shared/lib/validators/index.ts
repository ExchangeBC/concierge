import * as immutable from 'immutable';
import { isEmpty } from 'lodash';
import moment from 'moment';
import AVAILABLE_HEAD_OFFICE_LOCATIONS from 'shared/data/head-office-locations';
import AVAILABLE_INDIGENOUS_OWNERSHIP from 'shared/data/indigenous-ownership';
import AVAILABLE_NUMBER_OF_EMPLOYEES from 'shared/data/number-of-employees';
import { compareDates, formatDate, formatDateAndTime, formatTime } from 'shared/lib';
import { ADT, parsePhoneType, parseUserType, PhoneType, UserType } from 'shared/lib/types';

export type ValidOrInvalid<Valid, Invalid> = ADT<'valid', Valid> | ADT<'invalid', Invalid>;

export type Validation<Value> = ValidOrInvalid<Value, string[]>;

export type ArrayValidation<Value, Errors = string[]> = ValidOrInvalid<Value[], Errors[]>;

export function valid<Valid>(value: Valid): ValidOrInvalid<Valid, any> {
  return {
    tag: 'valid',
    value
  } as ADT<'valid', Valid>;
}

export function invalid<Invalid>(value: Invalid): ValidOrInvalid<any, Invalid> {
  return {
    tag: 'invalid',
    value
  } as ADT<'invalid', Invalid>;
}

export function allValid(results: Array<ValidOrInvalid<any, any>>): results is Array<ADT<'valid', any>> {
  for (const result of results) {
    if (result.tag === 'invalid') {
      return false;
    }
  }
  return true;
}

export function allInvalid(results: Array<ValidOrInvalid<any, any>>): results is Array<ADT<'invalid', any>> {
  for (const result of results) {
    if (result.tag === 'valid') {
      return false;
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

export function mapValid<A, B, C>(value: ValidOrInvalid<A, C>, fn: (a: A) => B): ValidOrInvalid<B, C> {
  switch (value.tag) {
    case 'valid':
      return valid(fn(value.value));
    case 'invalid':
      return value;
  }
}

// Validate a field only if it is truthy.
export function optional<Value, Valid, Invalid>(fn: (v: Value) => ValidOrInvalid<Valid, Invalid>, v: Value | undefined): ValidOrInvalid<Valid | undefined, Invalid> {
  return isEmpty(v) ? valid(undefined) : fn(v as Value);
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

export function validateInteger(value: number, name: string, min: number, max: number): Validation<number> {
  if (value >= min && value <= max && value % 1 === 0) {
    return valid(value);
  } else {
    return invalid([`${name} must be an integer between ${min} and ${max}.`]);
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

export function validateArrayCustom<A, B, C>(raw: A[], validate: (v: A) => ValidOrInvalid<B, C>, defaultInvalidValue: C): ArrayValidation<B, C> {
  const validations = raw.map(v => validate(v));
  if (allValid(validations)) {
    return valid(validations.map(({ value }) => value));
  } else {
    return invalid(validations.map(validation => getInvalidValue(validation, defaultInvalidValue)));
  }
}

export function validateArray<A, B>(raw: A[], validate: (v: A) => Validation<B>): ArrayValidation<B> {
  return validateArrayCustom(raw, validate, []);
}

export async function validateArrayAsync<A, B>(raw: A[], validate: (v: A) => Promise<Validation<B>>): Promise<ArrayValidation<B>> {
  const validations = await Promise.all(raw.map(v => validate(v)));
  if (allValid(validations)) {
    return valid(validations.map(({ value }) => value as B));
  } else {
    return invalid(validations.map(validation => getInvalidValue(validation, [])));
  }
}

export function validateStringInArray(value: string, availableValues: immutable.Set<string>, name: string, indefiniteArticle = 'a', caseSensitive = false): Validation<string> {
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

function parseDate(raw: string): Date | null {
  const parsed = moment(raw);
  return parsed.isValid() ? parsed.toDate() : null;
}

export function validateGenericDate(raw: string, name: string, preposition: string, format: (d: Date) => string, minDate?: Date, maxDate?: Date): Validation<Date> {
  const date: Date | null = parseDate(raw);
  if (!date) {
    return invalid(['Please enter a valid date.']);
  }
  const validMinDate = !minDate || compareDates(date, minDate) !== -1;
  const validMaxDate = !maxDate || compareDates(date, maxDate) !== 1;
  if (validMinDate && validMaxDate) {
    return valid(date);
  } else {
    const errors: string[] = [];
    if (!validMinDate && minDate) {
      errors.push(`Please select a ${name} ${preposition} or after ${format(minDate)}`);
    }
    if (!validMaxDate && maxDate) {
      errors.push(`Please select a ${name} ${preposition} or earlier than ${format(maxDate)}`);
    }
    return invalid(errors);
  }
}

export function validateDatetime(raw: string, minDate?: Date, maxDate?: Date): Validation<Date> {
  return validateGenericDate(raw, 'date/time', 'at', formatDateAndTime, minDate, maxDate);
}

export function validateDate(raw: string, minDate?: Date, maxDate?: Date): Validation<Date> {
  return validateGenericDate(raw, 'date', 'on', formatDate, minDate, maxDate);
}

export function validateTime(raw: string, minDate?: Date, maxDate?: Date): Validation<Date> {
  return validateGenericDate(raw, 'time', 'at', formatTime, minDate, maxDate);
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

export function validateCategories(categories: string[], name = 'Category', indefiniteArticle = 'a'): ArrayValidation<string> {
  const result = validateArray(categories, raw => validateGenericString(raw, name));
  return mapValid(result, v => Array.from(new Set(v)));
}

export function validatePositionTitle(positionTitle: string): Validation<string> {
  return validateGenericString(positionTitle, 'Position Title');
}

export function validateIndustrySectors(industrySectors: string[]): ArrayValidation<string> {
  const result = validateArray(industrySectors, raw => validateGenericString(raw, 'Industry Sector'));
  return mapValid(result, v => Array.from(new Set(v)));
}

export function validateIndigenousOwnership(raw: string): Validation<string> {
  return validateStringInArray(raw, AVAILABLE_INDIGENOUS_OWNERSHIP, 'Indigenous Ownership category', 'an', true);
}

export function validateNumberOfEmployees(raw: string): Validation<string> {
  return validateStringInArray(raw, AVAILABLE_NUMBER_OF_EMPLOYEES, 'Number of Employees category', 'a', true);
}

export function validateHeadOfficeLocation(raw: string): Validation<string> {
  return validateStringInArray(raw, AVAILABLE_HEAD_OFFICE_LOCATIONS, 'Head Office Location', 'a', true);
}

export function validateSignUpReason(raw: string): Validation<string | undefined> {
  return optional(v => validateGenericString(v, 'Sign-Up Reason'), raw);
}
