import { COOKIE_SECRET } from 'back-end/config';
import { makeDomainLogger } from 'back-end/lib/logger';
import { console as consoleAdapter } from 'back-end/lib/logger/adapters';
import { ErrorResponseBody, FileResponseBody, JsonRequestBody, JsonResponseBody, makeErrorResponseBody, parseHttpMethod, parseSessionId, Request, Response, Route, Router, SessionIdToSession, SessionToSessionId, TextResponseBody } from 'back-end/lib/server';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import expressLib from 'express';
import { assign } from 'lodash';
import mongoose from 'mongoose';
import { HttpMethod } from 'shared/lib/types';

// tslint:disable no-console

const SESSION_COOKIE_NAME = 'sid';

export type InitialRequest<Session> = Request<object, object, any, Session>;

export interface AdapterRunParams<SupportedResponseBodies, Session> {
  router: Router<SupportedResponseBodies, Session>;
  sessionIdToSession: SessionIdToSession<Session>;
  sessionToSessionId: SessionToSessionId<Session>;
  host: string;
  port: number;
}

export type Adapter<App, SupportedResponseBodies, Session> = (params: AdapterRunParams<SupportedResponseBodies, Session>) => App;

export type ExpressRequestBodies = JsonRequestBody;

export type ExpressResponseBodies = JsonResponseBody | FileResponseBody | TextResponseBody | ErrorResponseBody;

export type ExpressAdapter<Session> = Adapter<expressLib.Application, ExpressResponseBodies, Session>;

export function express<Session>(): ExpressAdapter<Session> {

  return ({ router, sessionIdToSession, sessionToSessionId, host, port }) => {
    function respond(response: Response<ExpressResponseBodies, Session>, expressRes: expressLib.Response): void {
      expressRes
        .status(response.code)
        .set(response.headers);
      // Manage the session ID cookie.
      const setSessionId = (id: string) => expressRes.cookie(SESSION_COOKIE_NAME, id, { signed: true });
      const sessionId = sessionToSessionId(response.session)
      setSessionId(sessionId.toString());
      switch (response.body.tag) {
        case 'json':
          expressRes.json(response.body.value);
          break;
        case 'file':
          expressRes
            .set('Content-Type', response.body.value.contentType)
            .set('Content-Encoding', response.body.value.contentEncoding)
            .send(response.body.value.buffer);
          break;
        case 'text':
          expressRes
            .set('Content-Type', 'text/plain')
            .send(response.body.value);
          break;
        case 'error':
          expressRes.json({
            message: response.body.value.message,
            stack: response.body.value.stack,
            raw: response.body.value.toString()
          });
          break;
      }
    }

    function makeExpressRequestHandler(route: Route<any, any, any, ExpressResponseBodies, any, Session>): expressLib.RequestHandler {
      function asyncHandler(fn: (request: expressLib.Request, expressRes: expressLib.Response, next: expressLib.NextFunction) => Promise<void>): expressLib.RequestHandler {
        return (expressReq, expressRes, next) => {
          fn(expressReq, expressRes, next)
            .catch(err => {
              const body = makeErrorResponseBody(err);
              // Respond with a 500 if an error occurs.
              console.error(err);
              expressRes
                .status(500)
                .json(body.value);
            });
        };
      }
      return asyncHandler(async (expressReq, expressRes, next) => {
        // Handle the request if it has the correct HTTP method.
        const method = parseHttpMethod(expressReq.method);
        if (method !== HttpMethod.Any && method !== route.method) { next(); return; }
        // Create the session.
        const sessionId = parseSessionId(expressReq.signedCookies[SESSION_COOKIE_NAME]);
        const session = await sessionIdToSession(sessionId);
        // Create the initial request.
        const requestId = new mongoose.Types.ObjectId();
        let request: InitialRequest<Session> = {
          id: requestId,
          path: expressReq.path,
          method,
          headers: expressReq.headers,
          session,
          logger: makeDomainLogger(consoleAdapter, `request:${requestId}`),
          params: expressReq.params,
          query: expressReq.query,
          body: expressReq.body
        };
        // Transform the request according to the route handler.
        const transformRequest = route.handler.transformRequest;
        if (transformRequest) {
          request = assign(request, await transformRequest(request));
        }
        // Run the before hook if specified.
        const hookState = route.hook ? await route.hook.before(request) : null;
        // Respond to the request using internal types.
        const response = await route.handler.respond(request);
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
