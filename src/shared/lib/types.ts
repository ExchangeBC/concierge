import { get, isArray } from 'lodash';

/**
 * "ADT" stands for "Algebraic Data Type".
 *
 * ```
 * type Color
 *   = ADT<'red'>
 *   | ADT<'blue'>
 *   | ADT<'green'>
 *   | ADT<'rgb', [number, number, number]>;
 *
 * const red: Color = { tag: 'red', value: undefined };
 * const rgb: Color = { tag: 'rgb', value: [123, 255, 7] };
 * ```
 */

export interface ADT<Tag, Value = undefined> {
  readonly tag: Tag;
  readonly value: Value;
}

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export interface PaginatedList<Item> {
  readonly total: number;
  readonly offset: number;
  readonly count: number;
  readonly items: Item[];
}

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

/**
 * Parses a list of strings to a list of `UserType`.
 * If any of the strings are not a valid `UserType`,
 * this function returns `null`.
 *
 * The `UserType` type is a generic parameter,
 * enabling type polymorphism.
 */

export function parseUserTypeList<UserType>(list: string[], parseOneUserType: (raw: string) => UserType | null): UserType[] | null {
  return list.reduce((acc: UserType[] | null, raw: string) => {
    const parsed = parseOneUserType(raw);
    if (acc && parsed) {
      acc.push(parsed);
    } else {
      acc = null;
    }
    return acc;
  }, []);
}

export function userTypeToTitleCase(userType: UserType): string {
  switch (userType) {
    case UserType.Buyer:
      return 'Public Sector Buyer';
    case UserType.Vendor:
      return 'Vendor';
    case UserType.ProgramStaff:
      return 'Program Staff';
  }
}

export type AuthLevel<UserType>
  = ADT<'any'>
  | ADT<'signedIn'>
  | ADT<'signedOut'>
  | ADT<'userType', UserType[]>;

/**
 * Parses an `AuthLevel` from a plain object.
 * Returns `null` if the parse fails.
 */

export function parseAuthLevel<UserType>(raw: any, parseOneUserType: (raw: string) => UserType | null): AuthLevel<UserType> | null {
  switch (get(raw, 'tag')) {
    case 'any':
      return { tag: 'any', value: undefined };
    case 'signedIn':
      return { tag: 'signedIn', value: undefined };
    case 'signedOut':
      return { tag: 'signedOut', value: undefined };
    case 'userType':
      let rawUserTypes = get(raw, 'value');
      rawUserTypes = isArray(rawUserTypes) ? rawUserTypes : [];
      const userTypes = parseUserTypeList(rawUserTypes, parseOneUserType);
      if (userTypes) {
        return {
          tag: 'userType',
          value: userTypes
        };
      }
      // Else, continues to return null.
    default:
      return null;
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

export interface BuyerProfile {
  type: UserType.Buyer;
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
  categories?: string[];
}

export interface ProgramStaffProfile {
  type: UserType.ProgramStaff;
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
  type: UserType.Vendor;
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
  categories?: string[];
}

export type Profile = BuyerProfile | ProgramStaffProfile | VendorProfile;

export function profileToName(profile: Profile): string {
  switch (profile.type) {
    case UserType.Buyer:
    case UserType.ProgramStaff:
      const firstName = profile.firstName;
      const lastName = profile.lastName;
      return `${firstName} ${lastName}`;
    case UserType.Vendor:
      return profile.businessName;
  }
}

export interface Addendum {
  createdAt: Date;
  updatedAt: Date;
  description: string;
}

export enum RfiStatus {
  Open = 'OPEN',
  Closed = 'CLOSED',
  Expired = 'EXPIRED'
}

export function parseRfiStatus(raw: string): RfiStatus | null {
  switch (raw.toUpperCase()) {
    case RfiStatus.Open:
      return RfiStatus.Open;
    case RfiStatus.Closed:
      return RfiStatus.Closed;
    case RfiStatus.Expired:
      return RfiStatus.Expired;
    default:
      return null;
  }
}

export function rfiStatusToTitleCase(s: RfiStatus): string {
  switch (s) {
    case RfiStatus.Open:
      return 'Open';
    case RfiStatus.Closed:
    case RfiStatus.Expired:
      return 'Closed';
  }
}

export type Rating = 'good' | 'neutral' | 'bad';

export function ratingToTitleCase(rating: Rating): string {
  switch (rating) {
    case 'good':
      return 'Good';
    case 'neutral':
      return 'Neutral';
    case 'bad':
      return 'Bad';
  }
}
