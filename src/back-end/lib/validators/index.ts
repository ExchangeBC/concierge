import * as UserSchema from 'back-end/lib/schemas/user';
import * as mongoose from 'mongoose';
import { invalid, valid, validateEmail as validateEmailShared, validatePassword as validatePasswordShared, Validation } from 'shared/lib/validators';

interface HasEmail {
  email: string;
}

export async function validateEmail(Model: mongoose.Model<HasEmail & mongoose.Document>, email: string): Promise<Validation<string>> {
  const validation = validateEmailShared(email);
  switch (validation.tag) {
    case 'invalid':
      return validation;
    case 'valid':
      const user = await Model.findOne({ email }).exec();
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
