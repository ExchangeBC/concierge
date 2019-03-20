import { FILE_STORAGE_DIR } from 'back-end/config';
import { dateSchema } from 'back-end/lib/schemas';
import { createReadStream, existsSync } from 'fs';
import * as mongoose from 'mongoose';
import { extname, join } from 'path';
import shajs from 'sha.js';
import { AuthLevel, UserType } from 'shared/lib/types';

export interface Data {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  originalName: string;
  hash: string;
  authLevel: AuthLevel<UserType>;
}

export type Model = mongoose.Model<Data & mongoose.Document>;

const requiredStringSchema = {
  type: String,
  required: true
};

export const schema: mongoose.Schema = new mongoose.Schema({
  createdAt: dateSchema(true),
  originalName: requiredStringSchema,
  hash: {
    type: String,
    unique: true,
    required: true
  },
  authLevel: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
});

export function hashFile(originalName: string, filePath: string, authLevel: AuthLevel<UserType>): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!existsSync(filePath)) { return reject(new Error('file does not exist')); }
    const hash = shajs('sha1');
    hash.update(originalName);
    hash.update(JSON.stringify(authLevel));
    const stream = createReadStream(filePath);
    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('base64')));
    stream.on('error', err => reject(err));
  });
}

export function getStorageName(file: Data) {
  return join(FILE_STORAGE_DIR, `${file._id}${extname(file.originalName)}`);
}
