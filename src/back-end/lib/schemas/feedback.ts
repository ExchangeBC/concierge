import { UserType } from 'back-end/../shared/lib/types';
import { dateSchema } from 'back-end/lib/schemas';
import * as mongoose from 'mongoose';
import { PublicFeedback } from 'shared/lib/resources/feedback';
import { Rating } from 'shared/lib/types';

export interface Data {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  text: string;
  rating: Rating;
  userType?: UserType;
}

export function makePublicFeedback(feedback: Data): PublicFeedback {
  return {
    _id: feedback._id.toString(),
    createdAt: feedback.createdAt,
    text: feedback.text,
    rating: feedback.rating,
    userType: feedback.userType
  };
}

export type Model = mongoose.Model<Data & mongoose.Document>;

export const schema: mongoose.Schema = new mongoose.Schema({
  createdAt: dateSchema(true),
  text: { type: String, required: true },
  rating: { type: String, required: true, enum: ['good', 'neutral', 'bad'] },
  userType: String
});
