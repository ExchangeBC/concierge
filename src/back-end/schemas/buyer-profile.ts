import * as mongoose from 'mongoose';

export const NAME = 'BuyerProfile';

export interface Document extends mongoose.Document {
  firstName: string;
  lastName: string;
}

export type Model = mongoose.Model<Document>;

export const schema: mongoose.Schema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    minLength: 1
  },
  lastName: {
    type: String,
    required: true,
    minLength: 1
  }
});
