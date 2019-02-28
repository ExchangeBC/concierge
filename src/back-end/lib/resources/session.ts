import { AvailableModels } from 'back-end/lib/app';
import * as crud from 'back-end/lib/crud';
import * as permissions from 'back-end/lib/permissions';
import * as SessionSchema from 'back-end/lib/schemas/session';
import * as UserSchema from 'back-end/lib/schemas/user';
import { basicResponse, mapRequestBody } from 'back-end/lib/server';
import { getString, identityAsync } from 'shared/lib';

type CreateRequestBody = InstanceType<UserSchema.Model> | null;

type CreateResponseBody = SessionSchema.AppSession | string[];

type ReadOneResponseBody = SessionSchema.AppSession | null;

type DeleteResponseBody = SessionSchema.AppSession | null;

type RequiredModels = 'Session' | 'User';

export type Resource = crud.Resource<AvailableModels, RequiredModels, CreateRequestBody, CreateResponseBody, ReadOneResponseBody, null, null, null, null, DeleteResponseBody, SessionSchema.AppSession>;

export const resource: Resource = {

  routeNamespace: 'sessions',

  // Log in.
  create(Models) {
    const SessionModel = Models.Session as SessionSchema.Model;
    const UserModel = Models.User as UserSchema.Model;
    return {
      transformRequest: async request => {
        if (!permissions.createSession(request.session)) {
          return mapRequestBody(request, null);
        } else {
          const email = getString(request.body, 'email');
          const password = getString(request.body, 'password');
          const user = await UserModel.findOne({ email, active: true }).exec();
          const authenticated = user ? await UserSchema.authenticate(user, password) : false;
          const body = authenticated ? user : null;
          return mapRequestBody(request, body);
        }
      },
      async respond(request) {
        if (request.body) {
          const session = await SessionSchema.signIn(SessionModel, UserModel, request.session, request.body._id);
          return basicResponse(201, session, session);
        } else {
          return basicResponse(401, request.session, ['Your email and password combination do not match.']);
        }
      }
    };
  },

  readOne() {
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
  delete(Models) {
    const SessionModel = Models.Session as SessionSchema.Model;
    return {
      transformRequest: identityAsync,
      async respond(request) {
        if (!permissions.deleteSession(request.session, request.params.id)) {
          return basicResponse(401, request.session, null);
        } else {
          const newSession = await SessionSchema.logout(SessionModel, request.session);
          return basicResponse(200, newSession, newSession);
        }
      }
    }
  }

}

export default resource;
