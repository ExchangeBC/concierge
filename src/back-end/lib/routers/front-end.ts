import { FRONT_END_BUILD_DIR } from 'back-end/config';
import { FileResponseBody, makeTextResponseBody, nullConfigurableRequest, Route, Router, TextResponseBody, tryMakeFileResponseBodyWithGzip } from 'back-end/lib/server';
import { join, resolve } from 'path';
import { HttpMethod } from 'shared/lib/types';

const FALLBACK_FILE_PATH = join(FRONT_END_BUILD_DIR, 'index.html');

const frontEndAssetRoute: Route<any, null, null, null, FileResponseBody | TextResponseBody, null, any> = {
  method: HttpMethod.Get,
  path: '*',
  handler: {
    async transformRequest(request) {
      return nullConfigurableRequest();
    },
    async respond(request) {
      const filePath = join(FRONT_END_BUILD_DIR, resolve(request.path));
      let fileResponseBody = tryMakeFileResponseBodyWithGzip(filePath);
      fileResponseBody = fileResponseBody || tryMakeFileResponseBodyWithGzip(FALLBACK_FILE_PATH);
      return {
        code: 200,
        headers: {},
        session: request.session,
        body: fileResponseBody || makeTextResponseBody('File Not Found')
      };
    }
  }
};

const router: Router<any, FileResponseBody | TextResponseBody, any> = [ frontEndAssetRoute ];

export default router;
