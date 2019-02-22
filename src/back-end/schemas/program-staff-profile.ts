import * as mongoose from 'mongoose';

export const NAME = 'ProgramStaffProfile';

export interface Data {
  firstName: string;
  lastName: string;
}

export interface Document extends Data, mongoose.Document {
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
