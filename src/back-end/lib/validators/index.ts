import * as FileSchema from 'back-end/lib/schemas/file';
import * as RfiSchema from 'back-end/lib/schemas/request-for-information';
import * as UserSchema from 'back-end/lib/schemas/user';
import { includes } from 'lodash';
import * as mongoose from 'mongoose';
import mongooseDefault from 'mongoose';
import { rfiClosingAtToRfiStatus } from 'shared/lib/resources/request-for-information';
import { RfiStatus, UserType } from 'shared/lib/types';
import { ArrayValidation, invalid, valid, validateArrayAsync, validateEmail as validateEmailShared, validatePassword as validatePasswordShared, Validation } from 'shared/lib/validators';

interface HasEmail {
  email: string;
}

export async function validateEmail(Model: mongoose.Model<HasEmail & mongoose.Document>, email: string): Promise<Validation<string>> {
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
    switch (validatedObjectId.tag) {
      case 'valid':
        const file = await FileModel.findById(validatedObjectId.value);
        if (file) {
          return valid(file);
        } else {
          return invalid(['File does not exist']);
        }
      case 'invalid':
        return validatedObjectId;
    }
  });
}

/**
 * Validates whether a user exists for a given User ID.
 * Optionally validates the user matches a specific UserType,
 * and/or whether or not they have accepted the T&Cs.
 */

export async function validateUserId(UserModel: UserSchema.Model, id: string | mongoose.Types.ObjectId, userType?: UserType, acceptedTerms?: boolean): Promise<Validation<InstanceType<UserSchema.Model>>> {
  const validatedObjectId = typeof id === 'string' ? validateObjectIdString(id) : valid(id);
  switch (validatedObjectId.tag) {
    case 'valid':
      const user = await UserModel.findById(validatedObjectId.value);
      if (!user || !user.active) {
        return invalid(['User does not exist or is inactive.']);
      } else if (userType && user.profile.type !== userType) {
        return invalid([`User is not a ${userType}.`]);
      } else if (acceptedTerms !== undefined && !!user.acceptedTermsAt !== acceptedTerms) {
        if (acceptedTerms) {
          return invalid(['User has not yet accepted terms.']);
        } else {
          return invalid(['User has already accepted terms.']);
        }
      } else {
        return valid(user);
      }
    case 'invalid':
      return validatedObjectId;
  }
}

/**
 * Validates whether an RFI exists for a given RFI ID.
 */

export async function validateRfiId(RfiModel: RfiSchema.Model, id: string | mongoose.Types.ObjectId, rfiStatus?: RfiStatus[], mustBePublished?: boolean): Promise<Validation<InstanceType<RfiSchema.Model>>> {
  const validatedObjectId = typeof id === 'string' ? validateObjectIdString(id) : valid(id);
  switch (validatedObjectId.tag) {
    case 'valid':
      const rfi = await RfiModel.findById(validatedObjectId.value);
      if (!rfi) {
        return invalid(['RFI does not exist.']);
      }
      const latestVersion = RfiSchema.getLatestVersion(rfi);
      const matchesRfiStatus = !!latestVersion && !!rfiStatus && includes(rfiStatus, rfiClosingAtToRfiStatus(latestVersion.closingAt));
      if (rfiStatus && !matchesRfiStatus) {
        return invalid([`RFI is not one of: ${rfiStatus.join(', ')}`]);
      }
      if (mustBePublished && !RfiSchema.hasBeenPublished(rfi)) {
        return invalid(['RFI has not been published.']);
      }
      return valid(rfi);
    case 'invalid':
      return validatedObjectId;
  }
}
