import * as mongoose from 'mongoose';
import * as BuyerProfileSchema from './buyer-profile';
import * as ProgramStaffProfileSchema from './program-staff-profile';
import * as VendorProfileSchema from './vendor-profile';

export const NAME = 'User';

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

export interface Document extends mongoose.Document {
  email: string;
  passwordHash: string;
  acceptedTerms: boolean;
  // Is the user account active or not?
  // Deleting a user account marks it as inactive.
  active: boolean;
  userType: UserType;
  profile: mongoose.Types.ObjectId;
}

export type Model = mongoose.Model<Document>;

export const schema: mongoose.Schema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    validate: /^[^\s@]+@[^\s@]+.[^\s@]$/i
  },
  passwordHash: {
    type: String,
    required: true
  },
  acceptedTerms: {
    type: Boolean,
    required: true,
    default: false
  },
  active: {
    type: Boolean,
    required: true,
    default: true
  },
  userType: {
    type: String,
    required: true,
    enum: [
      UserType.Buyer,
      UserType.Vendor,
      UserType.ProgramStaff
    ]
  },
  // The user's profile depends on its userType.
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref() {
      switch (this.userType as UserType) {
        case UserType.Buyer:
          return BuyerProfileSchema.NAME;
        case UserType.Vendor:
          return VendorProfileSchema.NAME;
        case UserType.ProgramStaff:
          return ProgramStaffProfileSchema.NAME;
      }
    }
  }
} as mongoose.SchemaTypeOpts<any>);

export default schema;
