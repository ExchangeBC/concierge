import { ArrayValidation, validateArray, validateDate, validateGenericString, Validation } from 'shared/lib/validators';

/**
 * Function to validate whether a string is a valid
 * RFI closing date. It expects the date to be the at
 * or after right now.
 */

export function validateClosingAt(raw: string): Validation<Date> {
  return validateDate(raw, new Date());
}

export function validateRfiNumber(raw: string): Validation<string> {
  return validateGenericString(raw, 'RFI Number', 4, 15);
}

export function validateTitle(raw: string): Validation<string> {
  return validateGenericString(raw, 'Title');
}

export function validateDescription(raw: string): Validation<string> {
  return validateGenericString(raw, 'Description', 1, 20000);
}

export function validatePublicSectorEntity(raw: string): Validation<string> {
  return validateGenericString(raw, 'Public Sector Entity');
}

export function validateAddendumDescription(raw: string): Validation<string> {
  return validateGenericString(raw, 'Addendum', 1, 5000);
}

export function validateAddendumDescriptions(raw: string[]): ArrayValidation<string[]> {
  return validateArray(raw, validateAddendumDescription);
}
