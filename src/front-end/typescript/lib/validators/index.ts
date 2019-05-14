import { invalid, valid, validatePassword, Validation } from 'shared/lib/validators';

export function validateConfirmPassword(password: string, confirmPassword: string): Validation<string> {
  const validatedPassword = validatePassword(confirmPassword);
  switch (validatedPassword.tag) {
    case 'valid':
      if (password === confirmPassword) {
        return valid(confirmPassword);
      } else {
        return invalid(['Password confirmation doesn\'t match original password.']);
      }
    default:
      return validatedPassword;
  }
}

export const OBJECT_ID_REGEXP = /^[a-f0-9]{24}$/;

export function validateObjectIdString(id: string): Validation<string> {
  if (id.match(OBJECT_ID_REGEXP)) {
    return valid(id);
  } else {
    return invalid([`"${id}" is not a valid ObjectId.`]);
  }
}
