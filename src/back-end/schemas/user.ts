import { createdAtSchema, updatedAtSchema } from 'back-end/lib/schemas';
import * as mongoose from 'mongoose';
import { Profile } from 'shared/lib/types';

export const NAME = 'User';

export interface Data {
  email: string;
  passwordHash: string;
  acceptedTermsAt?: Date;
  // Is the user account active or not?
  // Deleting a user account marks it as inactive (`active = false`).
  active: boolean;
  profile: Profile;
  createdAt: Date;
  updatedAt: Date;
}

export type Model = mongoose.Model<Data & mongoose.Document>;

export const schema: mongoose.Schema = new mongoose.Schema({
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
  profile: mongoose.Schema.Types.Mixed,
  createdAt: createdAtSchema,
  updatedAt: updatedAtSchema
} as mongoose.SchemaTypeOpts<any>);
