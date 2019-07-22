import { get } from 'lodash';
import { diffDates, getString } from 'shared/lib';
import { Attendee, AttendeeValidationErrors } from 'shared/lib/resources/discovery-day-response';
import { allValid, getInvalidValue, invalid, valid, validateArrayCustom, validateBoolean, validateEmail, validateGenericString, Validation, ValidOrInvalid } from 'shared/lib/validators';

const ATTENDEE_IN_PERSON_WINDOW_HOURS = 24;

export function validateAttendeeName(raw: string): Validation<string> {
  return validateGenericString(raw, 'Name');
}

export function validateAttendeeRemote(raw: any, occurringAt: Date, numInPersonSlots: number): Validation<boolean> {
  const validated = validateBoolean(raw);
  switch (validated.tag) {
    case 'invalid':
      return validated;
    case 'valid':
      const withinWindow = diffDates(occurringAt, new Date(), 'hours') <= ATTENDEE_IN_PERSON_WINDOW_HOURS;
      // Check to ensure attendee is not changing from remote to in-person
      // within ATTENDEE_IN_PERSON_WINDOW_HOURS, or that a new in-person attendee is not being
      // added within ATTENDEE_IN_PERSON_WINDOW_HOURS
      if (withinWindow && validated.value === false && numInPersonSlots <= 0) {
        return invalid([`In-person attendees can not be added to a Discovery Day within ${ATTENDEE_IN_PERSON_WINDOW_HOURS} hours of its scheduled time.`]);
      } else {
        return validated;
      }
  }
}

export function validateAttendee(attendee: any, occurringAt: Date, numInPersonSlots: number): ValidOrInvalid<Attendee, AttendeeValidationErrors> {
  const validatedName = validateAttendeeName(getString(attendee, 'name'));
  const validatedEmail = validateEmail(getString(attendee, 'email'));
  const validatedRemote = validateAttendeeRemote(get(attendee, 'remote'), occurringAt, numInPersonSlots);
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

export function countInPerson(attendees: Attendee[]): number {
  return attendees.reduce((acc, { remote }) => remote ? acc : acc + 1, 0);
}

export function validateAttendees(attendees: any[], occurringAt: Date, existingAttendees?: Attendee[]): ValidOrInvalid<Attendee[], AttendeeValidationErrors[]> {
  // numInPersonSlots is the number of in person slots available to this list of attendees,
  // to ensure no extra in-person attendees are added to a discovery day response
  // less than ${ATTENDEE_IN_PERSON_WINDOW_HOURS} hours to the scheduled time.
  let numInPersonSlots = countInPerson(existingAttendees || []);
  return validateArrayCustom(
    attendees,
    attendee => {
      const result = validateAttendee(attendee, occurringAt, numInPersonSlots);
      if (!get(attendee, 'remote')) {
        numInPersonSlots--;
      }
      return result;
    },
    {}
  );
}
