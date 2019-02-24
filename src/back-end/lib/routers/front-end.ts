import { FRONT_END_BUILD_DIR } from 'back-end/config';
import { FileResponseBody, HttpMethod, makeFileResponseBody, nullConfigurableRequest, Route, Router } from 'back-end/lib/server';
import { join } from 'path';

const FALLBACK_FILE_PATH = join(FRONT_END_BUILD_DIR, 'index.html');

const frontEndAssetRoute: Route<null, null, null, FileResponseBody, null, any> = {
  method: HttpMethod.Get,
  path: '*',
  handler: {
    async transformRequest(request) {
      return nullConfigurableRequest();
    },
    async respond(request) {
      const filePath = join(FRONT_END_BUILD_DIR, request.path);
      return {
        code: 200,
        headers: {},
        session: request.session,
        body: makeFileResponseBody(filePath, FALLBACK_FILE_PATH)
      };
    }
  }
};

const router: Router<FileResponseBody, any> = [ frontEndAssetRoute ];

export default router;
