import { Rating } from 'shared/lib/types';

export interface CreateRequestBody {
    text: string;
    rating: string;
}

export interface CreateValidationErrors {
    rating?: string[];
    text?: string[];
}

export interface PublicFeedback {
    _id: string;
    createdAt: Date;
    rating: Rating;
    text: string;
    userType?: string;
}
