import { COOKIE_SECRET } from 'back-end/config';
import { makeDomainLogger } from 'back-end/lib/logger';
import { console as consoleAdapter } from 'back-end/lib/logger/adapters';
import { ErrorResponseBody, FileResponseBody, JsonResponseBody, makeErrorResponseBody, parseHttpMethod, parseSessionId, Request, Response, Route, Router, SessionIdToSession, SessionToSessionId, TextResponseBody } from 'back-end/lib/server';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import expressLib from 'express';
import { assign } from 'lodash';
import mongoose from 'mongoose';
import { HttpMethod } from 'shared/lib/types';

// tslint:disable no-console

const SESSION_COOKIE_NAME = 'sid';

export type InitialRequest<Session> = Request<object, object, any, Session>;

export interface AdapterRunParams<SupportedResponseBody, Foo> {
  router: Router<SupportedResponseBody, Foo>;
  sessionIdToSession: SessionIdToSession<Foo>;
  sessionToSessionId: SessionToSessionId<Foo>;
  port: number;
}

export type Adapter<App, SupportedResponseBody, Session> = (params: AdapterRunParams<SupportedResponseBody, Session>) => App;

export type ExpressResponseBody = JsonResponseBody | FileResponseBody | TextResponseBody | ErrorResponseBody;

export type ExpressAdapter<Session> = Adapter<expressLib.Application, ExpressResponseBody, Session>;

export function express<Session>(): ExpressAdapter<Session> {

  return ({ router, sessionIdToSession, sessionToSessionId, port }) => {
    function respond(response: Response<ExpressResponseBody, Session>, expressRes: expressLib.Response): void {
      expressRes
        .status(response.code)
        .set(response.headers);
      // Manage the session ID cookie.
      const setSessionId = (id: string) => expressRes.cookie(SESSION_COOKIE_NAME, id, { signed: true });
      const sessionId = sessionToSessionId(response.session)
      setSessionId(sessionId.toString());
      // TODO change to switch statement for better type-checking
      if (response.body.tag === 'json') {
        expressRes.json(response.body.value);
      } else if (response.body.tag === 'file') {
        // TODO better null file handling.
        expressRes
          .set('Content-Type', response.body.value ? response.body.value.contentType : 'text/plain')
          .send(response.body.value ? response.body.value.buffer.toString('utf8') : 'Not Found');
      } else if (response.body.tag === 'text') {
        expressRes
          .set('Content-Type', 'text/plain')
          .send(response.body.value);
      } else if (response.body.tag === 'error') {
        expressRes.json({
          message: response.body.value.message,
          stack: response.body.value.stack,
          raw: response.body.value.toString()
        });
      }
    }

    function makeExpressRequestHandler(route: Route<any, any, any, ExpressResponseBody, any, Session>): expressLib.RequestHandler {
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
    app.listen(port);

    return app;
  };

};
