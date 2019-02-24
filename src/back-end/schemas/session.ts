import { createdAtSchema } from 'back-end/lib/schemas';
import * as UserSchema from 'back-end/schemas/user';
import * as mongoose from 'mongoose';

export const NAME = 'Session';

export interface Data {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  user: mongoose.Types.ObjectId;
}

export type Model = mongoose.Model<Data & mongoose.Document>;

export const schema: mongoose.Schema = new mongoose.Schema({
  createdAt: createdAtSchema,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: UserSchema.NAME
  }
});
