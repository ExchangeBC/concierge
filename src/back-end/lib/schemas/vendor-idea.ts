import { dateSchema, userIdSchema } from 'back-end/lib/schemas';
import * as FileSchema from 'back-end/lib/schemas/file';
import * as UserSchema from 'back-end/lib/schemas/user';
import * as mongoose from 'mongoose';
import { PublicVendorIdea, PublicVendorIdeaForBuyers, PublicVendorIdeaForProgramStaff, PublicVendorIdeaForVendors, VersionContact, VersionDescription, VersionEligibility } from 'shared/lib/resources/vendor-idea';
import { getLatestStatus, LogItemType, PublicLogItem } from 'shared/lib/resources/vendor-idea/log-item';
import { UserType } from 'shared/lib/types';

export interface Version {
  createdAt: Date;
  createdBy: mongoose.Types.ObjectId;
  attachments: mongoose.Types.ObjectId[];
  eligibility: VersionEligibility;
  contact: VersionContact;
  description: VersionDescription;
}

export interface LogItem {
  createdAt: Date;
  createdBy: mongoose.Types.ObjectId;
  type: LogItemType;
  note?: string;
}

export interface Data {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  createdBy: mongoose.Types.ObjectId;
  versions: Version[];
  log: LogItem[];
}

export function getLatestVersion(vi: Data): Version | undefined {
  return vi.versions.reduce((acc: Version | undefined, version: Version) => {
    if (!acc || version.createdAt.getTime() > acc.createdAt.getTime()) {
      return version;
    } else {
      return acc;
    }
  }, undefined);
}

async function makePublicLogItem(UserModel: UserSchema.Model, logItem: LogItem): Promise<PublicLogItem> {
  return {
    createdAt: logItem.createdAt,
    createdBy: await UserSchema.findPublicUserByIdUnsafely(UserModel, logItem.createdBy),
    type: logItem.type,
    note: logItem.note
  };
}

async function makePublicVendorIdeaForBuyers(UserModel: UserSchema.Model, FileModel: FileSchema.Model, vi: Data): Promise<PublicVendorIdeaForBuyers> {
  const latestVersion = getLatestVersion(vi);
  if (!latestVersion) { throw new Error('Vendor Idea does not have at least one version'); }
  const latestStatus = getLatestStatus(vi.log);
  if (!latestStatus) { throw new Error('Vendor Idea does not have at least one status'); }
  return {
    userType: UserType.Buyer,
    _id: vi._id.toString(),
    createdAt: vi.createdAt,
    latestVersion: {
      createdAt: latestVersion.createdAt,
      attachments: await Promise.all(latestVersion.attachments.map(fileId => FileSchema.findPublicFileByIdUnsafely(FileModel, fileId))),
      description: latestVersion.description
    }
  };
}

async function makePublicVendorIdeaForProgramStaff(UserModel: UserSchema.Model, FileModel: FileSchema.Model, vi: Data): Promise<PublicVendorIdeaForProgramStaff> {
  const latestVersion = getLatestVersion(vi);
  if (!latestVersion) { throw new Error('Vendor Idea does not have at least one version'); }
  const latestStatus = getLatestStatus(vi.log);
  if (!latestStatus) { throw new Error('Vendor Idea does not have at least one status'); }
  return {
    userType: UserType.ProgramStaff,
    _id: vi._id.toString(),
    createdAt: vi.createdAt,
    latestVersion: {
      createdAt: latestVersion.createdAt,
      attachments: await Promise.all(latestVersion.attachments.map(fileId => FileSchema.findPublicFileByIdUnsafely(FileModel, fileId))),
      description: latestVersion.description,
      createdBy: await UserSchema.findPublicUserByIdUnsafely(UserModel, latestVersion.createdBy),
      eligibility: latestVersion.eligibility,
      contact: latestVersion.contact
    },
    latestStatus,
    createdBy: await UserSchema.findPublicUserByIdUnsafely(UserModel, vi.createdBy),
    log: await Promise.all(vi.log.map(item => makePublicLogItem(UserModel, item)))
  };
}

async function makePublicVendorIdeaForVendors(UserModel: UserSchema.Model, FileModel: FileSchema.Model, vi: Data): Promise<PublicVendorIdeaForVendors> {
  const latestVersion = getLatestVersion(vi);
  if (!latestVersion) { throw new Error('Vendor Idea does not have at least one version'); }
  const latestStatus = getLatestStatus(vi.log);
  if (!latestStatus) { throw new Error('Vendor Idea does not have at least one status'); }
  return {
    userType: UserType.Vendor,
    _id: vi._id.toString(),
    createdAt: vi.createdAt,
    latestVersion: {
      createdAt: latestVersion.createdAt,
      attachments: await Promise.all(latestVersion.attachments.map(fileId => FileSchema.findPublicFileByIdUnsafely(FileModel, fileId))),
      description: latestVersion.description,
      eligibility: latestVersion.eligibility,
      contact: latestVersion.contact
    },
    latestStatus
  };
}

export function makePublicVendorIdea(UserModel: UserSchema.Model, FileModel: FileSchema.Model, vi: Data, targetUserType: UserType): Promise<PublicVendorIdea> {
  switch (targetUserType) {
    case UserType.Buyer:
      return makePublicVendorIdeaForBuyers(UserModel, FileModel, vi);
    case UserType.ProgramStaff:
      return makePublicVendorIdeaForProgramStaff(UserModel, FileModel, vi);
    case UserType.Vendor:
      return makePublicVendorIdeaForVendors(UserModel, FileModel, vi);
  }
}

export async function findPublicVendorIdeaByIdUnsafely(ViModel: Model, UserModel: UserSchema.Model, FileModel: FileSchema.Model, viId: mongoose.Types.ObjectId, targetUserType: UserType): Promise<PublicVendorIdea> {
  const vi = await ViModel.findById(viId);
  if (!vi) {
    throw new Error('Vendor Idea does not exist');
  } else {
    return await makePublicVendorIdea(UserModel, FileModel, vi, targetUserType);
  }
}

export type Model = mongoose.Model<Data & mongoose.Document>;

const requiredMixedSchema = {
  type: [mongoose.Schema.Types.Mixed],
  required: true
};

export const schema: mongoose.Schema = new mongoose.Schema({
  createdAt: dateSchema(true),
  createdBy: userIdSchema(true),
  versions: requiredMixedSchema,
  log: requiredMixedSchema
});
