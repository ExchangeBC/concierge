export interface ADT<Tag, Value> {
  tag: Tag;
  value: Value;
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
