import { Rating } from 'shared/lib/types';

export interface CreateRequestBody {
    text: string;
    rating: Rating;
}

export interface CreateValidationErrors {
    contentType?: string[];
    rating?: string[];
    text?: string[];
}
