export interface CreateRequestBody {
    text: string;
    rating: string;
}

export interface CreateValidationErrors {
    contentType?: string[];
    rating?: string[];
    text?: string[];
}
