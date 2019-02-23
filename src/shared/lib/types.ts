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
