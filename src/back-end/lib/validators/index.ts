import * as FileSchema from 'back-end/lib/schemas/file';
import * as RfiSchema from 'back-end/lib/schemas/request-for-information';
import * as UserSchema from 'back-end/lib/schemas/user';
import * as ViSchema from 'back-end/lib/schemas/vendor-idea';
import { includes } from 'lodash';
import * as mongoose from 'mongoose';
import mongooseDefault from 'mongoose';
import { determineRfiStatus } from 'shared/lib/resources/request-for-information';
import { getLatestStatus, LogItemTypeStatus } from 'shared/lib/resources/vendor-idea/log-item';
import { RfiStatus, UserType, VerificationStatus } from 'shared/lib/types';
import { ArrayValidation, invalid, valid, validateArrayAsync, validateEmail as validateEmailShared, validatePassword as validatePasswordShared, Validation } from 'shared/lib/validators';

export async function validateEmail(Model: mongoose.Model<UserSchema.Data & mongoose.Document>, email: string): Promise<Validation<string>> {
  const validation = validateEmailShared(email);
  switch (validation.tag) {
    case 'invalid':
      return validation;
    case 'valid':
      const user = await Model.findOne({ email: validation.value }).exec();
      if (!user) {
        return valid(validation.value);
      } else {
        return invalid([`${email} is already associated with another account.`]);
      }
  }
}

export async function validatePassword(password: string): Promise<Validation<string>> {
  const validation = validatePasswordShared(password);
  switch (validation.tag) {
    case 'invalid':
      return validation;
    case 'valid':
      return valid(await UserSchema.hashPassword(validation.value));
  }
}

export function validateObjectIdString(id: string): Validation<mongoose.Types.ObjectId> {
  const isValid = mongooseDefault.Types.ObjectId.isValid(id);
  if (isValid) {
    return valid(mongooseDefault.Types.ObjectId(id));
  } else {
    return invalid([`"${id}" is not a valid ObjectId.`]);
  }
}

export function validateFileIdArray(FileModel: FileSchema.Model, raw: string[]): Promise<ArrayValidation<InstanceType<FileSchema.Model>>> {
  return validateArrayAsync(raw, async (v: string): Promise<Validation<InstanceType<FileSchema.Model>>> => {
    const validatedObjectId = validateObjectIdString(v);
    if (validatedObjectId.tag === 'invalid') {
      return invalid([`File's ID "${v}" is not valid.`]);
    }
    const file = await FileModel.findById(validatedObjectId.value);
    if (file) {
      return valid(file);
    } else {
      return invalid(['File does not exist']);
    }
  });
}

/**
 * Validates whether a user exists for a given User ID.
 * Optionally validates the user matches a specific UserType,
 * and/or whether or not they have accepted the T&Cs.
 */

export async function validateUserId(UserModel: UserSchema.Model, id: string | mongoose.Types.ObjectId, userType?: UserType[], acceptedTerms?: boolean, mustBeVerified?: boolean): Promise<Validation<InstanceType<UserSchema.Model>>> {
  const validatedObjectId = typeof id === 'string' ? validateObjectIdString(id) : valid(id);
  if (validatedObjectId.tag === 'invalid') {
    return invalid([`User ID "${id}" is not valid.`]);
  }
  const user = await UserModel.findById(validatedObjectId.value);
  if (!user || !user.active) {
    return invalid(['User does not exist or is inactive.']);
  } else if (userType && !includes(userType, user.profile.type)) {
    return invalid([`User is not one of: ${userType.join(', ')}.`]);
  } else if (acceptedTerms !== undefined && !!user.acceptedTermsAt !== acceptedTerms) {
    if (acceptedTerms) {
      return invalid(['User has not yet accepted terms.']);
    } else {
      return invalid(['User has already accepted terms.']);
    }
  } else if (user.profile.type === UserType.Buyer && mustBeVerified && user.profile.verificationStatus !== VerificationStatus.Verified) {
    return invalid(['User has not been verified.']);
  } else {
    return valid(user);
  }
}

/**
 * Validates whether an RFI exists for a given RFI ID.
 */

export async function validateRfiId(RfiModel: RfiSchema.Model, id: string | mongoose.Types.ObjectId, rfiStatus?: RfiStatus[], mustBePublished?: boolean): Promise<Validation<InstanceType<RfiSchema.Model>>> {
  const validatedObjectId = typeof id === 'string' ? validateObjectIdString(id) : valid(id);
  if (validatedObjectId.tag === 'invalid') {
    return invalid([`RFI's ID "${id}" is not valid.`]);
  }
  const rfi = await RfiModel.findById(validatedObjectId.value);
  if (!rfi) {
    return invalid(['RFI does not exist.']);
  }
  const latestVersion = RfiSchema.getLatestVersion(rfi);
  const matchesRfiStatus = !!latestVersion && !!rfiStatus && includes(rfiStatus, determineRfiStatus(latestVersion.closingAt, latestVersion.gracePeriodDays));
  if (rfiStatus && !matchesRfiStatus) {
    return invalid([`RFI is not one of: ${rfiStatus.join(', ')}`]);
  }
  if (mustBePublished && !RfiSchema.hasBeenPublished(rfi)) {
    return invalid(['RFI has not been published.']);
  }
  return valid(rfi);
}

export async function validateVendorIdeaId(ViModel: ViSchema.Model, id: string | mongoose.Types.ObjectId, latestStatus?: LogItemTypeStatus[]): Promise<Validation<InstanceType<ViSchema.Model>>> {
  const validatedObjectId = typeof id === 'string' ? validateObjectIdString(id) : valid(id);
  if (validatedObjectId.tag === 'invalid') {
    return invalid([`Unsolicited Proposal's ID "${id}" is not valid.`]);
  }
  const vi = await ViModel.findById(validatedObjectId.value);
  if (!vi) {
    return invalid(['Unsolicited Proposal does not exist.']);
  }
  const matchesLatestStatus = !!latestStatus && includes(latestStatus, getLatestStatus(vi.log));
  if (latestStatus && !matchesLatestStatus) {
    return invalid([`Unsolicited Proposal's latest status is not one of: ${latestStatus.join(', ')}`]);
  }
  return valid(vi);
}
