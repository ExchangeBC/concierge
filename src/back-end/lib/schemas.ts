import * as mongoose from 'mongoose';

export enum PhoneType {
  Office = 'OFFICE',
  CellPhone = 'CELL_PHONE'
}

export function parsePhoneType(raw: string): PhoneType | null {
  switch (raw.toUpperCase()) {
    case PhoneType.Office:
      return PhoneType.Office;
    case PhoneType.CellPhone:
      return PhoneType.CellPhone;
    default:
      return null;
  }
}

// TODO Determine correct type for generic parameter.
export const phoneTypeSchema: mongoose.SchemaTypeOpts<any> = {
  type: String,
  enum: [
    PhoneType.Office,
    PhoneType.CellPhone
  ]
};

export enum UserType {
  Buyer = 'BUYER',
  Vendor = 'VENDOR',
  ProgramStaff = 'PROGRAM_STAFF'
}

export function parseUserType(raw: string): UserType | null {
  switch (raw.toUpperCase()) {
    case UserType.Buyer:
      return UserType.Buyer;
    case UserType.Vendor:
      return UserType.Vendor;
    case UserType.ProgramStaff:
      return UserType.ProgramStaff;
    default:
      return null;
  }
}

// TODO Determine correct type for generic parameter.
export const userTypeSchema: mongoose.SchemaTypeOpts<any> = {
  type: String,
  required: true,
  enum: [
    UserType.Buyer,
    UserType.Vendor,
    UserType.ProgramStaff
  ]
};

// TODO Determine correct type for generic parameter.
export const createdAtSchema: mongoose.SchemaTypeOpts<any> = {
  type: Date,
  required: true
};

// TODO Determine correct type for generic parameter.
export const updatedAtSchema: mongoose.SchemaTypeOpts<any> = {
  type: Date,
  required: true
};
