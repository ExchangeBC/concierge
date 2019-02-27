import { createdAtSchema, updatedAtSchema } from 'back-end/lib/schemas';
import bcrypt from 'bcrypt';
import * as mongoose from 'mongoose';
import { PublicUser } from 'shared/lib/resources/user';
import { Profile } from 'shared/lib/types';

export const NAME = 'User';

export interface Data {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  email: string;
  passwordHash: string;
  acceptedTermsAt?: Date;
  // Is the user account active or not?
  // Deleting a user account marks it as inactive (`active = false`).
  active: boolean;
  profile: Profile;
}

export function makePublicUser(user: Data): PublicUser {
  return {
    _id: user._id.toString(),
    email: user.email,
    active: user.active,
    profile: user.profile,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    acceptedTermsAt: user.acceptedTermsAt
  };
}

export type Model = mongoose.Model<Data & mongoose.Document>;

export const schema: mongoose.Schema = new mongoose.Schema({
  createdAt: createdAtSchema,
  updatedAt: updatedAtSchema,
  email: {
    type: String,
    required: true,
    unique: true,
    validate: /^[^\s@]+@[^\s@]+.[^\s@]$/i
  },
  passwordHash: {
    type: String,
    required: true
  },
  acceptedTermsAt: Date,
  active: {
    type: Boolean,
    required: true,
    default: true
  },
  profile: mongoose.Schema.Types.Mixed
});

export async function authenticate(user: InstanceType<Model>, password: string): Promise<boolean> {
  return await bcrypt.compare(password, user.passwordHash);
};

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
};
