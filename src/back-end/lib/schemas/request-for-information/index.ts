import { Session } from 'back-end/lib/app/types';
import * as permissions from 'back-end/lib/permissions';
import { dateSchema } from 'back-end/lib/schemas';
import * as FileSchema from 'back-end/lib/schemas/file';
import * as UserSchema from 'back-end/lib/schemas/user';
import * as mongoose from 'mongoose';
import { Attendee, PublicDiscoveryDayResponse } from 'shared/lib/resources/discovery-day-response';
import { PublicDiscoveryDay, PublicRfi, PublicVersion } from 'shared/lib/resources/request-for-information';
import { Addendum, ProgramStaffProfile } from 'shared/lib/types';

export interface Version {
  createdAt: Date;
  createdBy: mongoose.Types.ObjectId;
  closingAt: Date;
  gracePeriodDays: number;
  rfiNumber: string;
  title: string;
  description: string;
  publicSectorEntity: string;
  categories: string[];
  discoveryDay?: PublicDiscoveryDay;
  addenda: Addendum[];
  attachments: mongoose.Types.ObjectId[];
  buyerContact: mongoose.Types.ObjectId;
  programStaffContact: mongoose.Types.ObjectId;
}

export interface DiscoveryDayResponse {
  createdAt: Date;
  vendor: mongoose.Types.ObjectId;
  attendees: Attendee[];
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

export async function makePublicDiscoveryDayResponse(UserModel: UserSchema.Model, ddr: DiscoveryDayResponse): Promise<PublicDiscoveryDayResponse> {
  return {
    createdAt: ddr.createdAt,
    vendor: await UserSchema.findPublicUserByIdUnsafely(UserModel, ddr.vendor),
    attendees: ddr.attendees
  };
}

export async function makePublicRfi(UserModel: UserSchema.Model, FileModel: FileSchema.Model, rfi: Data, session: Session): Promise<PublicRfi> {
  const isProgramStaff = permissions.isProgramStaff(session);
  const latestVersion = getLatestVersion(rfi);
  let latestPublicVersion: PublicVersion | undefined;
  if (!latestVersion) { throw new Error('RFI does not have at least one version'); }
  const attachments = await Promise.all(latestVersion.attachments.map(fileId => FileSchema.findPublicFileByIdUnsafely(FileModel, fileId)));
  const programStaffContact = await UserSchema.findPublicUserByIdUnsafely(UserModel, latestVersion.programStaffContact);
  const programStaffProfile = programStaffContact.profile as ProgramStaffProfile;
  latestPublicVersion = {
    createdAt: latestVersion.createdAt,
    closingAt: latestVersion.closingAt,
    gracePeriodDays: latestVersion.gracePeriodDays,
    rfiNumber: latestVersion.rfiNumber,
    title: latestVersion.title,
    description: latestVersion.description,
    publicSectorEntity: latestVersion.publicSectorEntity,
    categories: latestVersion.categories,
    discoveryDay: latestVersion.discoveryDay,
    addenda: latestVersion.addenda,
    attachments,
    // We expect the program staff and buyer contact information to be present
    // whether or not they are `active`.
    programStaffContact: {
      _id: isProgramStaff ? programStaffContact._id : undefined,
      firstName: programStaffProfile.firstName,
      lastName: programStaffProfile.lastName,
      positionTitle: programStaffProfile.positionTitle
    },
    buyerContact: isProgramStaff ? await UserSchema.findPublicUserByIdUnsafely(UserModel, latestVersion.buyerContact) : undefined
  };
  let discoveryDayResponses: PublicDiscoveryDayResponse[] | undefined;
  if (isProgramStaff) {
    discoveryDayResponses = [];
    for await (const ddr of rfi.discoveryDayResponses) {
      discoveryDayResponses.push(await makePublicDiscoveryDayResponse(UserModel, ddr));
    }
  }
  return {
    _id: rfi._id.toString(),
    createdAt: rfi.createdAt,
    publishedAt: rfi.publishedAt,
    latestVersion: latestPublicVersion,
    discoveryDayResponses
  };
}

export async function findPublicRfiByIdUnsafely(RfiModel: Model, UserModel: UserSchema.Model, FileModel: FileSchema.Model, rfiId: mongoose.Types.ObjectId, session: Session): Promise<PublicRfi> {
  const rfi = await RfiModel.findById(rfiId);
  if (!rfi) {
    throw new Error('RFI does not exist');
  } else {
    return await makePublicRfi(UserModel, FileModel, rfi, session);
  }
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

export function hasBeenPublished(rfi: InstanceType<Model>): boolean {
  return rfi.publishedAt.getTime() <= Date.now();
}
