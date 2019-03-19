import { FILE_STORAGE_DIR } from 'back-end/config';
import { createdAtSchema } from 'back-end/lib/schemas';
import { createReadStream, existsSync } from 'fs';
import * as mongoose from 'mongoose';
import { extname, join } from 'path';
import shajs from 'sha.js';

export interface Data {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  originalName: string;
  hash: string;
}

export type Model = mongoose.Model<Data & mongoose.Document>;

export const schema: mongoose.Schema = new mongoose.Schema({
  createdAt: createdAtSchema,
  originalName: String,
  hash: {
    type: String,
    unique: true
  }
});

export function hashFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!existsSync(filePath)) { return reject(new Error('file does not exist')); }
    const hash = shajs('sha1');
    const stream = createReadStream(filePath);
    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('base64')));
    stream.on('error', err => reject(err));
  });
}

export function getStorageName(file: Data) {
  return join(FILE_STORAGE_DIR, `${file._id}${extname(file.originalName)}`);
}
