import { dateSchema } from 'back-end/lib/schemas';
import * as UserSchema from 'back-end/lib/schemas/user';
import { SessionId } from 'back-end/lib/server';
import * as mongoose from 'mongoose';
import mongooseDefault from 'mongoose';
import { PublicSession } from 'shared/lib/resources/session';
import { parseUserType, UserType } from 'shared/lib/types';

export interface SessionUser {
  id: mongoose.Types.ObjectId;
  type: UserType;
  email: string;
}

export interface Data {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  sessionId: mongoose.Types.ObjectId;
  user?: SessionUser;
}

export function makePublicSession(session: Data): PublicSession {
  return {
    ...session,
    _id: session._id.toString(),
    sessionId: session.sessionId.toString(),
    user: session.user && {
      ...session.user,
      id: session.user.id.toString()
    }
  };
}

export type Model = mongoose.Model<Data & mongoose.Document>;

export const schema: mongoose.Schema = new mongoose.Schema({
  createdAt: dateSchema(true),
  updatedAt: dateSchema(true),
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true
  },
  user: mongoose.Schema.Types.Mixed
});

export async function signIn(SessionModel: Model, UserModel: UserSchema.Model, session: Data, userId: mongoose.Types.ObjectId): Promise<Data> {
  try {
    const user = await UserModel.findById(userId).exec();
    if (!user) {
      return session;
    }
    const userType = parseUserType(user.profile.type);
    if (!userType) {
      return session;
    }
    const sessionDoc = await SessionModel.findById(session._id).exec();
    if (!sessionDoc) {
      return session;
    }
    sessionDoc.user = {
      id: user._id,
      type: userType,
      email: user.email
    };
    sessionDoc.updatedAt = new Date();
    await sessionDoc.save();
    return sessionDoc.toJSON();
  } catch (error) {
    return session;
  }
}

export async function signOut(Model: Model, session: Data): Promise<Data> {
  await Model.findByIdAndDelete(session._id).exec();
  return await newData(Model);
}

export async function newData(Model: Model, sessionId?: mongoose.Types.ObjectId): Promise<Data> {
  const now = new Date();
  const session = new Model({
    sessionId: sessionId || new mongooseDefault.Types.ObjectId(),
    createdAt: now,
    updatedAt: now
  });
  await session.save();
  return session.toJSON();
}

export function sessionIdToSession(Model: Model): (sessionId: SessionId) => Promise<Data> {
  return async (sessionId) => {
    // Find existing session.
    const session = await Model.findOne({ sessionId }).exec();
    if (session) {
      // Return the existing session if it exists.
      return session.toJSON();
    } else {
      // Otherwise, create a new one.
      return await newData(Model, sessionId);
    }
  };
}

export function sessionToSessionId(): (session: Data) => SessionId {
  return (session) => session.sessionId;
}
