import { UserType } from 'shared/lib/types';

export interface CreateRequestBody {
  email: string;
  password: string;
}

export interface PublicSessionUser {
  id: string;
  type: UserType;
  email: string;
}

export interface PublicSession {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  sessionId: string;
  user?: PublicSessionUser;
}
