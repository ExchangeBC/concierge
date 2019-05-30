import { validateGenericString, Validation } from 'shared/lib/validators';

export function validateFeedbackText(text: string): Validation<string> {
    return validateGenericString(text, 'Feedback', 1, 2000);
}
