import { validateGenericString, Validation } from 'shared/lib/validators';

export function validateFileName(name: string): Validation<string> {
  return validateGenericString(name, 'File name');
}
