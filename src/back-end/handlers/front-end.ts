import { existsSync, statSync } from 'fs';
import { join } from 'path';
import { FRONT_END_BUILD_DIR } from '../config';
import { Handler, MakeRequest, MakeResponse, Respond, respondServerError } from '../lib/server';

export const makeRequest: MakeRequest<null, null, null> = expressRequest => ({
  params: null,
  query: null,
  body: null
});

export const makeResponse: MakeResponse<null, null, null, string> = async request => {
  const headers = {};
  const filePath = join(FRONT_END_BUILD_DIR, request.path);
  if (existsSync(filePath) && statSync(filePath).isFile()) {
    // Respond with the requested file if it exists.
    return {
      code: 200,
      headers,
      body: filePath
    };
  } else {
    // Respond with index.html to handle 404s on the client-side.
    // TODO We may want to return a 404 code here in the future for SEO.
    return {
      code: 200,
      headers,
      body: join(FRONT_END_BUILD_DIR, 'index.html')
    };
  }
};

export const respond: Respond<string> = (expressResponse, response) => {
  expressResponse
    .status(response.code)
    .sendFile(response.body, (err: Error) => {
      if (err) {
        respondServerError(expressResponse, err);
      }
    });
  return expressResponse;
};

export const handler: Handler<null, null, null, string> = {
  makeRequest,
  makeResponse,
  respond
};

export default handler;
