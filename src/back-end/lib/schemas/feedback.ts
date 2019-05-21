import { UserType } from 'back-end/../shared/lib/types';
import { dateSchema } from 'back-end/lib/schemas';
import * as mongoose from 'mongoose';

export interface Data {
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    text: string;
    rating: string;
    userType?: UserType;
}

export type Model = mongoose.Model<Data & mongoose.Document>;

export const schema: mongoose.Schema = new mongoose.Schema({
    createdAt: dateSchema(true),
    text: String,
    rating: { type: String, enum: ['good', 'meh', 'bad'] },
    userType: { type: String, required: false }
});
