import { get, zip } from 'lodash';
import { diffDates, getString } from 'shared/lib';
import { Attendee, AttendeeValidationErrors } from 'shared/lib/resources/discovery-day-response';
import { allValid, getInvalidValue, invalid, valid, validateArrayCustom, validateBoolean, validateEmail, validateGenericString, Validation, ValidOrInvalid } from 'shared/lib/validators';

const ATTENDEE_IN_PERSON_WINDOW_HOURS = 24;

export function validateAttendeeName(raw: string): Validation<string> {
  return validateGenericString(raw, 'Name');
}

export function validateAttendeeRemote(raw: any, occurringAt: Date, existingRemote?: boolean): Validation<boolean> {
  const validated = validateBoolean(raw);
  switch (validated.tag) {
    case 'invalid':
      return validated;
    case 'valid':
      const withinWindow = diffDates(occurringAt, new Date(), 'hours') <= ATTENDEE_IN_PERSON_WINDOW_HOURS;
      // Check to ensure attendee is not changing from remote to in-person
      // within ATTENDEE_IN_PERSON_WINDOW_HOURS, or that a new in-person attendee is not being
      // added within ATTENDEE_IN_PERSON_WINDOW_HOURS
      if (withinWindow && validated.value === false && existingRemote !== false) {
        return invalid([`Cannot add an in-person attendee within ${ATTENDEE_IN_PERSON_WINDOW_HOURS} hours of the Discovery Day.`]);
      } else {
        return validated;
      }
  }
}

export function validateAttendee(attendee: any, occurringAt: Date, existingAttendee?: Attendee): ValidOrInvalid<Attendee, AttendeeValidationErrors> {
  const validatedName = validateAttendeeName(getString(attendee, 'name'));
  const validatedEmail = validateEmail(getString(attendee, 'email'));
  const validatedRemote = validateAttendeeRemote(get(attendee, 'remote'), occurringAt, get(existingAttendee, 'remote'));
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

export function validateAttendees(attendees: any[], occurringAt: Date, existingAttendees?: Attendee[]): ValidOrInvalid<Attendee[], AttendeeValidationErrors[]> {
  return validateArrayCustom(
    zip(attendees, existingAttendees || []),
    arg => {
      const [attendee, existingAttendee] = arg;
      return validateAttendee(attendee, occurringAt, existingAttendee);
    },
    {}
  );
}
