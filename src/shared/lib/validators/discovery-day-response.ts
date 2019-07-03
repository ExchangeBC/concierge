import { get } from 'lodash';
import { getString } from 'shared/lib';
import { Attendee, AttendeeValidationErrors } from 'shared/lib/resources/discovery-day-response';
import { allValid, getInvalidValue, invalid, valid, validateArrayCustom, validateBoolean, validateEmail, validateGenericString, Validation, ValidOrInvalid } from 'shared/lib/validators';

export function validateAttendeeName(raw: string): Validation<string> {
  return validateGenericString(raw, 'Name');
}

export function validateAttendee(attendee: any): ValidOrInvalid<Attendee, AttendeeValidationErrors> {
  const validatedName = validateAttendeeName(getString(attendee, 'name'));
  const validatedEmail = validateEmail(getString(attendee, 'email'));
  const validatedRemote = validateBoolean(get(attendee, 'remote'));
  if (allValid([validatedName, validatedEmail, validatedRemote])) {
    return valid({
      name: validatedName.value,
      email: validatedEmail.value,
      remote: validatedRemote.value
    } as Attendee);
  } else {
    return invalid({
      name: getInvalidValue(validatedName, undefined),
      email: getInvalidValue(validatedEmail, undefined),
      remote: getInvalidValue(validatedRemote, undefined)
    });
  }
}

export function validateAttendees(attendees: any[]): ValidOrInvalid<Attendee[], AttendeeValidationErrors[]> {
  return validateArrayCustom(attendees, validateAttendee, {});
}
