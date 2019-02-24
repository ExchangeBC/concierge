import * as crud from 'back-end/lib/crud';
import * as permissions from 'back-end/lib/permissions';
import * as SessionSchema from 'back-end/lib/schemas/session';
import * as UserSchema from 'back-end/lib/schemas/user';
import { basicResponse, mapRequestBody } from 'back-end/lib/server';
import { Set } from 'immutable';
import { getString, identityAsync } from 'shared/lib';

type CreateRequestBody = InstanceType<UserSchema.Model> | null;

type CreateResponseBody = SessionSchema.AppSession | null;

type ReadOneResponseBody = SessionSchema.AppSession | null;

type DeleteResponseBody = SessionSchema.AppSession | null;

export type Resource = crud.Resource<SessionSchema.Model, CreateRequestBody, CreateResponseBody, ReadOneResponseBody, null, null, null, null, DeleteResponseBody, SessionSchema.AppSession>;

export const resource: Resource = {

  routeNamespace: 'sessions',
  model: SessionSchema.NAME,
  extraModels: Set([UserSchema.NAME]),

  // Log in.
  create(Model, ExtraModels) {
    const UserModel = ExtraModels.get(UserSchema.NAME) as UserSchema.Model;
    return {
      transformRequest: async request => {
        if (!permissions.createSession(request.session)) {
          return mapRequestBody(request, null);
        } else {
          const email = getString(request.body, 'email');
          const password = getString(request.body, 'password');
          const user = await UserModel.findOne({ email, active: true }).exec();
          const authenticated = user ? await UserModel.authenticate(user, password) : false;
          const body = authenticated ? user : null;
          return mapRequestBody(request, body);
        }
      },
      async respond(request) {
        if (request.body) {
          const session = await SessionSchema.login(Model, UserModel, request.session, request.body._id);
          return basicResponse(200, session, session);
        } else {
          return basicResponse(401, request.session, null);
        }
      }
    };
  },

  readOne(Model) {
    return {
      transformRequest: identityAsync,
      async respond(request) {
        if (!permissions.readOneSession(request.session, request.params.id)) {
          return basicResponse(401, request.session, null);
        } else {
          return basicResponse(200, request.session, request.session);
        }
      }
    };
  },

  // Log out.
  delete(Model) {
    return {
      transformRequest: identityAsync,
      async respond(request) {
        if (!permissions.deleteSession(request.session, request.params.id)) {
          return basicResponse(401, request.session, null);
        } else {
          const newSession = await SessionSchema.logout(Model, request.session);
          return basicResponse(200, newSession, newSession);
        }
      }
    }
  }

}

export default resource;
