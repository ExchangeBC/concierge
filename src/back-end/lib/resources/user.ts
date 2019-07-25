import { AvailableModels, Session, SupportedRequestBodies } from 'back-end/lib/app/types';
import * as crud from 'back-end/lib/crud';
import * as mailer from 'back-end/lib/mailer';
import * as permissions from 'back-end/lib/permissions';
import * as SessionSchema from 'back-end/lib/schemas/session';
import * as UserSchema from 'back-end/lib/schemas/user';
import { basicResponse, JsonResponseBody, makeJsonResponseBody, Response } from 'back-end/lib/server';
import { validateEmail, validatePassword } from 'back-end/lib/validators';
import { get, isBoolean, isObject } from 'lodash';
import * as mongoose from 'mongoose';
import { getBoolean, getString } from 'shared/lib';
import { CreateRequestBody, CreateValidationErrors, PublicUser, UpdateRequestBody, UpdateValidationErrors } from 'shared/lib/resources/user';
import { PaginatedList, UserType, VerificationStatus } from 'shared/lib/types';
import { allValid, getInvalidValue, invalid, valid, ValidOrInvalid } from 'shared/lib/validators';
import { validateProfile } from 'shared/lib/validators/profile';

type CreateResponseBody = JsonResponseBody<PublicUser | CreateValidationErrors>;

type ReadOneResponseBody = JsonResponseBody<PublicUser | null>;

type ReadManyResponseBody = JsonResponseBody<PaginatedList<PublicUser> | null>;

type UpdateResponseBody = JsonResponseBody<PublicUser | UpdateValidationErrors>;

type DeleteResponseBody = JsonResponseBody<null>;

async function validateCreateRequestBody(Model: UserSchema.Model, body: CreateRequestBody, createdBy?: mongoose.Types.ObjectId): Promise<ValidOrInvalid<UserSchema.Data, CreateValidationErrors>> {
  const { email, password, profile, acceptedTerms = false } = body;
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
      createdBy,
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

interface ValidUpdateRequestBody {
  user: InstanceType<UserSchema.Model>;
  verificationStatusHasChanged: boolean;
}

async function validateUpdateRequestBody(Model: UserSchema.Model, body: UpdateRequestBody, session: Session): Promise<ValidOrInvalid<ValidUpdateRequestBody, UpdateValidationErrors>> {
  const { id, currentPassword, newPassword, profile, acceptedTerms } = body;
  let verificationStatusHasChanged = false;
  let { email } = body;
  // Does the user exist? Is their account active?
  const user = await Model.findById(id);
  if (!user || !user.active) {
    return invalid({
      id: ['Your user account does not exist or it is inactive.']
    });
  }
  // Change password.
  if (newPassword && currentPassword) {
    const correctPassword = await UserSchema.authenticate(user, currentPassword);
    const validatedNewPassword = await validatePassword(newPassword);
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
    if (user.profile.type === UserType.Buyer && profile.type === UserType.Buyer) {
      profile.verificationStatus = profile.verificationStatus || user.profile.verificationStatus;
    }
    const validatedProfile = validateProfile(profile);
    switch (validatedProfile.tag) {
      case 'valid':
        verificationStatusHasChanged = validatedProfile.value.type === UserType.Buyer && user.profile.type === UserType.Buyer && validatedProfile.value.verificationStatus !== user.profile.verificationStatus;
        if (verificationStatusHasChanged && !permissions.isProgramStaff(session)) {
          // Only Program Staff can modify a buyer's verification status.
          return invalid({
            profile: ['You cannot change your verification status.']
          });
        }
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
  return valid({
    user,
    verificationStatusHasChanged
  });
}

type RequiredModels = 'User' | 'Session';

export type Resource = crud.Resource<SupportedRequestBodies, JsonResponseBody, AvailableModels, RequiredModels, CreateRequestBody, UpdateRequestBody, Session>;

const resource: Resource = {

  routeNamespace: 'users',

  create(Models) {
    const UserModel = Models.User as UserSchema.Model;
    const SessionModel = Models.Session as SessionSchema.Model;
    return {
      async transformRequest(request) {
        // TODO bad request response if body is not json
        const body = request.body.tag === 'json' ? request.body.value : {};
        const profile = isObject(body.profile) ? body.profile : {};
        if (profile.type === UserType.Buyer) {
          profile.verificationStatus = VerificationStatus.Unverified;
        }
        return {
          email: getString(body, 'email'),
          password: getString(body, 'password'),
          acceptedTerms: getBoolean(body, 'acceptedTerms'),
          profile
        };
      },
      async respond(request): Promise<Response<CreateResponseBody, Session>> {
        if (!(await permissions.createUser(UserModel, request.session, request.body.profile.type))) {
          return basicResponse(401, request.session, makeJsonResponseBody({
            permissions: [permissions.ERROR_MESSAGE]
          }));
        }
        const createdBy = get(request.session.user, 'id');
        const validatedBody = await validateCreateRequestBody(UserModel, request.body, createdBy);
        switch (validatedBody.tag) {
          case 'invalid':
            const invalidCode = validatedBody.value.permissions ? 401 : 400;
            return basicResponse(invalidCode, request.session, makeJsonResponseBody(validatedBody.value));
          case 'valid':
            const body = validatedBody.value;
            const user = new UserModel(body);
            await user.save();
            // Send notification email.
            mailer.createUser(user.email);
            // Sign in the user if they are creating their own account.
            // Otherwise, as is the case with Program Staff, leave them signed in.
            let session = request.session;
            if (!permissions.isSignedIn(request.session)) {
              session = await SessionSchema.signIn(SessionModel, UserModel, request.session, user._id);
            }
            return basicResponse(201, session, makeJsonResponseBody(UserSchema.makePublicUser(user)));
        }
      }
    };
  },

  readOne(Models) {
    const UserModel = Models.User as UserSchema.Model;
    return {
      async transformRequest({ body }) {
        return body;
      },
      async respond(request): Promise<Response<ReadOneResponseBody, Session>> {
        if (!permissions.readOneUser(request.session, request.params.id)) {
          return basicResponse(401, request.session, makeJsonResponseBody(null));
        }
        const user = await UserModel.findOne({ _id: request.params.id, active: true });
        if (!user) {
          return basicResponse(404, request.session, makeJsonResponseBody(null));
        } else {
          return basicResponse(200, request.session, makeJsonResponseBody(UserSchema.makePublicUser(user)));
        }
      }
    };
  },

  // TODO pagination.
  readMany(Models) {
    const UserModel = Models.User as UserSchema.Model;
    return {
      async transformRequest({ body }) {
        return body;
      },
      async respond(request): Promise<Response<ReadManyResponseBody, Session>> {
        if (!permissions.readManyUsers(request.session)) {
          return basicResponse(401, request.session, makeJsonResponseBody(null));
        }
        const users = await UserModel
          .find({ active: true })
          .sort({ email: 1 })
          .exec();
        return basicResponse(200, request.session, makeJsonResponseBody({
          total: users.length,
          offset: 0,
          count: users.length,
          items: users.map(user => UserSchema.makePublicUser(user))
        }));
      }
    };
  },

  update(Models) {
    const UserModel = Models.User as UserSchema.Model;
    const SessionModel = Models.Session as SessionSchema.Model;
    return {
      async transformRequest(request) {
        const body = request.body.tag === 'json' ? request.body.value : {};
        return {
          id: request.params.id,
          email: getString(body, 'email') || undefined,
          profile: isObject(body.profile) ? body.profile : undefined,
          acceptedTerms: isBoolean(body.acceptedTerms) ? body.acceptedTerms : undefined,
          newPassword: getString(body, 'newPassword') || undefined,
          currentPassword: getString(body, 'currentPassword') || undefined
        };
      },
      async respond(request): Promise<Response<UpdateResponseBody, Session>> {
        if (!(await permissions.updateUser(UserModel, request.session, request.body.id))) {
          return basicResponse(401, request.session, makeJsonResponseBody({
            permissions: [permissions.ERROR_MESSAGE]
          }));
        }
        const validatedBody = await validateUpdateRequestBody(UserModel, request.body, request.session);
        switch (validatedBody.tag) {
          case 'invalid':
            const invalidCode = validatedBody.value.permissions ? 401 : 400;
            return basicResponse(invalidCode, request.session, makeJsonResponseBody(validatedBody.value));
          case 'valid':
            const { user, verificationStatusHasChanged } = validatedBody.value;
            await user.save();
            // Update the session's cache of the user's email.
            let responseSession = request.session;
            if (request.body.email) {
              const session = await SessionModel.findById(request.session._id);
              if (session && session.user && session.user.id.toString() === user._id.toString()) {
                session.set('user.email', user.email);
                await session.save();
                responseSession = session.toJSON();
              }
            }
            // Notify buyers if their account status has changed.
            // Do not automatically notify Declined buyers (Program Staff will
            // email them manually).
            if (user.profile.type === UserType.Buyer && verificationStatusHasChanged && user.profile.verificationStatus !== VerificationStatus.Declined) {
              mailer.buyerStatusUpdated(user.email, user.profile.verificationStatus);
            }
            return basicResponse(200, responseSession, makeJsonResponseBody(UserSchema.makePublicUser(user)));
        }
      }
    };
  },

  delete(Models) {
    const UserModel = Models.User as UserSchema.Model;
    const SessionModel = Models.Session as SessionSchema.Model;
    return {
      async transformRequest({ body }) {
        return body;
      },
      async respond(request): Promise<Response<DeleteResponseBody, Session>> {
        const user = await UserModel.findOne({ _id: request.params.id, active: true });
        if (!user) {
          return basicResponse(404, request.session, makeJsonResponseBody(null));
        }
        if (!permissions.deleteUser(request.session, user._id.toString(), user.profile.type)) {
          return basicResponse(401, request.session, makeJsonResponseBody(null));
        }
        user.deactivatedBy = get(request.session.user, 'id');
        user.active = false;
        await user.save();
        // Send notification email.
        mailer.deactivateUser(user.email, user.profile.type);
        let session = request.session;
        // Sign out the user if they are deactivating their own account.
        // Otherwise, as is the case with Program Staff, leave them signed in.
        if (permissions.isOwnAccount(request.session, user._id.toString())) {
          session = await SessionSchema.signOut(SessionModel, request.session);
        }
        return basicResponse(200, session, makeJsonResponseBody(null));
      }
    };
  }
};

export default resource;
