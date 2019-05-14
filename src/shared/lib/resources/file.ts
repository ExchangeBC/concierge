import { megabytesToBytes } from 'shared/lib';

export const MAX_MULTIPART_FILES_SIZE = megabytesToBytes(10);

export interface PublicFile {
  _id: string;
  createdAt: Date;
  originalName: string;
  hash: string;
  authLevel: undefined;
}
