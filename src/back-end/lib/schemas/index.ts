import * as mongoose from 'mongoose';
import { BusinessType, PhoneType, UserType } from 'shared/lib/types';

// TODO Determine correct type for generic parameter.
export const businessTypeSchema: mongoose.SchemaTypeOpts<any> = {
  type: String,
  enum: [BusinessType.Corporation, BusinessType.Partnership, BusinessType.SoleProprietor]
};

// TODO Determine correct type for generic parameter.
export const phoneTypeSchema: mongoose.SchemaTypeOpts<any> = {
  type: String,
  enum: [PhoneType.Office, PhoneType.CellPhone]
};

// TODO Determine correct type for generic parameter.
export const userTypeSchema: mongoose.SchemaTypeOpts<any> = {
  type: String,
  required: true,
  enum: [UserType.Buyer, UserType.Vendor, UserType.ProgramStaff]
};

// TODO Determine correct type for generic parameter.
export function dateSchema(required = false): mongoose.SchemaTypeOpts<any> {
  return {
    type: Date,
    required
  };
}

// TODO Determine correct type for generic parameter.
export function userIdSchema(required = false): mongoose.SchemaTypeOpts<any> {
  return {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required
  };
}
