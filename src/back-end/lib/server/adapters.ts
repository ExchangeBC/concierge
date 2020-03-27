import { COOKIE_SECRET, ENV, TMP_DIR } from 'back-end/config';
import { makeDomainLogger } from 'back-end/lib/logger';
import { console as consoleAdapter } from 'back-end/lib/logger/adapters';
import { ErrorResponseBody, FileRequestBody, FileResponseBody, HtmlResponseBody, JsonRequestBody, JsonResponseBody, makeErrorResponseBody, makeFileRequestBody, makeJsonRequestBody, parseHttpMethod, parseSessionId, Request, Response, Route, Router, SessionIdToSession, SessionToSessionId, TextResponseBody } from 'back-end/lib/server';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import expressLib from 'express';
import { createWriteStream, existsSync, unlinkSync } from 'fs';
import { IncomingHttpHeaders } from 'http';
import { castArray } from 'lodash';
import mongoose from 'mongoose';
import multiparty from 'multiparty';
import * as path from 'path';
import { parseJsonSafely } from 'shared/lib';
import { HttpMethod } from 'shared/lib/types';

const SESSION_COOKIE_NAME = 'sid';

export interface AdapterRunParams<SupportedRequestBodies, SupportedResponseBodies, FileUploadMetadata, Session> {
  router: Router<SupportedRequestBodies, SupportedResponseBodies, Session>;
  sessionIdToSession: SessionIdToSession<Session>;
  sessionToSessionId: SessionToSessionId<Session>;
  host: string;
  port: number;
  maxMultipartFilesSize: number;
  parseFileUploadMetadata(raw: any): FileUploadMetadata;
}

export type Adapter<App, SupportedRequestBodies, SupportedResponseBodies, FileUploadMetadata, Session> = (params: AdapterRunParams<SupportedRequestBodies, SupportedResponseBodies, FileUploadMetadata, Session>) => App;

export type ExpressRequestBodies<FileUploadMetadata> = JsonRequestBody | FileRequestBody<FileUploadMetadata>;

export type ExpressResponseBodies = HtmlResponseBody | JsonResponseBody | FileResponseBody | TextResponseBody | ErrorResponseBody;

export type ExpressAdapter<Session, FileUploadMetadata> = Adapter<expressLib.Application, ExpressRequestBodies<FileUploadMetadata>, ExpressResponseBodies, FileUploadMetadata, Session>;

function incomingHeaderMatches(headers: IncomingHttpHeaders, header: string, value: string): boolean {
  header = castArray(headers[header] || '').join(' ');
  return !!header.match(value);
}

/**
 * Use `multiparty` to parse a HTTP request with a multipart body.
 * It currently only supports multipart bodies with these fields:
 *
 * `file` must be the file you want to upload.
 *
 * `name` must be the user-defined name of the file.
 *
 * `metadata` is an optional field containing a JSON string
 */

function parseMultipartRequest<FileUploadMetadata>(maxSize: number, parseFileUploadMetadata: (raw: any) => FileUploadMetadata, expressReq: expressLib.Request): Promise<FileRequestBody<FileUploadMetadata>> {
  return new Promise((resolve, reject) => {
    // Reject the promise if the content length is too large.
    const contentLength = expressReq.get('content-length') || maxSize + 1;
    if (contentLength > maxSize) {
      return reject(new Error('Content-Length is too large.'));
    }
    // Parse the request.
    let filePath: string | undefined;
    let metadata = '';
    let fileName = '';
    const form = new multiparty.Form();
    // Listen for files and fields.
    // We only want to receive one file, so we disregard all other files.
    // We only want the (optional) metadata field, so we disregard all other fields.
    form.on('part', part => {
      part.on('error', error => reject(error));
      // We expect the file's field to have the name `file`.
      if (part.name === 'file' && part.filename && !filePath) {
        // We only want to receive one file.
        const tmpPath = path.join(TMP_DIR, new mongoose.Types.ObjectId().toString());
        part.pipe(createWriteStream(tmpPath));
        filePath = tmpPath;
      } else if (part.name === 'metadata' && !part.filename && !metadata) {
        part.setEncoding('utf8');
        part.on('data', chunk => metadata += chunk);
        // No need to listen to 'end' event as the multiparty form won't end until the
        // entire request body has been processed.
      } else if (part.name === 'name' && !part.filename && !metadata) {
        part.setEncoding('utf8');
        part.on('data', chunk => fileName += chunk);
        // No need to listen to 'end' event as the multiparty form won't end until the
        // entire request body has been processed.
      } else {
        // Ignore all other files and fields.
        part.resume();
      }
    });
    // Handle errors.
    form.on('error', error => reject(error));
    // Resolve the promise once the request has finished parsing.
    form.on('close', () => {
      if (filePath && metadata && fileName) {
        const jsonMetadata = parseJsonSafely(metadata);
        switch (jsonMetadata.tag) {
          case 'valid':
            resolve(makeFileRequestBody({
              name: fileName,
              path: filePath,
              metadata: parseFileUploadMetadata(jsonMetadata.value)
            }));
            break;
          case 'invalid':
            reject(new Error('Invalid `metadata` field.'));
            break;
        }
      } else if (filePath && fileName) {
        resolve(makeFileRequestBody({
          name: fileName,
          path: filePath
        }));
      } else {
        reject(new Error('No file uploaded'));
      }
    });
    // Parse the form.
    form.parse(expressReq);
  });
}

export function express<Session, FileUploadMetadata>(): ExpressAdapter<Session, FileUploadMetadata> {
  const logger = makeDomainLogger(consoleAdapter, 'adapter:express');

  return ({ router, sessionIdToSession, sessionToSessionId, host, port, maxMultipartFilesSize, parseFileUploadMetadata }) => {
    function respond(response: Response<ExpressResponseBodies, Session>, expressRes: expressLib.Response): void {
      expressRes
        .status(response.code)
        .set(response.headers);
      // Manage the session ID cookie.
      const setSessionId = (id: string) => expressRes.cookie(SESSION_COOKIE_NAME, id, {
        signed: true,
        secure: ENV !== 'development'
      });
      const sessionId = sessionToSessionId(response.session)
      setSessionId(sessionId.toString());
      // TODO make switch statement more type-safe.
      switch (response.body.tag) {
        case 'error':
        case 'json':
          expressRes.json(response.body.value);
          break;
        case 'file':
          const file = response.body.value;
          expressRes.set('Content-Type', file.contentType)
          if (file.contentEncoding) {
            expressRes.set('Content-Encoding', file.contentEncoding)
          }
          if (file.contentDisposition) {
            expressRes.set('Content-Disposition', file.contentDisposition)
          }
          expressRes.send(response.body.value.buffer);
          break;
        case 'text':
          expressRes
            .set('Content-Type', 'text/plain')
            .send(response.body.value);
        case 'html':
          expressRes
            .set('Content-Type', 'text/html')
            .send(response.body.value);
          break;
      }
    }

    function makeExpressRequestHandler(route: Route<ExpressRequestBodies<FileUploadMetadata>, any, ExpressResponseBodies, any, Session>): expressLib.RequestHandler {
      function asyncHandler(fn: (request: expressLib.Request, expressRes: expressLib.Response, next: expressLib.NextFunction) => Promise<void>): expressLib.RequestHandler {
        return (expressReq, expressRes, next) => {
          fn(expressReq, expressRes, next)
            .catch(error => {
              const jsonError = makeErrorResponseBody(error).value;
              // Respond with a 500 if an error occurs.
              logger.error('unhandled error', jsonError);
              expressRes
                .status(500)
                .json(jsonError);
            });
        };
      }
      return asyncHandler(async (expressReq, expressRes, next) => {
        // Handle the request if it has the correct HTTP method.
        // Default to `Any` to make following logic simpler.
        const method = parseHttpMethod(expressReq.method) || HttpMethod.Any;
        if (method !== route.method) { next(); return; }
        // Create the session.
        const sessionId = parseSessionId(expressReq.signedCookies[SESSION_COOKIE_NAME]);
        const session = await sessionIdToSession(sessionId);
        // Set up the request body.
        const headers = expressReq.headers;
        let body: ExpressRequestBodies<FileUploadMetadata> = makeJsonRequestBody(null);
        if (method !== HttpMethod.Get && incomingHeaderMatches(headers, 'content-type', 'application/json')) {
          body = makeJsonRequestBody(expressReq.body);
        } else if (method !== HttpMethod.Get && incomingHeaderMatches(headers, 'content-type', 'multipart')) {
          // TODO handle file size error.
          body = await parseMultipartRequest(maxMultipartFilesSize, parseFileUploadMetadata, expressReq);
        }
        // Create the initial request.
        const requestId = new mongoose.Types.ObjectId();
        let request: Request<ExpressRequestBodies<FileUploadMetadata>, Session> = {
          id: requestId,
          path: expressReq.path,
          method,
          headers,
          session,
          logger: makeDomainLogger(consoleAdapter, `request:${requestId}`),
          params: expressReq.params,
          query: expressReq.query,
          body
        };
        // Transform the request according to the route handler.
        const transformRequest = route.handler.transformRequest;
        if (transformRequest) {
          request = {
            ...request,
            body: await transformRequest(request)
          };
        }
        // Run the before hook if specified.
        const hookState = route.hook ? await route.hook.before(request) : null;
        // Respond to the request using internal types.
        const response = await route.handler.respond(request);
        // Delete temporary file if it exists.
        if (body.tag === 'file' && existsSync(body.value.path)) {
          unlinkSync(body.value.path);
        }
        // Run the after hook if specified.
        // Note: we run the after hook after our business logic has completed,
        // not once the express framework sends the response.
        if (route.hook && route.hook.after) { await route.hook.after(hookState, request, response); }
        // Respond over HTTP.
        respond(response, expressRes);
      });
    }

    // Set up the express app.
    const app = expressLib();
    // Parse JSON request bodies when provided.
    app.use(bodyParser.json({
      type: 'application/json'
    }));
    // Sign and parse cookies.
    app.use(cookieParser(COOKIE_SECRET));

    // Mount each route to the Express application.
    router.forEach(route => {
      app.all(route.path, makeExpressRequestHandler(route));
    });

    // Listen for incoming connections.
    app.listen(port, host);

    return app;
  };

};
