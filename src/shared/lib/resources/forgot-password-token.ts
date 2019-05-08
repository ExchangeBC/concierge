export interface CreateRequestBody {
  email: string;
}

export interface UpdateRequestBody {
  token: string;
  userId: string;
  password: string;
}

export interface UpdateValidationErrors {
  permissions?: string[];
  forgotPasswordToken?: string[];
  password?: string[];
  userId?: string[];
}
