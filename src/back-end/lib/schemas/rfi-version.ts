import { dateSchema, userIdSchema } from 'back-end/lib/schemas';
import * as mongoose from 'mongoose';
import { Addendum } from 'shared/lib/types';

export interface Data {
  _id: mongoose.Types.ObjectId;
  createdAt: Date; // Since this is a version, this is semantically equivalent to updatedAt.
  publishedAt: Date; // This is semantically equivalent to the "whole" RFI's creation date.
  closingAt: Date;
  createdBy: mongoose.Types.ObjectId;
  rfiId: mongoose.Types.ObjectId;
  rfiNumber: string;
  title: string;
  description: string;
  publicSectorEntity: string;
  commodityCodes: string[];
  discoveryDay: boolean;
  addenda: Addendum[];
  attachments: mongoose.Types.ObjectId[];
  buyerContactUserId: mongoose.Types.ObjectId;
  programStaffContactUserId: mongoose.Types.ObjectId;
}

export type Model = mongoose.Model<Data & mongoose.Document>;

const requiredStringSchema = {
  type: String,
  required: true
};

export const schema: mongoose.Schema = new mongoose.Schema({
  createdAt: dateSchema(true),
  publishedAt: dateSchema(true),
  closingAt: dateSchema(true),
  createdBy: userIdSchema(true),
  rfiId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true
  },
  rfiNumber: requiredStringSchema,
  title: requiredStringSchema,
  description: requiredStringSchema,
  publicSectorEntity: requiredStringSchema,
  commodityCodes: {
    type: [String],
    required: true
  },
  discoveryDay: Boolean,
  addenda: {
    type: [mongoose.Schema.Types.Mixed],
    required: true
  },
  attachments: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'File',
    required: true
  },
  buyerContactUserId: userIdSchema(true),
  programStaffContactUserId: userIdSchema(true)
});
