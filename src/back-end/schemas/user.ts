import { createdAtSchema, updatedAtSchema, UserType, userTypeSchema } from 'back-end/lib/schemas';
import * as BuyerProfileSchema from 'back-end/schemas/buyer-profile';
import * as ProgramStaffProfileSchema from 'back-end/schemas/program-staff-profile';
import * as VendorProfileSchema from 'back-end/schemas/vendor-profile';
import * as mongoose from 'mongoose';

export const NAME = 'User';

export interface Data {
  email: string;
  passwordHash: string;
  acceptedTermsAt?: Date;
  // Is the user account active or not?
  // Deleting a user account marks it as inactive (`active = false`).
  active: boolean;
  userType: UserType;
  profile: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document extends Data, mongoose.Document {
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
  acceptedTermsAt: Date,
  active: {
    type: Boolean,
    required: true,
    default: true
  },
  userType: userTypeSchema,
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
  },
  createdAt: createdAtSchema,
  updatedAt: updatedAtSchema
} as mongoose.SchemaTypeOpts<any>);

export default schema;
