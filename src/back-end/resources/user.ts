import * as crud from 'back-end/lib/crud';
import { validateEmail } from 'back-end/lib/validators';
import * as BuyerProfileSchema from 'back-end/schemas/buyer-profile';
import * as ProgramStaffProfileSchema from 'back-end/schemas/program-staff-profile';
import * as UserSchema from 'back-end/schemas/user';
import * as VendorProfileSchema from 'back-end/schemas/vendor-profile';
import { Set } from 'immutable';
import { isObject } from 'lodash';
import { UserType } from 'shared/lib/types';
import { allValid, getInvalidValue, invalid, valid, ValidOrInvalid } from 'shared/lib/validators';
import { validatePassword, validateUserType } from 'shared/lib/validators';
import { FullProfileValidationErrors, Profile, validateProfile } from 'shared/lib/validators/profile';

interface ValidCreateRequestBody {
  email: string;
  passwordHash: string;
  userType: UserType;
  profile: Profile;
}

interface CreateValidationErrors {
  email: string[];
  password: string[];
  userType: string[];
  profile: FullProfileValidationErrors;
}

export type CreateRequestBody = ValidOrInvalid<ValidCreateRequestBody, CreateValidationErrors>;

export interface UpdateRequestBody {
  email: string;
}

async function validateCreateRequestBody(Model: UserSchema.Model, email: string, password: string, userType: string, profile: object): Promise<CreateRequestBody> {
  const validatedEmail = await validateEmail(Model, email);
  const validatedPassword = await validatePassword(password);
  const validatedUserType = validateUserType(userType);
  const validatedProfile = await validateProfile(profile, validatedUserType);
  if (allValid([validatedEmail, validatedPassword, validatedUserType, validatedProfile])) {
    return valid({
      email: validatedEmail.value,
      passwordHash: validatedPassword.value,
      userType: validatedUserType.value,
      profile: validatedProfile.value
    } as ValidCreateRequestBody);
  } else {
    return invalid({
      email: getInvalidValue(validatedEmail, []),
      password: getInvalidValue(validatedPassword, []),
      userType: getInvalidValue(validatedUserType, []),
      profile: getInvalidValue(validatedProfile, [])
    });
  }
}

export type Resource = crud.Resource<UserSchema.Document, CreateRequestBody, UpdateRequestBody, CreateValidationErrors, null, null, null, null>;

const resource: Resource = {

  routeNamespace: 'users',
  model: UserSchema.NAME,
  extraModels: Set([
    BuyerProfileSchema.NAME,
    VendorProfileSchema.NAME,
    ProgramStaffProfileSchema.NAME
  ]),

  create: {

    transformRequestBody(Model, ExtraModels) {
      return async request => {
        const body = request.body;
        const email = body.email ? String(body.email) : '';
        const password = body.password ? String(body.password) : '';
        const userType = body.userType ? String(body.userType) : '';
        const profile = isObject(body.profile) ? body.profile : {};
        return await validateCreateRequestBody(Model, email, password, userType, profile);
      };
    },

    run(Model, ExtraModels) {
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
            request.logger.debug('body', body);
            // Create the profile.
            let ProfileModel;
            switch (body.userType) {
              case UserType.Buyer:
                ProfileModel = ExtraModels.get(BuyerProfileSchema.NAME);
                break;
              case UserType.Vendor:
                ProfileModel = ExtraModels.get(VendorProfileSchema.NAME);
                break;
              case UserType.ProgramStaff:
                ProfileModel = ExtraModels.get(ProgramStaffProfileSchema.NAME);
                break;
            }
            if (!ProfileModel) {
              throw new Error('Unable to create user profile, undefined ProfileModel.');
            }
            const profile = new ProfileModel(body.profile);
            await profile.save();
            // Create the user.
            const now = new Date();
            const user = new Model({
              email: body.email,
              passwordHash: body.passwordHash,
              userType: body.userType,
              profile: profile._id,
              createdAt: now,
              updatedAt: now
            });
            await user.save();
            // Respond with success.
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
