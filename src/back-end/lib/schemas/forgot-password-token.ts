import { TOKEN_SECRET } from 'back-end/config';
import { dateSchema } from 'back-end/lib/schemas';
import * as security from 'back-end/lib/security';
import * as mongoose from 'mongoose';

export interface Data {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  token: string;
}

export type Model = mongoose.Model<Data & mongoose.Document>;

export const schema: mongoose.Schema = new mongoose.Schema({
  createdAt: dateSchema(true),
  token: String
});

function genSeed(userId: mongoose.Types.ObjectId): string {
  return `${TOKEN_SECRET}${userId.toString()}`;
}

export async function hashToken(userId: mongoose.Types.ObjectId): Promise<string> {
  const hash = await security.hashPassword(genSeed(userId));
  // We need to encode the hash to base64 as bcrypt hashes may contain '/'
  // characters, which means they can not easily be used in URLs.
  return Buffer.from(hash, 'utf8').toString('base64');
}

export async function deleteToken(Model: Model, token: string): Promise<void> {
  await Model.findOneAndDelete({ token }).exec();
}

export async function authenticateToken(token: string, userId: mongoose.Types.ObjectId): Promise<boolean> {
  // Important! Decode the token from base64 to UTF-8.
  token = Buffer.from(token, 'base64').toString('utf8');
  return await security.authenticatePassword(genSeed(userId), token);
}
