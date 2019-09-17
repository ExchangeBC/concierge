import { FILE_STORAGE_DIR } from 'back-end/config';
import { dateSchema, userIdSchema } from 'back-end/lib/schemas';
import { validateObjectIdString } from 'back-end/lib/validators';
import { createReadStream, existsSync } from 'fs';
import * as mongoose from 'mongoose';
import { extname, join } from 'path';
import shajs from 'sha.js';
import { PublicFile } from 'shared/lib/resources/file';
import { AuthLevel, UserType } from 'shared/lib/types';

export interface Data {
  _id: mongoose.Types.ObjectId;
  // createdBy didn't exist on the original file schema,
  // so only some file documents have this property.
  // All new files should have this property.
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  originalName: string;
  hash: string;
  authLevel: AuthLevel<UserType>;
  alias?: string;
}

export function makePublicFile(file: Data): PublicFile {
  return {
    _id: file._id.toString(),
    createdAt: file.createdAt,
    originalName: file.originalName,
    hash: file.hash,
    authLevel: undefined,
    alias: file.alias
  };
}

export type Model = mongoose.Model<Data & mongoose.Document>;

const requiredStringSchema = {
  type: String,
  required: true
};

export const schema: mongoose.Schema = new mongoose.Schema({
  createdAt: dateSchema(true),
  createdBy: userIdSchema(false),
  originalName: requiredStringSchema,
  hash: {
    ...requiredStringSchema,
    unique: true
  },
  authLevel: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  alias: {
    type: String,
    required: false
  }
});

export function hashFile(originalName: string, filePath: string, authLevel: AuthLevel<UserType>, createdBy: mongoose.Types.ObjectId, now?: Date): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!existsSync(filePath)) { return reject(new Error('file does not exist')); }
    const hash = shajs('sha1');
    hash.update(originalName);
    hash.update(JSON.stringify(authLevel));
    hash.update(createdBy.toString());
    if (now) {
      hash.update(now.valueOf().toString());
    }
    const stream = createReadStream(filePath);
    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('base64')));
    stream.on('error', err => reject(err));
  });
}

export function getStorageName(file: Data) {
  return join(FILE_STORAGE_DIR, `${file._id}${extname(file.originalName)}`);
}

export async function findFileByIdOrAlias(FileModel: Model, idOrAlias: string): Promise<InstanceType<Model> | null> {
  const validatedId = validateObjectIdString(idOrAlias);
  let file = null;
  if (validatedId.tag === 'valid') {
    file = await FileModel.findById(validatedId.value);
  } else {
    const result = await FileModel
      .find({ alias: idOrAlias })
      .sort({ createdAt: 'descending' })
      .limit(1)
      .exec();
    if (result.length) {
      file = result[0];
    }
  }
  return file;
}

/**
 * Helper to find a file by its ID and
 * marshall it into a `PublicFile`.
 * If the user does not exist, throw an error.
 */

export async function findPublicFileByIdUnsafely(FileModel: Model, fileId: mongoose.Types.ObjectId): Promise<PublicFile> {
  const file = await FileModel.findById(fileId);
  if (!file) {
    throw new Error('File does not exist');
  } else {
    return makePublicFile(file);
  }
}
