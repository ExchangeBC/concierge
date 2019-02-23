import * as mongoose from 'mongoose';
import { invalid, valid, validateEmail as validateEmailShared, Validation } from 'shared/lib/validators';

export async function validateEmail<Document extends mongoose.Document>(Model: mongoose.Model<Document>, email: string): Promise<Validation<string>> {
  const validation = validateEmailShared(email);
  switch (validation.tag) {
    case 'invalid':
      return validation;
    case 'valid':
      const user = await Model.findOne({ email }).exec();
      if (!user) {
        return valid(validation.value);
      } else {
        return invalid(['Email already exists']);
      }
  }
}
