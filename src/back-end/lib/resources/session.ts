import { AvailableModels, SupportedRequestBodies } from 'back-end/lib/app';
import * as crud from 'back-end/lib/crud';
import * as permissions from 'back-end/lib/permissions';
import * as SessionSchema from 'back-end/lib/schemas/session';
import * as UserSchema from 'back-end/lib/schemas/user';
import { basicResponse, JsonResponseBody, makeJsonResponseBody, Response } from 'back-end/lib/server';
import { getString } from 'shared/lib';

type CreateRequestBody = InstanceType<UserSchema.Model> | null;

type CreateResponseBody = JsonResponseBody<SessionSchema.AppSession | string[]>;

type ReadOneResponseBody = JsonResponseBody<SessionSchema.AppSession | null>;

type DeleteResponseBody = JsonResponseBody<SessionSchema.AppSession | null>;

type RequiredModels = 'Session' | 'User';

export type Resource = crud.Resource<SupportedRequestBodies, JsonResponseBody, AvailableModels, RequiredModels, CreateRequestBody, null, SessionSchema.AppSession>;

export const resource: Resource = {

  routeNamespace: 'sessions',

  // Log in.
  create(Models) {
    const SessionModel = Models.Session as SessionSchema.Model;
    const UserModel = Models.User as UserSchema.Model;
    return {
      async transformRequest(request) {
        if (!permissions.createSession(request.session)) { return null; }
        // TODO bad request response if body is not json
        const body = request.body.tag === 'json' ? request.body.value : {};
        const email = getString(body, 'email');
        const password = getString(body, 'password');
        const user = await UserModel.findOne({ email, active: true }).exec();
        const authenticated = user ? await UserSchema.authenticate(user, password) : false;
        return authenticated ? user : null;
      },
      async respond(request): Promise<Response<CreateResponseBody, SessionSchema.AppSession>> {
        if (request.body) {
          const session = await SessionSchema.signIn(SessionModel, UserModel, request.session, request.body._id);
          return basicResponse(201, session, makeJsonResponseBody(session));
        } else {
          return basicResponse(401, request.session, makeJsonResponseBody(['Your email and password combination do not match.']));
        }
      }
    };
  },

  readOne() {
    return {
      async transformRequest({ body }) {
        return body;
      },
      async respond(request): Promise<Response<ReadOneResponseBody, SessionSchema.AppSession>> {
        if (!permissions.readOneSession(request.session, request.params.id)) {
          return basicResponse(401, request.session, makeJsonResponseBody(null));
        } else {
          return basicResponse(200, request.session, makeJsonResponseBody(request.session));
        }
      }
    };
  },

  // Log out.
  delete(Models) {
    const SessionModel = Models.Session as SessionSchema.Model;
    return {
      async transformRequest({ body }) {
        return body;
      },
      async respond(request): Promise<Response<DeleteResponseBody, SessionSchema.AppSession>> {
        if (!permissions.deleteSession(request.session, request.params.id)) {
          return basicResponse(401, request.session, makeJsonResponseBody(null));
        } else {
          const newSession = await SessionSchema.signOut(SessionModel, request.session);
          return basicResponse(200, newSession, makeJsonResponseBody(newSession));
        }
      }
    }
  }

}

export default resource;
