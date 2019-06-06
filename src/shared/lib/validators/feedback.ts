import { Rating } from 'shared/lib/types';
import { invalid, valid, validateGenericString, Validation } from 'shared/lib/validators';

export function validateFeedbackText(text: string): Validation<string> {
    return validateGenericString(text, 'Feedback', 1, 2000);
}

export function validateRating(rating: string | undefined): Validation<Rating> {
    if (rating === undefined) {
      return invalid(['Select a rating']);
    }
    switch (rating) {
      case 'good':
      case 'neutral':
      case 'bad':
        return valid(rating as Rating)
      default:
        return invalid(['Select a valid rating'])
    }
  }
