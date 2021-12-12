import { makeTextResponseBody, Route, Router, TextResponseBody } from 'back-end/lib/server';
import { HttpMethod } from 'shared/lib/types';

const statusRoute: Route<any, null, TextResponseBody, null, any> = {
  method: HttpMethod.Get,
  path: '/status',
  handler: {
    async transformRequest() {
      return null;
    },
    async respond(request) {
      return {
        code: 200,
        headers: {},
        session: request.session,
        body: makeTextResponseBody('OK')
      };
    }
  }
};

const router: Router<any, TextResponseBody, any> = [statusRoute];

export default router;
