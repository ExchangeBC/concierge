import * as permissions from 'back-end/lib/permissions';
import { dateSchema } from 'back-end/lib/schemas';
import * as FileSchema from 'back-end/lib/schemas/file';
import { AppSession } from 'back-end/lib/schemas/session';
import * as UserSchema from 'back-end/lib/schemas/user';
import * as mongoose from 'mongoose';
import { PublicDiscoveryDayResponse } from 'shared/lib/resources/discovery-day-response';
import { PublicRfi, PublicVersion } from 'shared/lib/resources/request-for-information';
import { Addendum, ProgramStaffProfile } from 'shared/lib/types';

export interface Version {
  createdAt: Date;
  createdBy: mongoose.Types.ObjectId;
  closingAt: Date;
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

export interface DiscoveryDayResponse {
  createdAt: Date;
  vendor: mongoose.Types.ObjectId;
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

export function makePublicDiscoveryDayResponse(ddr: DiscoveryDayResponse): PublicDiscoveryDayResponse {
  return {
    createdAt: ddr.createdAt,
    vendor: ddr.vendor.toString()
  };
}

export async function makePublicRfi(UserModel: UserSchema.Model, FileModel: FileSchema.Model, rfi: Data, session: AppSession): Promise<PublicRfi> {
  const isProgramStaff = permissions.isProgramStaff(session);
  const latestVersion = getLatestVersion(rfi);
  let latestPublicVersion: PublicVersion | undefined;
  if (latestVersion) {
    const attachments = await Promise.all(latestVersion.attachments.map(fileId => FileSchema.findPublicFileByIdUnsafely(FileModel, fileId)));
    const programStaffContact = await UserSchema.findPublicUserByIdUnsafely(UserModel, latestVersion.programStaffContact);
    const programStaffProfile = programStaffContact.profile as ProgramStaffProfile;
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
      programStaffContact: {
        firstName: programStaffProfile.firstName,
        lastName: programStaffProfile.lastName,
        positionTitle: programStaffProfile.positionTitle
      },
      buyerContact: isProgramStaff ? await UserSchema.findPublicUserByIdUnsafely(UserModel, latestVersion.buyerContact) : undefined
    };
  }
  let discoveryDayResponses: PublicDiscoveryDayResponse[] | undefined;
  if (isProgramStaff) {
    discoveryDayResponses = rfi.discoveryDayResponses.map(v => makePublicDiscoveryDayResponse(v));
  }
  return {
    _id: rfi._id.toString(),
    createdAt: rfi.createdAt,
    publishedAt: rfi.publishedAt,
    latestVersion: latestPublicVersion,
    discoveryDayResponses
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
