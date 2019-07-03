import { CreateDiscoveryDayBody, DiscoveryDayValidationErrors, PublicDiscoveryDay } from 'shared/lib/resources/request-for-information';
import { allValid, ArrayValidation, getInvalidValue, invalid, optional, valid, validateArray, validateDate, validateDatetime, validateGenericString, validateInteger, validateTime, Validation, ValidOrInvalid } from 'shared/lib/validators';

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

export function validateDiscoveryDayDescription(raw?: string): Validation<string | undefined> {
  return optional(v => validateGenericString(v, 'Description', 1, 5000), raw || '');
}

export function validateDiscoveryDayDate(raw: string): Validation<string> {
  const minDate = new Date();
  const validation = validateDate(`${raw} 23:59`, minDate);
  switch (validation.tag) {
    case 'valid':
      return valid(raw);
    case 'invalid':
      return validation;
  }
}

export function validateDiscoveryDayTime(rawTime: string, rawDate: string): Validation<string> {
  const validatedDate = validateDiscoveryDayDate(rawDate);
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

export function validateDiscoveryDayLocation(raw: string): Validation<string> {
  return validateGenericString(raw, 'Location');
}

export function validateDiscoveryDayVenue(raw: string): Validation<string> {
  return validateGenericString(raw, 'Venue');
}

export function validateDiscoveryDayRemoteAccess(raw: string): Validation<string> {
  return validateGenericString(raw, 'Remote Access Info', 1, 5000);
}

export function validateDiscoveryDay(raw: CreateDiscoveryDayBody): ValidOrInvalid<PublicDiscoveryDay, DiscoveryDayValidationErrors> {
  const validatedDescription = validateDiscoveryDayDescription(raw.description);
  const validatedDate = validateDiscoveryDayDate(raw.date);
  const validatedTime = validateDiscoveryDayTime(raw.date, raw.time);
  const validatedLocation = validateDiscoveryDayLocation(raw.location);
  const validatedVenue = validateDiscoveryDayVenue(raw.venue);
  const validatedRemoteAccess = validateDiscoveryDayRemoteAccess(raw.remoteAccess);
  if (allValid([validatedDescription, validatedDate, validatedTime, validatedLocation, validatedVenue, validatedRemoteAccess])) {
    return valid({
      description: validatedDescription.value,
      occurringAt: new Date(`${validatedDate.value} ${validatedTime.value}`),
      location: validatedLocation.value,
      venue: validatedVenue.value,
      remoteAccess: validatedRemoteAccess.value
    } as PublicDiscoveryDay);
  } else {
    return invalid({
      description: getInvalidValue(validatedDescription, undefined),
      date: getInvalidValue(validatedDate, undefined),
      time: getInvalidValue(validatedTime, undefined),
      location: getInvalidValue(validatedLocation, undefined),
      venue: getInvalidValue(validatedVenue, undefined),
      remoteAccess: getInvalidValue(validatedRemoteAccess, undefined)
    });
  }
}
