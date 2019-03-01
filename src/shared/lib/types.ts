export interface ADT<Tag, Value = undefined> {
  tag: Tag;
  value: Value;
}

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export enum HttpMethod {
  Any = '*',
  Get = 'GET',
  Post = 'POST',
  Put = 'PUT',
  Patch = 'PATCH',
  Delete = 'DELETE',
  Options = 'OPTIONS'
}

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

export function userTypeToTitleCase(userType: UserType): string {
  switch (userType) {
    case UserType.Buyer:
      return 'Buyer';
    case UserType.Vendor:
      return 'Vendor';
    case UserType.ProgramStaff:
      return 'Program Staff';
  }
}

export enum BusinessType {
  Corporation = 'CORPORATION',
  LimitedLiabilityCompany = 'LIMITED_LIABILITY_COMPANY',
  Partnership = 'PARTNERSHIP',
  SoleProprietor = 'SOLE_PROPRIETOR'
}

export function parseBusinessType(raw: string): BusinessType | null {
  switch (raw.toUpperCase()) {
    case BusinessType.Corporation:
      return BusinessType.Corporation;
    case BusinessType.LimitedLiabilityCompany:
      return BusinessType.LimitedLiabilityCompany;
    case BusinessType.Partnership:
      return BusinessType.Partnership;
    case BusinessType.SoleProprietor:
      return BusinessType.SoleProprietor;
    default:
      return null;
  }
}

// TODO make profile fields required per feedback from liz.
export interface BuyerProfile {
  type: 'buyer';
  firstName: string;
  lastName: string;
  positionTitle: string;
  publicSectorEntity: string;
  branch?: string;
  contactStreetAddress?: string;
  contactCity?: string;
  contactProvince?: string;
  contactPostalCode?: string;
  contactCountry?: string;
  contactPhoneNumber?: string;
  contactPhoneCountryCode?: string;
  contactPhoneType?: PhoneType;
  industrySectors?: string[];
  areasOfInterest?: string[];
}

export interface ProgramStaffProfile {
  type: 'program_staff';
  firstName: string;
  lastName: string;
  positionTitle: string;
  contactStreetAddress?: string;
  contactCity?: string;
  contactProvince?: string;
  contactPostalCode?: string;
  contactCountry?: string;
  contactPhoneNumber?: string;
  contactPhoneCountryCode?: string;
  contactPhoneType?: PhoneType;
}

export interface VendorProfile {
  type: 'vendor';
  businessName: string;
  businessType?: BusinessType;
  businessNumber?: string;
  businessStreetAddress?: string;
  businessCity?: string;
  businessProvince?: string;
  businessPostalCode?: string;
  businessCountry?: string;
  contactName?: string;
  contactPositionTitle?: string;
  contactEmail?: string;
  contactPhoneNumber?: string;
  contactPhoneCountryCode?: string;
  contactPhoneType?: PhoneType;
  industrySectors?: string[];
  areasOfExpertise?: string[];
}

export type Profile = BuyerProfile | ProgramStaffProfile | VendorProfile;
