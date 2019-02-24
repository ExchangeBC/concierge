import * as crud from 'back-end/lib/crud';
import * as permissions from 'back-end/lib/permissions';
import * as SessionSchema from 'back-end/lib/schemas/session';
import * as UserSchema from 'back-end/lib/schemas/user';
import { basicResponse, mapRequestBody } from 'back-end/lib/server';
import { validateEmail } from 'back-end/lib/validators';
import { Set } from 'immutable';
import { isBoolean, isObject } from 'lodash';
import { getString, identityAsync } from 'shared/lib';
import { allValid, getInvalidValue, invalid, valid, validatePassword, ValidOrInvalid } from 'shared/lib/validators';
import { FullProfileValidationErrors, validateProfile } from 'shared/lib/validators/profile';

interface CreateValidationErrors {
  permissions?: string[];
  email?: string[];
  password?: string[];
  profile?: FullProfileValidationErrors;
}

type CreateRequestBody = ValidOrInvalid<UserSchema.Data, CreateValidationErrors>;

type CreateResponseBody = UserSchema.PublicUser | CreateValidationErrors;

type ReadOneResponseBody = UserSchema.PublicUser | null;

type ReadManyResponseBodyItem = UserSchema.PublicUser;

type ReadManyErrorResponseBody = null;

type DeleteResponseBody = null;

interface UpdateValidationErrors extends CreateValidationErrors {
  id?: string[];
  currentPassword?: string[];
  acceptedTerms?: string[];
}

type UpdateRequestBody = ValidOrInvalid<InstanceType<UserSchema.Model>, UpdateValidationErrors>;

type UpdateResponseBody = UserSchema.PublicUser | UpdateValidationErrors;

async function validateCreateRequestBody(Model: UserSchema.Model, email: string, password: string, acceptedTerms: boolean, profile: object): Promise<CreateRequestBody> {
  const validatedEmail = await validateEmail(Model, email);
  const validatedPassword = await validatePassword(Model, password);
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

// TODO break this up into smaller functions.
async function validateUpdateRequestBody(Model: UserSchema.Model, id: string, email?: string, profile?: object, acceptedTerms?: boolean, newPassword?: string, currentPassword?: string): Promise<UpdateRequestBody> {
  // Does the user exist? Is their account active?
  const user = await Model.findById(id);
  if (!user || !user.active) {
    return invalid({
      id: ['Your user account does not exist or it is inactive.']
    });
  }
  // Change password.
  if (newPassword && currentPassword) {
    const correctPassword = await Model.authenticate(user, currentPassword);
    const validatedNewPassword = await validatePassword(Model, newPassword);
    if (correctPassword && validatedNewPassword.tag === 'valid') {
      user.passwordHash = validatedNewPassword.value
    } else {
      return invalid({
        currentPassword: correctPassword ? [] : ['Please enter your correct password.'],
        password: getInvalidValue(validatedNewPassword, [])
      });
    }
  }
  // Accepted terms?
  const now = new Date();
  if (!user.acceptedTermsAt && acceptedTerms) {
    user.acceptedTermsAt = now;
  } else if (user.acceptedTermsAt && acceptedTerms === false) {
    return invalid({
      acceptedTerms: ['You cannot un-accept the terms.']
    });
  }
  // Email.
  email = email && email.trim();
  if (email && user.email !== email) {
    const validatedEmail = await validateEmail(Model, email);
    switch (validatedEmail.tag) {
      case 'valid':
        user.email = validatedEmail.value;
        break;
      case 'invalid':
        return invalid({
          email: validatedEmail.value
        });
    }
  }
  // Profile.
  if (profile) {
    const validatedProfile = validateProfile(profile);
    switch (validatedProfile.tag) {
      case 'valid':
        if (validatedProfile.value.type !== user.profile.type) {
          return invalid({
            profile: ['You cannot change your user\'s profile type.']
          });
        }
        user.profile = validatedProfile.value;
        break;
      case 'invalid':
        return invalid({
          profile: validatedProfile.value
        });
    }
  }
  // Set updated date.
  user.updatedAt = now;
  return valid(user);
}

export type Resource = crud.Resource<UserSchema.Model, CreateRequestBody, CreateResponseBody, ReadOneResponseBody, ReadManyResponseBodyItem, ReadManyErrorResponseBody, UpdateRequestBody, UpdateResponseBody, DeleteResponseBody, SessionSchema.AppSession>;

const resource: Resource = {

  routeNamespace: 'users',
  model: UserSchema.NAME,
  extraModels: Set([SessionSchema.NAME]),

  create(Model, ExtraModels) {
    const SessionModel = ExtraModels.get(SessionSchema.NAME) as SessionSchema.Model;
    return {
      async transformRequest(request) {
        if (!permissions.createUser(request.session)) {
          return mapRequestBody(request, invalid({
            permissions: [permissions.ERROR_MESSAGE]
          }));
        }
        const body = request.body;
        const email = body.email ? String(body.email) : '';
        const password = body.password ? String(body.password) : '';
        const acceptedTerms = isBoolean(body.acceptedTerms) ? body.acceptedTerms : false;
        const profile = isObject(body.profile) ? body.profile : {};
        const validatedBody = await validateCreateRequestBody(Model, email, password, acceptedTerms, profile);
        return mapRequestBody(request, validatedBody);
      },
      async respond(request) {
        switch (request.body.tag) {
          case 'invalid':
            const invalidCode = request.body.value.permissions ? 401 : 400;
            return basicResponse(invalidCode, request.session, request.body.value);
          case 'valid':
            const body = request.body.value;
            const user = new Model(body);
            await user.save();
            const validSession = await SessionSchema.login(SessionModel, Model, request.session, user._id);
            return basicResponse(201, validSession, UserSchema.makePublicUser(user));
        }
      }
    };
  },

  readOne(Model) {
    return {
      transformRequest: identityAsync,
      async respond(request) {
        if (!permissions.readOneUser(request.session, request.params.id)) {
          return basicResponse(401, request.session, null);
        }
        const user = await Model.findOne({ _id: request.params.id, active: true });
        if (!user) {
          return basicResponse(404, request.session, null);
        } else {
          return basicResponse(200, request.session, UserSchema.makePublicUser(user));
        }
      }
    };
  },

  // TODO pagination.
  readMany(Model) {
    return {
      transformRequest: identityAsync,
      async respond(request) {
        if (!permissions.readManyUsers(request.session)) {
          return basicResponse(401, request.session, null);
        }
        const users = await Model
          .find({ active: true })
          .sort({ email: 1 })
          .exec();
        return basicResponse(200, request.session, {
          total: users.length,
          offset: 0,
          count: users.length,
          items: users.map(user => UserSchema.makePublicUser(user))
        });
      }
    };
  },

  update(Model) {
    return {
      async transformRequest(request) {
        const body = request.body;
        const id = request.params.id;
        if (!permissions.updateUser(request.session, id)) {
          return mapRequestBody(request, invalid({
            permissions: [permissions.ERROR_MESSAGE]
          }));
        }
        const email = getString(body, 'email') || undefined;
        const profile = isObject(body.profile) ? body.profile : undefined;
        const acceptedTerms = isBoolean(body.acceptedTerms) ? body.acceptedTerms : undefined;
        const newPassword = getString(body, 'newPassword') || undefined;
        const currentPassword = getString(body, 'currentPassword') || undefined;
        const validatedBody = await validateUpdateRequestBody(Model, id, email, profile, acceptedTerms, newPassword, currentPassword);
        return mapRequestBody(request, validatedBody);
      },
      async respond(request) {
        switch (request.body.tag) {
          case 'invalid':
            const invalidCode = request.body.value.permissions ? 401 : 400;
            return basicResponse(invalidCode, request.session, request.body.value);
          case 'valid':
            const user = request.body.value;
            await user.save();
            return basicResponse(200, request.session, UserSchema.makePublicUser(user));
        }
      }
    };
  },

  delete(Model, ExtraModels) {
    const SessionModel = ExtraModels.get(SessionSchema.NAME) as SessionSchema.Model;
    return {
      transformRequest: identityAsync,
      async respond(request) {
        if (!permissions.deleteUser(request.session, request.params.id)) {
          return basicResponse(401, request.session, null);
        }
        const user = await Model.findOne({ _id: request.params.id, active: true });
        if (!user) {
          return basicResponse(404, request.session, null);
        } else {
          user.active = false;
          await user.save();
          const session = await SessionSchema.logout(SessionModel, request.session);
          return basicResponse(200, session, null);
        }
      }
    };
  }
};

export default resource;
