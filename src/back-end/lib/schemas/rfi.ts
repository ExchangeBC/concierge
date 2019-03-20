import { dateSchema } from 'back-end/lib/schemas';
import * as FileSchema from 'back-end/lib/schemas/file';
import * as UserSchema from 'back-end/lib/schemas/user';
import * as mongoose from 'mongoose';
import { PublicRfi, PublicVersion } from 'shared/lib/resources/rfi';
import { Addendum, UserType } from 'shared/lib/types';

export interface Version {
  createdAt: Date;
  closingAt: Date;
  createdBy: mongoose.Types.ObjectId;
  rfiNumber: string;
  title: string;
  description: string;
  publicSectorEntity: string;
  categories: string[];
  discoveryDay: boolean;
  addenda: Addendum[];
  attachments: mongoose.Types.ObjectId[];
  buyerContact: mongoose.Types.ObjectId;
  programStaffContact: mongoose.Types.ObjectId;
}

// TODO stub implementation.
export interface DiscoveryDayResponse {
  empty: true;
}

export interface Data {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  publishedAt: Date;
  versions: Version[];
  discoveryDayResponses: DiscoveryDayResponse[];
}

export function getLatestVersion(rfi: Data): Version | undefined {
  return rfi.versions.reduce((acc: Version | undefined, version: Version) => {
    if (!acc || version.createdAt.getTime() > acc.createdAt.getTime()) {
      return version;
    } else {
      return acc;
    }
  }, undefined);
}

export async function makePublicRfi(UserModel: UserSchema.Model, FileModel: FileSchema.Model, rfi: Data, userType?: UserType): Promise<PublicRfi> {
  const latestVersion = getLatestVersion(rfi);
  let latestPublicVersion: PublicVersion | undefined;
  if (latestVersion) {
    const attachments = await Promise.all(latestVersion.attachments.map(fileId => FileSchema.findPublicFileByIdUnsafely(FileModel, fileId)));
    latestPublicVersion = {
      createdAt: latestVersion.createdAt,
      closingAt: latestVersion.closingAt,
      rfiNumber: latestVersion.rfiNumber,
      title: latestVersion.title,
      description: latestVersion.description,
      publicSectorEntity: latestVersion.publicSectorEntity,
      categories: latestVersion.categories,
      discoveryDay: latestVersion.discoveryDay,
      addenda: latestVersion.addenda,
      attachments,
      programStaffContact: await UserSchema.findPublicUserByIdUnsafely(UserModel, latestVersion.programStaffContact),
      buyerContact: userType === UserType.ProgramStaff ? await UserSchema.findPublicUserByIdUnsafely(UserModel, latestVersion.buyerContact) : undefined
    };
  }
  return {
    _id: rfi._id.toString(),
    createdAt: rfi.createdAt,
    publishedAt: rfi.publishedAt,
    latestVersion: latestPublicVersion,
    // TODO might need to change this line to convert discovery days to the public variant.
    discoveryDayResponses: userType === UserType.ProgramStaff ? rfi.discoveryDayResponses : undefined
  };
}

export type Model = mongoose.Model<Data & mongoose.Document>;

const requiredMixedSchema = {
  type: [mongoose.Schema.Types.Mixed],
  required: true
};

export const schema: mongoose.Schema = new mongoose.Schema({
  createdAt: dateSchema(true),
  publishedAt: dateSchema(true),
  versions: requiredMixedSchema,
  discoveryDayResponses: requiredMixedSchema
});
