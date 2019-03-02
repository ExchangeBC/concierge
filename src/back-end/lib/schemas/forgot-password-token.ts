import { TOKEN_SECRET } from 'back-end/config';
import { createdAtSchema } from 'back-end/lib/schemas';
import bcrypt from 'bcrypt';
import * as mongoose from 'mongoose';

export interface Data {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  token: string;
}

export type Model = mongoose.Model<Data & mongoose.Document>;

export const schema: mongoose.Schema = new mongoose.Schema({
  createdAt: createdAtSchema,
  token: String
});

function genSeed(userId: mongoose.Types.ObjectId): string {
  return `${TOKEN_SECRET}${userId.toString()}`;
}

export async function hashToken(userId: mongoose.Types.ObjectId): Promise<string> {
  return await bcrypt.hash(genSeed(userId), 10);
}

export async function deleteToken(Model: Model, token: string): Promise<void> {
  try {
    await Model
      .findOneAndDelete({ token })
      .exec();
  } catch (error) {
    throw error;
  }
}

export async function authenticateToken(token: string, userId: mongoose.Types.ObjectId): Promise<boolean> {
  return await bcrypt.compare(genSeed(userId), token);
}
