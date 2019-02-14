import * as mongoose from 'mongoose';

export const NAME = 'User';

export interface Document extends mongoose.Document {
  name: string;
  age: number;
}

export type Model = mongoose.Model<Document>;

export const schema: mongoose.Schema = new mongoose.Schema({
  name: String,
  age: Number
});

export default schema;
