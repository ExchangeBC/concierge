import { dateSchema, userIdSchema } from 'back-end/lib/schemas';
import * as security from 'back-end/lib/security';
import * as mongoose from 'mongoose';
import { PublicUser } from 'shared/lib/resources/user';
import { Profile, UserType } from 'shared/lib/types';

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
  // Only define createdBy if the user was created by a different user.
  createdBy?: mongoose.Types.ObjectId;
  deactivatedBy?: mongoose.Types.ObjectId;
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

/**
 * Helper to find a user by its ID and
 * marshall it into a `PublicUser`.
 * If the user does not exist, throw and error.
 *
 * TODO This function does not care about whether
 * the requested user is active or not.
 * This is probably something worth addressing in the future
 * if this function is used further.
 */

export async function findPublicUserByIdUnsafely(UserModel: Model, userId: mongoose.Types.ObjectId): Promise<PublicUser> {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error('User does not exist');
  } else {
    return makePublicUser(user);
  }
}

export async function findProgramStaff(UserModel: Model): Promise<Array<InstanceType<Model>>> {
  const result = await UserModel.find({ 'profile.type': UserType.ProgramStaff, active: true });
  return result || [];
}

export type Model = mongoose.Model<Data & mongoose.Document>;

export const schema: mongoose.Schema = new mongoose.Schema({
  createdAt: dateSchema(true),
  updatedAt: dateSchema(true),
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
  profile: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdBy: userIdSchema(),
  deactivatedBy: userIdSchema()
});

export async function authenticate(user: InstanceType<Model>, password: string): Promise<boolean> {
  return await security.authenticatePassword(password, user.passwordHash);
};

export async function hashPassword(password: string): Promise<string> {
  return await security.hashPassword(password);
};
