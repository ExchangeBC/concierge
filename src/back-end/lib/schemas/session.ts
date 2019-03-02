import { createdAtSchema, updatedAtSchema } from 'back-end/lib/schemas';
import * as UserSchema from 'back-end/lib/schemas/user';
import { SessionId } from 'back-end/lib/server';
import * as mongoose from 'mongoose';
import mongooseDefault from 'mongoose';
import { parseUserType, UserType } from 'shared/lib/types';

interface SessionUser {
  id: mongoose.Types.ObjectId;
  type: UserType;
  email: string;
}

export interface Data {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  sessionId: mongoose.Types.ObjectId;
  user?: SessionUser
}

export type Model = mongoose.Model<Data & mongoose.Document>;

export const schema: mongoose.Schema = new mongoose.Schema({
  createdAt: createdAtSchema,
  updatedAt: updatedAtSchema,
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true
  },
  user: mongoose.Schema.Types.Mixed
});

export type AppSession = Data;

export async function signIn(SessionModel: Model, UserModel: UserSchema.Model, session: AppSession, userId: mongoose.Types.ObjectId): Promise<AppSession> {
  try {
    const user = await UserModel
      .findById(userId)
      .exec();
    if (!user) { return session; }
    const userType = parseUserType(user.profile.type);
    if (!userType) { return session; }
    const sessionDoc = await SessionModel
      .findById(session._id)
      .exec();
    if (!sessionDoc) { return session; }
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
};

export async function signOut(Model: Model, session: AppSession): Promise<AppSession> {
  try {
    await Model
      .findByIdAndDelete(session._id)
      .exec();
    return await newAppSession(Model);
  } catch (error) {
    throw error;
  }
};

export async function newAppSession(Model: Model, sessionId?: mongoose.Types.ObjectId): Promise<AppSession> {
  try {
    const now = new Date();
    const session = new Model({
      sessionId: sessionId || new mongooseDefault.Types.ObjectId(),
      createdAt: now,
      updatedAt: now
    });
    await session.save();
    return session.toJSON();
  } catch (error) {
    throw error;
  }
}

export function sessionIdToSession(Model: Model): (sessionId: SessionId) => Promise<AppSession> {
  return async sessionId => {
    try {
      // Find existing session.
      const session = await Model
        .findOne({ sessionId })
        .exec();
      if (session) {
        // Return the existing session if it exists.
        return session.toJSON();
      } else {
        // Otherwise, create a new one.
        return await newAppSession(Model, sessionId);
      }
    } catch (e) {
      throw e;
    }
  };
}

export function sessionToSessionId(Model: Model): (session: AppSession) => SessionId {
  return session => session.sessionId;
}
