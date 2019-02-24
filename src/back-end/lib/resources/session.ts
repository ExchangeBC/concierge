import * as crud from 'back-end/lib/crud';
import * as SessionSchema from 'back-end/lib/schemas/session';
import * as UserSchema from 'back-end/lib/schemas/user';
import { Set } from 'immutable';
import { getString, identityAsync } from 'shared/lib';

type CreateRequestBody = InstanceType<UserSchema.Model> | null;

type CreateResponseBody = SessionSchema.PublicSession | null;

type ReadOneResponseBody = SessionSchema.PublicSession | null;

type DeleteResponseBody = SessionSchema.PublicSession;

export type Resource = crud.Resource<SessionSchema.Model, CreateRequestBody, CreateResponseBody, ReadOneResponseBody, null, null, null, null, DeleteResponseBody, SessionSchema.PrivateSession>;

export const resource: Resource = {

  routeNamespace: 'sessions',
  model: SessionSchema.NAME,
  extraModels: Set([UserSchema.NAME]),

  // Log in.
  create(Model, ExtraModels) {
    const UserModel = ExtraModels.get(UserSchema.NAME) as UserSchema.Model;
    return {
      transformRequest: async request => {
        const email = getString(request.body, 'email');
        const password = getString(request.body, 'password');
        let body = null;
        if (!request.session.user && UserModel) {
          const user = await UserModel.findOne({ email, active: true }).exec();
          const authenticated = user ? await UserModel.authenticate(user, password) : false;
          body = authenticated ? user : null;
        }
        return {
          params: request.params,
          query: request.query,
          body
        };
      },
      async respond(request) {
        if (UserModel && request.body) {
          await SessionSchema.login(request.session, request.body._id);
          return {
            code: 200,
            headers: {},
            session: request.session,
            body: await SessionSchema.makePublicSession(request.session, UserModel)
          };
        } else {
          return {
            code: 401,
            headers: {},
            session: request.session,
            body: null
          };
        }
      }
    };
  },

  readOne(Model, ExtraModels) {
    const UserModel = ExtraModels.get(UserSchema.NAME) as UserSchema.Model;
    return {
      transformRequest: identityAsync,
      async respond(request) {
        if (request.params.id !== request.session.sessionId.toString()) {
          return {
            code: 401,
            headers: {},
            session: request.session,
            body: null
          };
        } else {
          return {
            code: 200,
            headers: {},
            session: request.session,
            body: await SessionSchema.makePublicSession(request.session, UserModel)
          };
        }
      }
    };
  },

  // Log out.
  delete(Model, ExtraModels) {
    const UserModel = ExtraModels.get(UserSchema.NAME) as UserSchema.Model;
    return {
      transformRequest: identityAsync,
      async respond(request) {
        await Model.findByIdAndDelete(request.session._id);
        const newSession = await SessionSchema.newPrivateSession(Model);
        return {
          code: 200,
          headers: {},
          session: newSession,
          body: await SessionSchema.makePublicSession(newSession, UserModel)
        };
      }
    }
  }

}

export default resource;
