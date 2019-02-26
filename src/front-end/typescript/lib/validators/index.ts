import { invalid, valid, validatePassword, Validation } from 'shared/lib/validators';

export function validateConfirmPassword(password: string, confirmPassword: string): Validation<string> {
  const validatedPassword = validatePassword(confirmPassword);
  switch (validatedPassword.tag) {
    case 'valid':
      if (password === confirmPassword) {
        return valid(confirmPassword);
      } else {
        break;
      }
    default:
      break;
  }
  return invalid(['Password confirmation doesn\'t match original password.']);
}
