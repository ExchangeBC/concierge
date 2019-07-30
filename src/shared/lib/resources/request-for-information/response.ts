import { PublicFile } from 'shared/lib/resources/file';
import { PublicUser } from 'shared/lib/resources/user';

export interface PublicRfiResponse {
  _id: string;
  createdAt: Date;
  createdBy: PublicUser;
  attachments: PublicFile[];
}

export interface CreateRequestBody {
  rfiId: string;
  attachments: string[];
}

export interface CreateValidationErrors {
  permissions?: string[];
  contentType?: string[];
  rfiId?: string[];
  attachments?: string[][];
}
