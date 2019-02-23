import { businessTypeSchema, createdAtSchema, phoneTypeSchema, updatedAtSchema } from 'back-end/lib/schemas';
import * as mongoose from 'mongoose';
import { BusinessType, PhoneType } from 'shared/lib/types';

export const NAME = 'VendorProfile';

export interface Data {
  businessName?: string;
  businessType?: BusinessType;
  businessNumber?: string;
  businessStreetAddress?: string;
  businessCity?: string;
  businessProvince?: string;
  businessPostalCode?: string;
  businessCountry?: string;
  contactName?: string;
  contactPositionTitle?: string;
  contactEmail?: string;
  contactPhoneNumber?: string;
  contactPhoneCountryCode?: string;
  contactPhoneType?: PhoneType;
  industrySectors?: string[];
  areasOfExpertise?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type Model = mongoose.Model<Data & mongoose.Document>;

export const schema: mongoose.Schema = new mongoose.Schema({
  businessName: String,
  businessType: businessTypeSchema,
  businessNumber: String,
  businessStreetAddress: String,
  businessCity: String,
  businessProvince: String,
  businessPostalCode: String,
  businessCountry: String,
  contactName: String,
  contactPositionTitle: String,
  contactEmail: String,
  contactPhoneNumber: String,
  contactPhoneCountryCode: String,
  contactPhoneType: phoneTypeSchema,
  industrySectors: [String],
  areasOfExpertise: [String],
  createdAt: createdAtSchema,
  updatedAt: updatedAtSchema
});
