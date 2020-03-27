import * as RfiSchema from 'back-end/lib/schemas/request-for-information';
import mongoose from 'mongoose';
import { Attendee } from 'shared/lib/resources/discovery-day-response';
import { PublicFeedback } from 'shared/lib/resources/feedback';
import { PublicFile } from 'shared/lib/resources/file';
import { PublicDiscoveryDay } from 'shared/lib/resources/request-for-information';
import { PublicRfiResponse } from 'shared/lib/resources/request-for-information/response';
import { PublicUser } from 'shared/lib/resources/user';
import { Addendum, BuyerProfile, ProgramStaffProfile, UserType, VendorProfile, VerificationStatus } from 'shared/lib/types';

export const id = 'ID';
export const date = new Date();
export const email = 'user@example.com';
export const industrySector = 'Industry Sector';
export const category = 'Area of Interest';

export const vendorProfile: VendorProfile = {
  type: UserType.Vendor,
  businessName: 'Business Name',
  contactName: 'Contact Name',
  industrySectors: [industrySector],
  categories: [category]
};

export const buyerProfile: BuyerProfile = {
  type: UserType.Buyer,
  firstName: 'First Name',
  lastName: 'Last Name',
  positionTitle: 'Position Title',
  publicSectorEntity: 'Public Sector Entity',
  contactCity: 'Contact City',
  industrySectors: [industrySector],
  categories: [category],
  verificationStatus: VerificationStatus.Verified
};

export const programStaffProfile: ProgramStaffProfile = {
  type: UserType.ProgramStaff,
  firstName: 'First Name',
  lastName: 'Last Name',
  positionTitle: 'Position Title'
};

export const publicVendor: PublicUser = {
  _id: id,
  createdAt: date,
  updatedAt: date,
  email,
  acceptedTermsAt: date,
  active: true,
  profile: vendorProfile
};

export const publicBuyer: PublicUser = {
  _id: id,
  createdAt: date,
  updatedAt: date,
  email,
  acceptedTermsAt: date,
  active: true,
  profile: buyerProfile
};

export const publicProgramStaff: PublicUser = {
  _id: id,
  createdAt: date,
  updatedAt: date,
  email,
  acceptedTermsAt: date,
  active: true,
  profile: programStaffProfile
};

export const publicFile: PublicFile = {
  _id: id,
  createdAt: date,
  originalName: 'File Name.ext',
  hash: '',
  authLevel: undefined
};

export const publicRfiResponse: PublicRfiResponse = {
  _id: 'ID',
  createdAt: date,
  createdBy: publicVendor,
  attachments: [publicFile]
};

export const publicDiscoveryDay: PublicDiscoveryDay = {
  description: 'Description',
  occurringAt: date,
  location: 'Location',
  venue: 'Venue',
  remoteAccess: 'Remote Access'
};

export const addendum: Addendum = {
  createdAt: date,
  updatedAt: date,
  description: 'Description'
};

export const rfiVersion: RfiSchema.Version = {
  createdAt: date,
  createdBy: mongoose.Types.ObjectId(),
  closingAt: date,
  gracePeriodDays: 0,
  rfiNumber: 'RFI Number',
  title: 'Title',
  description: 'Description',
  publicSectorEntity: 'Public Sector Entity',
  categories: [category],
  discoveryDay: publicDiscoveryDay,
  addenda: [addendum],
  attachments: [mongoose.Types.ObjectId()],
  buyerContact: mongoose.Types.ObjectId(),
  programStaffContact: mongoose.Types.ObjectId()
};

export const attendee = (remote: boolean): Attendee => ({
  name: 'Name',
  email,
  remote
});

export const discoveryDayResponse: RfiSchema.DiscoveryDayResponse = {
  createdAt: date,
  updatedAt: date,
  vendor: mongoose.Types.ObjectId(),
  attendees: [attendee(true), attendee(false)]
};

export const rfi: RfiSchema.Data = {
  _id: mongoose.Types.ObjectId(),
  createdAt: date,
  publishedAt: date,
  versions: [rfiVersion],
  discoveryDayResponses: [discoveryDayResponse],
  discoveryDayResponsesDeprecated: []
};

export const publicFeedback: PublicFeedback = {
  _id: id,
  createdAt: date,
  rating: 'good',
  text: 'Feedback Text'
};
