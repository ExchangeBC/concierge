import { PublicFile } from 'shared/lib/resources/file';
import { PublicUser } from 'shared/lib/resources/user';
import { LogItemTypeStatus, PublicLogItem } from 'shared/lib/resources/vendor-idea/log-item';
import { ADT, UserType } from 'shared/lib/types';

export type InnovationDefinition
  = ADT<'newTechnology'>
  | ADT<'existingTechnologyNotPurchased'>
  | ADT<'newApplicationOfExistingTechnology'>
  | ADT<'improvementToExistingTechnology'>
  | ADT<'newGovernmentNeeds'>
  | ADT<'other', string>;

export interface VersionDescription {
  title: string;
  summary: string;
  industrySectors: string[];
  categories: string[];
}

export interface VersionEligibility {
  existingPurchase?: string;
  productOffering: string;
  innovationDefinitions: InnovationDefinition[];
}

export interface VersionContact {
  name: string;
  email: string;
  phoneNumber: string;
}

export interface PublicVersionBase {
  createdAt: Date;
  attachments: PublicFile[];
  description: VersionDescription;
}

export type PublicVersionForBuyers = PublicVersionBase;

export interface PublicVersionForVendors extends PublicVersionBase {
  eligibility: VersionEligibility;
  contact: VersionContact;
}

export interface PublicVersionForProgramStaff extends PublicVersionBase {
  createdBy: PublicUser;
  eligibility: VersionEligibility;
  contact: VersionContact;
}

export type PublicVersion
  = PublicVersionForBuyers
  | PublicVersionForVendors
  | PublicVersionForProgramStaff;

export interface PublicVendorIdeaBase<UserType> {
  userType: UserType;
  _id: string;
  createdAt: Date;
}

export interface PublicVendorIdeaForBuyers extends PublicVendorIdeaBase<UserType.Buyer> {
  latestVersion: PublicVersionForBuyers;
}

export interface PublicVendorIdeaForVendors extends PublicVendorIdeaBase<UserType.Vendor> {
  latestVersion: PublicVersionForVendors;
  latestStatus: LogItemTypeStatus;
}

export interface PublicVendorIdeaForProgramStaff extends PublicVendorIdeaBase<UserType.ProgramStaff> {
  latestVersion: PublicVersionForProgramStaff;
  latestStatus: LogItemTypeStatus;
  createdBy: PublicUser;
  log: PublicLogItem[];
}

export type PublicVendorIdea
  = PublicVendorIdeaForBuyers
  | PublicVendorIdeaForVendors
  | PublicVendorIdeaForProgramStaff;

/**
 * Create slim version of the vendor idea types to reduce
 * network payload size wherever possible.
 */

export interface PublicVersionSlim {
  createdAt: Date;
  description: VersionDescription;
}

export interface PublicVendorIdeaSlimBase<UserType> {
  userType: UserType;
  _id: string;
  createdAt: Date;
  latestVersion: PublicVersionSlim;
}

export type PublicVendorIdeaSlimForBuyers = PublicVendorIdeaSlimBase<UserType.Buyer>;

export interface PublicVendorIdeaSlimForVendors extends PublicVendorIdeaSlimBase<UserType.Vendor> {
  latestStatus: LogItemTypeStatus;
}

export interface PublicVendorIdeaSlimForProgramStaff extends PublicVendorIdeaSlimBase<UserType.ProgramStaff> {
  latestStatus: LogItemTypeStatus;
  createdBy: PublicUser;
}

export type PublicVendorIdeaSlim
  = PublicVendorIdeaSlimForBuyers
  | PublicVendorIdeaSlimForVendors
  | PublicVendorIdeaSlimForProgramStaff;

// TODO validation error types
// TODO read many paginated response type

export interface CreateRequestBody {
  description: VersionDescription;
  eligibility: VersionEligibility;
  contact: VersionContact;
  attachments: string[];
}

export interface VersionDescriptionValidationErrors {
  title?: string[];
  summary?: string[];
  industrySectors?: string[][];
  categories?: string[][];
  numIndustrySectors?: string[];
  numCategories?: string[];
}

export interface VersionEligibilityValidationErrors {
  existingPurchase?: string[];
  productOffering?: string[];
  innovationDefinitions?: string[];
}

export interface VersionContactValidationErrors {
  name?: string[];
  email?: string[];
  phoneNumber?: string[];
}

export interface CreateValidationErrors {
  description?: VersionDescriptionValidationErrors;
  eligibility?: VersionEligibilityValidationErrors;
  contact?: VersionContactValidationErrors;
  attachments?: string[][];
}

export type UpdateRequestBody = CreateRequestBody;

export interface UpdateValidationErrors extends CreateValidationErrors {
  vendorIdeaId?: string[];
}
