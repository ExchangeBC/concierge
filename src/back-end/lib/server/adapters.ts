import { makeDomainLogger } from 'back-end/lib/logger';
import { console as consoleAdapter } from 'back-end/lib/logger/adapters';
import { ErrorResponseBody, FileResponseBody, HttpMethod, JsonResponseBody, makeErrorResponseBody, parseHttpMethod, Request, Response, Route, Router, TextResponseBody } from 'back-end/lib/server';
import bodyParser from 'body-parser';
import expressLib from 'express';
import { assign } from 'lodash';
import mongoose from 'mongoose';

export type InitialRequest = Request<object, object, any>;

export interface Adapter<App, SupportedResponseBody> {
  run(router: Router<SupportedResponseBody>, port: number): App;
}

export type ExpressResponseBody = JsonResponseBody | FileResponseBody | TextResponseBody | ErrorResponseBody;

export const express: Adapter<expressLib.Application, ExpressResponseBody> = {

  run(router, port) {
    function respond(response: Response<ExpressResponseBody>, expressRes: expressLib.Response): void {
      expressRes
        .status(response.code)
        .set(response.headers);
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

    function makeExpressRequestHandler(route: Route<any, any, any, ExpressResponseBody, any>): expressLib.RequestHandler {
      function asyncHandler(fn: (request: expressLib.Request, expressRes: expressLib.Response, next: expressLib.NextFunction) => Promise<void>): expressLib.RequestHandler {
        return (expressReq, expressRes, next) => {
          fn(expressReq, expressRes, next)
            .catch(err => {
              const body = makeErrorResponseBody(err);
              // request.logger.error('error', body);
              // Respond with a 500 if an error occurs.
              respond({
                code: 500,
                headers: {},
                body
              }, expressRes);
            });
        };
      }
      return asyncHandler(async (expressReq, expressRes, next) => {
          // Handle the request if it has the correct HTTP method.
          const method = parseHttpMethod(expressReq.method);
          if (method !== HttpMethod.Any && method !== route.method) { next(); return; }
          // Create the initial request.
          const requestId = new mongoose.Types.ObjectId();
          let request: InitialRequest = {
            id: requestId,
            path: expressReq.path,
            method,
            headers: expressReq.headers,
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
    // TODO remove bodyParser and use TransformRequest functions
    app.use(bodyParser.json({
      type: 'application/json'
    }));

    // Mount each route to the Express application.
    router.forEach(route => {
      app.all(route.path, makeExpressRequestHandler(route));
    });

    // Listen for incoming connections.
    app.listen(port);

    return app;
  }

};
