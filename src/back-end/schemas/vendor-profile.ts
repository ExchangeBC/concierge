import * as mongoose from 'mongoose';

export const NAME = 'VendorProfile';

export interface Document extends mongoose.Document {
  name: string;
}

export type Model = mongoose.Model<Document>;

export const schema: mongoose.Schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minLength: 1
  }
});
