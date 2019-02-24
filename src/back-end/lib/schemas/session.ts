import { createdAtSchema } from 'back-end/lib/schemas';
import * as UserSchema from 'back-end/lib/schemas/user';
import { SessionId } from 'back-end/lib/server';
import * as mongoose from 'mongoose';
import mongooseDefault from 'mongoose';
import { Omit } from 'shared/lib/types';

// tslint:disable no-console
// TODO
// isAuthenticated()
// isVendor()
// isBuyer()
// isProgramStaff()
// Populate user object on session somehow in a type-safe way.
//   Change PrivateSession to be JSON, use Model.findOneAndUpdate to perform mutations.

export const NAME = 'Session';

export interface Data {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  sessionId: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
}

export type PrivateSession = InstanceType<Model>;

export interface PublicSession extends Omit<Data, 'user'> {
  user?: UserSchema.PublicUser;
}

export async function makePublicSession(session: InstanceType<Model>, UserModel: UserSchema.Model): Promise<PublicSession> {
  if (session.user) {
    const user = await UserModel.findOne({ _id: session.user, active: true }).exec();
    if (user) {
      return {
        _id: session._id,
        createdAt: session.createdAt,
        sessionId: session.sessionId,
        user: UserSchema.makePublicUser(user)
      };
    } else {
      // Log the user out if the user is not available.
      session = await logout(session);
    }
  }
  return {
    _id: session._id,
    createdAt: session.createdAt,
    sessionId: session.sessionId
  };
}

export type Model = mongoose.Model<Data & mongoose.Document>;

export const schema: mongoose.Schema = new mongoose.Schema({
  createdAt: createdAtSchema,
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: UserSchema.NAME
  }
});

export async function login(session: PrivateSession, userId: mongoose.Types.ObjectId): Promise<PrivateSession> {
  session.user = userId;
  await session.save();
  return session;
};

export async function logout(session: PrivateSession): Promise<PrivateSession> {
  session.user = undefined;
  await session.save();
  return session;
};

export async function newPrivateSession(Model: Model, sessionId?: mongoose.Types.ObjectId): Promise<PrivateSession> {
  const session = new Model({
    sessionId: sessionId || new mongooseDefault.Types.ObjectId(),
    createdAt: Date.now()
  });
  await session.save();
  return session;
}

export function sessionIdToSession(Model: Model): (sessionId: SessionId) => Promise<PrivateSession> {
  return async sessionId => {
    try {
      // Find existing session.
      const session = await Model
        .findOne({ sessionId })
        .exec();
      if (session) { return session; }
      // Otherwise, create a new one.
      return await newPrivateSession(Model, sessionId);
    } catch (e) {
      throw e;
    }
  };
}

export function sessionToSessionId(Model: Model): (session: PrivateSession) => SessionId {
  return session => session.sessionId;
}
