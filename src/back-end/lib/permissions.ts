import * as SessionSchema from 'back-end/lib/schemas/session';
import { AuthLevel, UserType } from 'shared/lib/types';

type Session = SessionSchema.AppSession;

export const CURRENT_SESSION_ID = 'current';

export const ERROR_MESSAGE = 'You do not have permission to perform this action.';

export function isSignedIn(session: Session): boolean {
  return !!session.user;
}

export function isBuyer(session: Session): boolean {
  return !!session.user && session.user.type === UserType.Buyer;
}

export function isProgramStaff(session: Session): boolean {
  return !!session.user && session.user.type === UserType.ProgramStaff;
}

export function isVendor(session: Session): boolean {
  return !!session.user && session.user.type === UserType.Vendor;
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

export function createUser(session: Session, userType: UserType): boolean {
  return (!isSignedIn(session) && userType !== UserType.ProgramStaff) || (isProgramStaff(session) && userType === UserType.ProgramStaff);
}

export function readOneUser(session: Session, id: string): boolean {
  return isOwnAccount(session, id) || isProgramStaff(session);
}

export function readManyUsers(session: Session): boolean {
  return isProgramStaff(session);
}

export function updateUser(session: Session, id: string): boolean {
  return isOwnAccount(session, id);
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

export function createRfi(session: Session): boolean {
  return isProgramStaff(session);
}

export function readOneRfi(): boolean {
  return true;
}

export function readManyRfis(): boolean {
  return true;
}

export function updateRfi(session: Session): boolean {
  return isProgramStaff(session);
}

// Discovery Day Responses.

export function createDiscoveryDayResponse(session: Session): boolean {
  return isVendor(session);
}

export function readOneDiscoveryDayResponse(session: Session): boolean {
  return isVendor(session);
}
