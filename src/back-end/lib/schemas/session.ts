import { createdAtSchema } from 'back-end/lib/schemas';
import * as UserSchema from 'back-end/lib/schemas/user';
import { SessionId } from 'back-end/lib/server';
import * as mongoose from 'mongoose';
import { Omit } from 'shared/lib/types';

// tslint:disable no-console

export const NAME = 'Session';

export interface Data {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  sessionId: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
}

export interface PublicSession extends Omit<Data, 'user'> {
  user: UserSchema.PublicUser;
}

export async function makePublicSession(session: InstanceType<Model>, UserModel: UserSchema.Model): Promise<PublicSession> {
  const user = await UserModel.findOne({ _id: session.user, active: true }).exec();
  if (!user) { throw new Error('Session user cannot be found.'); }
  return {
    _id: session._id,
    createdAt: session.createdAt,
    sessionId: session.sessionId,
    user: UserSchema.makePublicUser(user)
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

export function sessionIdToSession(Model: Model): (sessionId: SessionId) => Promise<Data> {
  return async sessionId => {
    try {
      // Find existing session.
      const session = await Model
        .findOne({ sessionId })
        .exec();
      if (session) { return session; }
      // Otherwise, create a new one.
      const newSession = new Model({
        sessionId,
        createdAt: new Date()
      });
      await newSession.save();
      return newSession;
    } catch (e) {
      throw e;
    }
  };
}

export function sessionToSessionId(Model: Model): (session: Data) => SessionId {
  return session => session.sessionId;
}
