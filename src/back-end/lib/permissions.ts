import * as SessionSchema from 'back-end/lib/schemas/session';
import { UserType } from 'shared/lib/types';

type Session = SessionSchema.AppSession;

export const CURRENT_SESSION_ID = 'current';

export const ERROR_MESSAGE = 'You do not have permission to perform this action.';

export function isLoggedIn(session: Session): boolean {
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
  return !!session.user && session.user.id.toString() === id;
}

export function isOwnSession(session: Session, id: string): boolean {
  return session.sessionId.toString() === id;
}

export function isCurrentSession(id: string): boolean {
  return id === CURRENT_SESSION_ID;
}

// Users.

export function createUser(session: Session): boolean {
  return !isLoggedIn(session) || isProgramStaff(session);
}

export function createProgramStaffUser(session: Session): boolean {
  return isProgramStaff(session);
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

export function deleteUser(session: Session, id: string): boolean {
  return isOwnAccount(session, id);
}

// Sessions.

export function createSession(session: Session): boolean {
  return !isLoggedIn(session);
}

export function readOneSession(session: Session, id: string): boolean {
  return isCurrentSession(id) || isOwnSession(session, id);
}

export function deleteSession(session: Session, id: string): boolean {
  return isCurrentSession(id) || isOwnSession(session, id);
}
