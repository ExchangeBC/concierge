import * as crud from 'back-end/lib/crud';
import { validateEmail } from 'back-end/lib/validators';
import * as UserSchema from 'back-end/schemas/user';
import bcrypt from 'bcrypt';
import { isBoolean, isObject } from 'lodash';
import { getString } from 'shared/lib';
import { Omit } from 'shared/lib/types';
import { allValid, getInvalidValue, invalid, valid, validatePassword, ValidOrInvalid } from 'shared/lib/validators';
import { FullProfileValidationErrors, validateProfile } from 'shared/lib/validators/profile';

type PublicUser = Omit<UserSchema.Data, 'passwordHash'> & { passwordHash: undefined };

function makePublicUser(user: UserSchema.Data): PublicUser {
  return {
    _id: user._id,
    email: user.email,
    active: user.active,
    profile: user.profile,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    acceptedTermsAt: user.acceptedTermsAt,
    passwordHash: undefined
  };
}

interface CreateValidationErrors {
  email: string[];
  password: string[];
  profile: FullProfileValidationErrors;
}

type CreateRequestBody = ValidOrInvalid<UserSchema.Data, CreateValidationErrors>;

type CreateResponseBody = PublicUser | CreateValidationErrors;

type ReadOneResponseBody = PublicUser | null;

type ReadManyResponseBodyItem = PublicUser;

type ReadManyErrorResponseBody = null;

type DeleteResponseBody = null;

interface UpdateValidationErrors extends CreateValidationErrors {
  id: string[];
  currentPassword: string[];
  acceptedTerms: string[];
}

type UpdateRequestBody = ValidOrInvalid<InstanceType<UserSchema.Model>, UpdateValidationErrors>;

type UpdateResponseBody = PublicUser | UpdateValidationErrors;

async function validateCreateRequestBody(Model: UserSchema.Model, email: string, password: string, acceptedTerms: boolean, profile: object): Promise<CreateRequestBody> {
  const validatedEmail = await validateEmail(Model, email);
  const validatedPassword = await validatePassword(password);
  const validatedProfile = validateProfile(profile);
  const now = new Date();
  if (allValid([validatedEmail, validatedPassword, validatedProfile])) {
    return valid({
      email: validatedEmail.value,
      passwordHash: validatedPassword.value,
      active: true,
      acceptedTermsAt: acceptedTerms ? now : undefined,
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

async function validateUpdateRequestBody(Model: UserSchema.Model, id: string, email?: string, profile?: object, acceptedTerms?: boolean, newPassword?: string, currentPassword?: string): Promise<UpdateRequestBody> {
  // Does the user exist? Is their account active?
  const user = await Model.findById(id);
  if (!user || !user.active) {
    return invalid({
      id: ['Your user account does not exist or it is inactive.'],
      currentPassword: [],
      acceptedTerms: [],
      email: [],
      password: [],
      profile: []
    });
  }
  // If the user wants to change the password, can they?
  if (newPassword && currentPassword) {
    const correctPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    const validatedNewPassword = await validatePassword(newPassword);
    if (correctPassword && validatedNewPassword.tag === 'valid') {
      user.passwordHash = validatedNewPassword.value
    } else {
      return invalid({
        id: [],
        currentPassword: correctPassword ? [] : ['Please enter your correct password.'],
        acceptedTerms: [],
        email: [],
        password: getInvalidValue(validatedNewPassword, []),
        profile: []
      });
    }
  }
  // User has accepted terms.
  const now = new Date();
  if (!user.acceptedTermsAt && acceptedTerms) {
    user.acceptedTermsAt = now;
  } else if (user.acceptedTermsAt && acceptedTerms === false) {
    return invalid({
      id: [],
      currentPassword: [],
      acceptedTerms: ['You cannot un-accept the terms.'],
      email: [],
      password: [],
      profile: []
    });
  }
  // Update email.
  email = email && email.trim();
  if (email && user.email !== email) {
    const validatedEmail = await validateEmail(Model, email);
    switch (validatedEmail.tag) {
      case 'valid':
        user.email = validatedEmail.value;
        break;
      case 'invalid':
        return invalid({
          id: [],
          currentPassword: [],
          acceptedTerms: [],
          email: validatedEmail.value,
          password: [],
          profile: []
        });
    }
  }
  // Update profile.
  if (profile) {
    const validatedProfile = validateProfile(profile);
    switch (validatedProfile.tag) {
      case 'valid':
        if (validatedProfile.value.type !== user.profile.type) {
          return invalid({
            id: [],
            currentPassword: [],
            acceptedTerms: [],
            email: [],
            password: [],
            profile: ['You cannot change your user\'s profile type.']
          });
        }
        user.profile = validatedProfile.value;
        break;
      case 'invalid':
        return invalid({
          id: [],
          currentPassword: [],
          acceptedTerms: [],
          email: [],
          password: [],
          profile: validatedProfile.value
        });
    }
  }
  // Set updated date.
  user.updatedAt = now;
  return valid(user);
}

export type Resource = crud.Resource<UserSchema.Data, CreateRequestBody, CreateResponseBody, ReadOneResponseBody, ReadManyResponseBodyItem, ReadManyErrorResponseBody, UpdateRequestBody, UpdateResponseBody, DeleteResponseBody>;

const resource: Resource = {

  routeNamespace: 'users',
  model: UserSchema.NAME,

  create: {

    transformRequestBody(Model) {
      return async request => {
        const body = request.body;
        const email = body.email ? String(body.email) : '';
        const password = body.password ? String(body.password) : '';
        const acceptedTerms = isBoolean(body.acceptedTerms) ? body.acceptedTerms : false;
        const profile = isObject(body.profile) ? body.profile : {};
        return await validateCreateRequestBody(Model, email, password, acceptedTerms, profile);
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
              body: makePublicUser(user)
            };
        }
      };
    }

  },

  // TODO authentication.
  readOne(Model) {
    return async request => {
      const user = await Model.findById(request.params.id);
      if (!user || !user.active) {
        return {
          code: 404,
          headers: {},
          body: null
        };
      }
      return {
        code: 200,
        headers: {},
        body: makePublicUser(user)
      };
    };
  },

  // TODO authentication.
  // TODO pagination.
  readMany(Model) {
    return async request => {
      const users = await Model
        .find({ active: true })
        .sort({ email: 1 })
        .exec();
      return {
        code: 200,
        headers: {},
        body: {
          total: users.length,
          offset: 0,
          count: users.length,
          items: users.map(user => makePublicUser(user))
        }
      };
    };
  },

  // TODO authentication.
  update: {

    transformRequestBody(Model) {
      return async request => {
        const body = request.body;
        const id = request.params.id;
        const email = getString(body, 'email') || undefined;
        const profile = isObject(body.profile) ? body.profile : undefined;
        const acceptedTerms = isBoolean(body.acceptedTerms) ? body.acceptedTerms : undefined;
        const newPassword = getString(body, 'newPassword') || undefined;
        const currentPassword = getString(body, 'currentPassword') || undefined;
        return await validateUpdateRequestBody(Model, id, email, profile, acceptedTerms, newPassword, currentPassword);
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
            const user = request.body.value;
            await user.save();
            return {
              code: 200,
              headers: {},
              body: makePublicUser(user)
            };
        }
      };
    }

  },

  // TODO authentication.
  delete(Model) {
    return async request => {
      const user = await Model.findById(request.params.id);
      if (!user || !user.active) {
        return {
          code: 404,
          headers: {},
          body: null
        };
      }
      user.active = false;
      await user.save();
      return {
        code: 200,
        headers: {},
        body: null
      };
    };
  }

};

export default resource;
