import * as crud from 'back-end/lib/crud';
import * as SessionSchema from 'back-end/schemas/session';
import { identityAsync } from 'shared/lib';

export type Resource = crud.Resource<SessionSchema.Data, null, null, null, null, null, null, null, null>;

export const resource: Resource = {

  routeNamespace: 'sessions',
  model: SessionSchema.NAME,

  // Log in.
  readOne(Model) {
    return {
      transformRequest: identityAsync,
      async respond(request) {
        return {
          code: 200,
          headers: {},
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
          body: null
        };
      }
    }
  }

}

export default resource;
