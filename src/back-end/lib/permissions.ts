import { Session } from 'back-end/lib/app/types';
import * as UserSchema from 'back-end/lib/schemas/user';
import { validateUserId } from 'back-end/lib/validators';
import { get } from 'lodash';
import { AuthLevel, UserType } from 'shared/lib/types';

export const CURRENT_SESSION_ID = 'current';

export const ERROR_MESSAGE = 'You do not have permission to perform this action.';

export function isSignedIn(session: Session): boolean {
  return !!session.user;
}

export function isBuyer(session: Session): boolean {
  return !!session.user && session.user.type === UserType.Buyer;
}

export async function isVerifiedBuyerAndHasAcceptedTerms(UserModel: UserSchema.Model, session: Session): Promise<boolean> {
  const result = await validateUserId(UserModel, get(session.user, 'id', ''), UserType.Buyer, true, true);
  return result.tag === 'valid';
}

export function isProgramStaff(session: Session): boolean {
  return !!session.user && session.user.type === UserType.ProgramStaff;
}

export async function isProgramStaffAndHasAcceptedTerms(UserModel: UserSchema.Model, session: Session): Promise<boolean> {
  const result = await validateUserId(UserModel, get(session.user, 'id', ''), UserType.ProgramStaff, true);
  return result.tag === 'valid';
}

export function isVendor(session: Session): boolean {
  return !!session.user && session.user.type === UserType.Vendor;
}

export async function isVendorAndHasAcceptedTerms(UserModel: UserSchema.Model, session: Session): Promise<boolean> {
  const result = await validateUserId(UserModel, get(session.user, 'id', ''), UserType.Vendor, true);
  return result.tag === 'valid';
}

export function isOwnAccount(session: Session, id: string): boolean {
  // Strange type issue that allows ObjectIds to be passed as the `id` parameter,
  // so we ensure we are doing a string comparison here.
  return !!session.user && session.user.id.toString() === id.toString();
}

export function isOwnSession(session: Session, id: string): boolean {
  return session.sessionId.toString() === id;
}

export function isCurrentSession(id: string): boolean {
  return id === CURRENT_SESSION_ID;
}

export function isAuthorizedSession(session: Session, authLevel: AuthLevel<UserType>): boolean {
  switch (authLevel.tag) {
    case 'any':
      return true;
    case 'signedIn':
      return isSignedIn(session);
    case 'signedOut':
      return !isSignedIn(session);
    case 'userType':
      if (session.user) {
        return authLevel.value.indexOf(session.user.type) !== -1;
      } else {
        return false;
      }
  }
}

// Users.

export async function createUser(UserModel: UserSchema.Model, session: Session, createeUserType: UserType): Promise<boolean> {
  if (!isSignedIn(session) && createeUserType !== UserType.ProgramStaff) {
    return true;
  } else {
    return (await isProgramStaffAndHasAcceptedTerms(UserModel, session)) && createeUserType === UserType.ProgramStaff;
  }
}

export function readOneUser(session: Session, id: string): boolean {
  return isOwnAccount(session, id) || isProgramStaff(session);
}

export function readManyUsers(session: Session): boolean {
  return isProgramStaff(session);
}

export async function updateUser(UserModel: UserSchema.Model, session: Session, updateeId: string): Promise<boolean> {
  if (isOwnAccount(session, updateeId)) {
    return true;
  } else {
    return (await isProgramStaffAndHasAcceptedTerms(UserModel, session));
  }
}

export function deleteUser(session: Session, userId: string, userType: UserType): boolean {
  return (isOwnAccount(session, userId) && !isProgramStaff(session)) || (isProgramStaff(session) && userType === UserType.ProgramStaff && !isOwnAccount(session, userId));
}

// Sessions.

export function createSession(session: Session): boolean {
  return !isSignedIn(session);
}

export function readOneSession(session: Session, id: string): boolean {
  return isCurrentSession(id) || isOwnSession(session, id);
}

export function deleteSession(session: Session, id: string): boolean {
  return isCurrentSession(id) || isOwnSession(session, id);
}

// Forgot Password Tokens.

export function createForgotPasswordToken(session: Session): boolean {
  return !isSignedIn(session);
}

// Files.

export function createFile(session: Session): boolean {
  return isSignedIn(session);
}

export function readOneFile(session: Session, fileAuthLevel: AuthLevel<UserType>): boolean {
  return isAuthorizedSession(session, fileAuthLevel);
}

// File blobs.

export function readOneFileBlob(session: Session, fileAuthLevel: AuthLevel<UserType>): boolean {
  return isAuthorizedSession(session, fileAuthLevel);
}

// RFIs.

export async function createRfi(UserModel: UserSchema.Model, session: Session): Promise<boolean> {
  return (await isProgramStaffAndHasAcceptedTerms(UserModel, session));
}

export function readOneRfi(): boolean {
  return true;
}

export function readManyRfis(): boolean {
  return true;
}

export async function updateRfi(UserModel: UserSchema.Model, session: Session): Promise<boolean> {
  return (await isProgramStaffAndHasAcceptedTerms(UserModel, session));
}

// Discovery Day Responses.

export async function createDiscoveryDayResponse(UserModel: UserSchema.Model, session: Session, vendorId: string): Promise<boolean> {
  return (isVendor(session) && isOwnAccount(session, vendorId)) || (await isProgramStaffAndHasAcceptedTerms(UserModel, session));
}

export async function readManyDiscoveryDayResponses(UserModel: UserSchema.Model, session: Session): Promise<boolean> {
  return (await isProgramStaffAndHasAcceptedTerms(UserModel, session));
}

export async function readOneDiscoveryDayResponse(UserModel: UserSchema.Model, session: Session, vendorId: string): Promise<boolean> {
  return (isVendor(session) && isOwnAccount(session, vendorId)) || (await isProgramStaffAndHasAcceptedTerms(UserModel, session));
}

export async function updateDiscoveryDayResponse(UserModel: UserSchema.Model, session: Session, vendorId: string): Promise<boolean> {
  return (isVendor(session) && isOwnAccount(session, vendorId)) || (await isProgramStaffAndHasAcceptedTerms(UserModel, session));
}

export async function deleteDiscoveryDayResponse(UserModel: UserSchema.Model, session: Session, vendorId: string): Promise<boolean> {
  return (isVendor(session) && isOwnAccount(session, vendorId)) || (await isProgramStaffAndHasAcceptedTerms(UserModel, session));
}

// RFI Responses.

export function createRfiResponse(session: Session): boolean {
  return isVendor(session);
}

export async function readManyRfiResponses(UserModel: UserSchema.Model, session: Session): Promise<boolean> {
  return (await isProgramStaffAndHasAcceptedTerms(UserModel, session));
}

// Vendor Ideas.

export async function createVendorIdea(UserModel: UserSchema.Model, session: Session): Promise<boolean> {
  return (await isVendorAndHasAcceptedTerms(UserModel, session));
}

export async function readOneVendorIdea(UserModel: UserSchema.Model, session: Session): Promise<boolean> {
  return (await isProgramStaffAndHasAcceptedTerms(UserModel, session))
      || (await isVendorAndHasAcceptedTerms(UserModel, session))
      || (await isVerifiedBuyerAndHasAcceptedTerms(UserModel, session));
}

export async function readManyVendorIdeas(UserModel: UserSchema.Model, session: Session): Promise<boolean> {
  return (await isProgramStaffAndHasAcceptedTerms(UserModel, session))
      || (await isVendorAndHasAcceptedTerms(UserModel, session))
      || (await isVerifiedBuyerAndHasAcceptedTerms(UserModel, session));
}

export async function updateVendorIdea(UserModel: UserSchema.Model, session: Session): Promise<boolean> {
  return (await isProgramStaffAndHasAcceptedTerms(UserModel, session))
      || (await isVendorAndHasAcceptedTerms(UserModel, session));
}

// Vendor Idea Log Items.

export async function createVendorIdeaLogItem(UserModel: UserSchema.Model, session: Session): Promise<boolean> {
  return (await isProgramStaffAndHasAcceptedTerms(UserModel, session));
}
