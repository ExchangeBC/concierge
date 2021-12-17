import { makeJsonResponseBody, Route, Router, JsonResponseBody } from 'back-end/lib/server';
import { HttpMethod, FeatureFlags } from 'shared/lib/types';
import { HIDE_VENDOR_IDEAS, FORCE_SHOW_VENDOR_IDEAS } from 'back-end/config';

const featureFlagRoute: Route<any, null, JsonResponseBody, null, any> = {
  method: HttpMethod.Get,
  path: '/flags',
  handler: {
    async transformRequest() {
      return null;
    },
    async respond(request) {
      const userEmail = (request.session.user && request.session.user.email) || '';
      const responseBody = {
        vendorIdeasEnabled: !HIDE_VENDOR_IDEAS || FORCE_SHOW_VENDOR_IDEAS.includes(userEmail)
      } as FeatureFlags;
      return {
        code: 200,
        headers: {},
        session: request.session,
        body: makeJsonResponseBody(responseBody)
      };
    }
  }
};

const router: Router<any, JsonResponseBody, any> = [featureFlagRoute];

export default router;
