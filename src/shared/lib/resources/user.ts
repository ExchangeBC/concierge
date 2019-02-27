import { Profile } from 'shared/lib/types';
// import { optional, validateBoolean, validateDate, validateEmail, validateStringId } from 'shared/lib/validators';
import { FullProfileValidationErrors } from 'shared/lib/validators/profile';
// import { validateProfile } from 'shared/lib/validators/profile';

export interface PublicUser {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  email: string;
  acceptedTermsAt?: Date;
  active: boolean;
  profile: Profile;
}

/*export function parsePublicUser(user: any): PublicUser | null {
  const id = validateStringId(get(user, '_id'), 'ID');
  const createdAt = validateDate(get(user, 'createdAt'));
  const updatedAt = validateDate(get(user, 'updatedAt'));
  const email = validateEmail(get(user, 'email'));
  const acceptedTermsAt = optional(validateDate, get(user, 'acceptedTermsAt'));
  const active = validateBoolean(get(user, 'active'));
  const profile = validateProfile(get(user, 'profile'));
  if (id.tag === 'valid' && createdAt.tag === 'valid' && updatedAt.tag === 'valid' && email.tag === 'valid' && acceptedTermsAt.tag === 'valid' && active.tag === 'valid' && profile.tag === 'valid') {
    return {
      _id: id.value,
      createdAt: createdAt.value,
      updatedAt: updatedAt.value,
      email: email.value,
      acceptedTermsAt: acceptedTermsAt.value,
      active: active.value,
      profile: profile.value
    } as PublicUser;
  } else {
    return null;
  }
}*/

export interface CreateValidationErrors {
  permissions?: string[];
  email?: string[];
  password?: string[];
  profile?: FullProfileValidationErrors;
}

/*export function parseCreateValidationErrors(errors: any): CreateValidationErrors {
  const permissions = get(errors, 'permissions', []);
  const email = get(errors, 'email', []);
  const password = get(errors, 'password', []);
  const profile = parseProfileValidationErrors(get(errors, 'profile', {}));
  if (isArray(permissions) && isArray(email) && isArray(password) && profile) {
    return errors;
  } else {
    return {};
  }
}*/

export type CreateResponseBody = PublicUser | CreateValidationErrors;

export type ReadOneResponseBody = PublicUser | null;

export type ReadManyResponseBodyItem = PublicUser;

export type ReadManyErrorResponseBody = null;

export interface UpdateValidationErrors extends CreateValidationErrors {
  id?: string[];
  currentPassword?: string[];
  acceptedTerms?: string[];
}

export type UpdateResponseBody = PublicUser | UpdateValidationErrors;

export type DeleteResponseBody = null;
