import { LogItemType, parseLogItemType } from 'shared/lib/resources/vendor-idea/log-item';
import { invalid, optional, valid, validateGenericString, Validation } from 'shared/lib/validators';

export function validateLogItemType(raw: string): Validation<LogItemType> {
  const parsed = parseLogItemType(raw);
  if (!parsed) {
    return invalid([`"${raw}" is not a valid log item type.`]);
  } else {
    return valid(parsed);
  }
}

export function validateLogItemNote(raw: string | undefined): Validation<string | undefined> {
  return optional(v => validateGenericString(v, 'Comments/Notes', 1, 5000), raw);
}
