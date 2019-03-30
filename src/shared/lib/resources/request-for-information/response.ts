import { PublicFile } from 'shared/lib/resources/file';
import { PublicRfi } from 'shared/lib/resources/request-for-information';
import { PublicUser } from 'shared/lib/resources/user';

export interface PublicRfiResponse {
  _id: string;
  createdAt: Date;
  createdBy: PublicUser;
  rfi: PublicRfi;
  attachments: PublicFile[];
}

export interface CreateValidationErrors {
  permissions?: string[];
  contentType?: string[];
  rfiId?: string[];
  attachments?: string[][];
}
