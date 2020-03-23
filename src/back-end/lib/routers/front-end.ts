import { FRONT_END_BUILD_DIR } from 'back-end/config';
import { FileResponseBody, makeTextResponseBody, Response, Router, TextResponseBody, tryMakeFileResponseBodyWithGzip } from 'back-end/lib/server';
import * as Bowser from 'bowser';
import { isArray } from 'lodash';
import { join, resolve } from 'path';
import { HttpMethod } from 'shared/lib/types';

function isValidBrowser(userAgent: string): boolean {
  const parsed = Bowser.parse(userAgent);
  return parsed.browser.name !== 'Internet Explorer';
}

function coerceHeaderToString(header: string | string[] | undefined): string {
  if (isArray(header)) {
    return header[0] || '';
  } else if (header) {
    return header;
  } else {
    return '';
  }
}

const ALWAYS_ALLOWED_FILES = /\.(css|js|svg|png|jpg|ico|woff|woff2|md|txt)$/;

function makeRouter(fallbackHtmlFile: 'index.html' | 'downtime.html'): Router<any, FileResponseBody | TextResponseBody, any> {
  const fallbackFilePath = join(FRONT_END_BUILD_DIR, fallbackHtmlFile);
  return [{
    method: HttpMethod.Get,
    path: '*',
    handler: {
      async transformRequest(request) {
        return null;
      },
      async respond(request): Promise<Response<FileResponseBody | TextResponseBody, unknown>> {
        const fileResponseBody = (() => {
          const filePath = join(FRONT_END_BUILD_DIR, resolve(request.path));
          const isSupportedBrowser = isValidBrowser(coerceHeaderToString(request.headers['user-agent']));
          if (isSupportedBrowser || filePath.match(ALWAYS_ALLOWED_FILES)) {
            // Browser is supported by front-end, or user is requesting CSS file.
            return tryMakeFileResponseBodyWithGzip(filePath)
                || tryMakeFileResponseBodyWithGzip(fallbackFilePath);
          } else {
            // Otherwise, indicate that browser is unsupported.
            return tryMakeFileResponseBodyWithGzip(join(FRONT_END_BUILD_DIR, 'unsupported-browser.html'));
          }
        })();
        return {
          code: 200,
          headers: {},
          session: request.session,
          body: fileResponseBody || makeTextResponseBody('File Not Found')
        };
      }
    }
  }];
}

export default makeRouter;
