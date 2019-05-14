import { AvailableModels, Session, SupportedRequestBodies } from 'back-end/lib/app/types';
import * as crud from 'back-end/lib/crud';
import * as permissions from 'back-end/lib/permissions';
import * as SessionSchema from 'back-end/lib/schemas/session';
import * as UserSchema from 'back-end/lib/schemas/user';
import { basicResponse, JsonResponseBody, makeJsonResponseBody, Response } from 'back-end/lib/server';
import { getString } from 'shared/lib';
import { CreateRequestBody, PublicSession } from 'shared/lib/resources/session';

const INVALID_CREDENTIALS_ERROR_MESSAGE = 'Your email and password combination do not match.';

type CreateResponseBody = JsonResponseBody<PublicSession | string[]>;

type ReadOneResponseBody = JsonResponseBody<PublicSession | null>;

type DeleteResponseBody = JsonResponseBody<PublicSession | null>;

type RequiredModels = 'Session' | 'User';

export type Resource = crud.Resource<SupportedRequestBodies, JsonResponseBody, AvailableModels, RequiredModels, CreateRequestBody, null, Session>;

export const resource: Resource = {

  routeNamespace: 'sessions',

  // Log in.
  create(Models) {
    const SessionModel = Models.Session as SessionSchema.Model;
    const UserModel = Models.User as UserSchema.Model;
    return {
      async transformRequest(request) {
        // TODO bad request response if body is not json
        const body = request.body.tag === 'json' ? request.body.value : {};
        return {
          email: getString(body, 'email'),
          password: getString(body, 'password')
        };
      },
      async respond(request): Promise<Response<CreateResponseBody, Session>> {
        const fail = () => basicResponse(401, request.session, makeJsonResponseBody([INVALID_CREDENTIALS_ERROR_MESSAGE]));
        if (!permissions.createSession(request.session)) { return fail(); }
        const { email, password } = request.body;
        const user = await UserModel.findOne({ email, active: true }).exec();
        if (!user) { return fail(); }
        const authenticated = await UserSchema.authenticate(user, password);
        if (!authenticated) { return fail(); }
        const session = await SessionSchema.signIn(SessionModel, UserModel, request.session, user._id);
        const publicSession = SessionSchema.makePublicSession(session);
        return basicResponse(201, session, makeJsonResponseBody(publicSession));
      }
    };
  },

  readOne() {
    return {
      async transformRequest({ body }) {
        return body;
      },
      async respond(request): Promise<Response<ReadOneResponseBody, Session>> {
        if (!permissions.readOneSession(request.session, request.params.id)) {
          return basicResponse(401, request.session, makeJsonResponseBody(null));
        } else {
          const publicSession = SessionSchema.makePublicSession(request.session);
          return basicResponse(200, request.session, makeJsonResponseBody(publicSession));
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
      async respond(request): Promise<Response<DeleteResponseBody, Session>> {
        if (!permissions.deleteSession(request.session, request.params.id)) {
          return basicResponse(401, request.session, makeJsonResponseBody(null));
        } else {
          const newSession = await SessionSchema.signOut(SessionModel, request.session);
          const publicSession = SessionSchema.makePublicSession(newSession);
          return basicResponse(200, newSession, makeJsonResponseBody(publicSession));
        }
      }
    }
  }

}

export default resource;
