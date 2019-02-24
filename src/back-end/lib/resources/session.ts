import * as crud from 'back-end/lib/crud';
import * as SessionSchema from 'back-end/lib/schemas/session';
import * as UserSchema from 'back-end/lib/schemas/user';
import { Set } from 'immutable';
import { getString, identityAsync } from 'shared/lib';

type CreateRequestBody = InstanceType<UserSchema.Model> | null;

type CreateResponseBody = SessionSchema.PublicSession | null;

export type Resource = crud.Resource<SessionSchema.Model, CreateRequestBody, CreateResponseBody, null, null, null, null, null, null, SessionSchema.Data>;

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
        if (UserModel) {
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
          const session = new Model({
            user: request.body._id,
            createdAt: new Date()
          });
          return {
            code: 200,
            headers: {},
            session: request.session,
            body: await SessionSchema.makePublicSession(session, UserModel)
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

  readOne(Model) {
    return {
      transformRequest: identityAsync,
      async respond(request) {
        return {
          code: 200,
          headers: {},
          session: request.session,
          body: null
        };
      }
    };
  },

  // Log out.
  delete(Model) {
    return {
      transformRequest: identityAsync,
      async respond(request) {
        return {
          code: 200,
          headers: {},
          session: request.session,
          body: null
        };
      }
    }
  }

}

export default resource;
