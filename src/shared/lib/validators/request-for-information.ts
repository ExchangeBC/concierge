import { ArrayValidation, valid, validateArray, validateDate, validateDatetime, validateGenericString, validateInteger, validateTime, Validation } from 'shared/lib/validators';

/**
 * Function to validate whether a string is a valid
 * RFI closing date. It expects the date to be the at
 * or after right now.
 */

export function validateClosingAt(raw: string): Validation<Date> {
  return validateDatetime(raw, new Date());
}

export function validateRfiNumber(raw: string): Validation<string> {
  return validateGenericString(raw, 'RFI Number', 4, 15);
}

export function validateTitle(raw: string): Validation<string> {
  return validateGenericString(raw, 'Project Title');
}

export function validateDescription(raw: string): Validation<string> {
  return validateGenericString(raw, 'RFI Description', 1, 30000);
}

export function validatePublicSectorEntity(raw: string): Validation<string> {
  return validateGenericString(raw, 'Public Sector Entity');
}

export function validateAddendumDescription(raw: string): Validation<string> {
  return validateGenericString(raw, 'Addendum', 1, 5000);
}

export function validateAddendumDescriptions(raw: string[]): ArrayValidation<string> {
  return validateArray(raw, validateAddendumDescription);
}

export function validateClosingDate(raw: string): Validation<string> {
  const minDate = new Date();
  const validation = validateDate(`${raw} 23:59`, minDate);
  switch (validation.tag) {
    case 'valid':
      return valid(raw);
    case 'invalid':
      return validation;
  }
}

export function validateClosingTime(rawTime: string, rawDate: string): Validation<string> {
  const validatedDate = validateClosingDate(rawDate);
  if (validatedDate.tag === 'invalid') {
    return valid(rawTime);
  }
  const minDate = new Date();
  minDate.setSeconds(0);
  minDate.setMilliseconds(0);
  const raw = `${rawDate} ${rawTime}`;
  const validation = validateTime(raw, minDate);
  switch (validation.tag) {
    case 'valid':
      return valid(rawTime);
    case 'invalid':
      return validation;
  }
}

export const MIN_GRACE_PERIOD_DAYS = 0;
export const MAX_GRACE_PERIOD_DAYS = 100;

export function validateGracePeriodDays(days?: number): Validation<number> {
  days = days === undefined ? -1 : days;
  return validateInteger(days, 'The number of grace period days', MIN_GRACE_PERIOD_DAYS, MAX_GRACE_PERIOD_DAYS);
}
