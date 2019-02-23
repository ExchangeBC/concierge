import * as crud from 'back-end/lib/crud';
import { validateEmail } from 'back-end/lib/validators';
import * as UserSchema from 'back-end/schemas/user';
import { isObject } from 'lodash';
import { allValid, getInvalidValue, invalid, valid, ValidOrInvalid } from 'shared/lib/validators';
import { validatePassword } from 'shared/lib/validators';
import { FullProfileValidationErrors, validateProfile } from 'shared/lib/validators/profile';

interface CreateValidationErrors {
  email: string[];
  password: string[];
  profile: FullProfileValidationErrors;
}

export type CreateRequestBody = ValidOrInvalid<UserSchema.Data, CreateValidationErrors>;

export interface UpdateRequestBody {
  email: string;
}

async function validateCreateRequestBody(Model: UserSchema.Model, email: string, password: string, profile: object): Promise<CreateRequestBody> {
  const validatedEmail = await validateEmail(Model, email);
  const validatedPassword = await validatePassword(password);
  const validatedProfile = await validateProfile(profile);
  const now = new Date();
  if (allValid([validatedEmail, validatedPassword, validatedProfile])) {
    return valid({
      email: validatedEmail.value,
      passwordHash: validatedPassword.value,
      active: true,
      profile: validatedProfile.value,
      createdAt: now,
      updatedAt: now
    } as UserSchema.Data);
  } else {
    return invalid({
      email: getInvalidValue(validatedEmail, []),
      password: getInvalidValue(validatedPassword, []),
      profile: getInvalidValue(validatedProfile, [])
    });
  }
}

export type Resource = crud.Resource<UserSchema.Data, CreateRequestBody, UserSchema.Data, CreateValidationErrors, null, null, null, null, null, null, null, null, null>;

const resource: Resource = {

  routeNamespace: 'users',
  model: UserSchema.NAME,

  create: {

    transformRequestBody(Model) {
      return async request => {
        const body = request.body;
        const email = body.email ? String(body.email) : '';
        const password = body.password ? String(body.password) : '';
        const profile = isObject(body.profile) ? body.profile : {};
        return await validateCreateRequestBody(Model, email, password, profile);
      };
    },

    run(Model) {
      return async request => {
        switch (request.body.tag) {
          case 'invalid':
            return {
              code: 400,
              headers: {},
              body: request.body.value
            };
          case 'valid':
            const body = request.body.value;
            const user = new Model(body);
            await user.save();
            return {
              code: 201,
              headers: {},
              body: user
            };
        }
      };
    }

  }

};

export default resource;
