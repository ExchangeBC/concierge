import { createdAtSchema, PhoneType, phoneTypeSchema, updatedAtSchema } from 'back-end/lib/schemas';
import * as mongoose from 'mongoose';

export const NAME = 'BuyerProfile';

export interface Data {
  firstName: string;
  lastName: string;
  positionTitle: string;
  ministry: string;
  branch: string;
  contactAddress: string;
  contactCity: string;
  contactProvince: string;
  contactPostalCode: string;
  contactCountry: string;
  contactPhoneNumber: string;
  contactPhoneCountryCode: string;
  contactPhoneType: PhoneType;
  industrySectors: string[];
  areasOfInterest: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Document extends Data, mongoose.Document {
}

export type Model = mongoose.Model<Document>;

export const schema: mongoose.Schema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  positionTitle: String,
  ministry: String,
  branch: String,
  contactAddress: String,
  contactCity: String,
  contactProvince: String,
  contactPostalCode: String,
  contactCountry: String,
  contactPhoneNumber: String,
  contactPhoneCountryCode: String,
  contactPhoneType: phoneTypeSchema,
  industrySectors: [String],
  areasOfInterest: [String],
  createdAt: createdAtSchema,
  updatedAt: updatedAtSchema
});
