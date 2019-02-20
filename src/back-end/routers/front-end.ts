import { join } from 'path';
import { FRONT_END_BUILD_DIR } from '../config';
import { FileResponseBody, HttpMethod, makeFileResponseBody, nullConfigurableRequest, Route, Router } from '../lib/server';

const FALLBACK_FILE_PATH = join(FRONT_END_BUILD_DIR, 'index.html');

const frontEndAssetRoute: Route<null, null, null, FileResponseBody, null> = {
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
        body: makeFileResponseBody(filePath, FALLBACK_FILE_PATH)
      };
    }
  }
};

const router: Router<FileResponseBody> = [ frontEndAssetRoute ];

export default router;
