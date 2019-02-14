import * as express from 'express';
import { IncomingHttpHeaders, OutgoingHttpHeaders } from 'http';
import { assign } from 'lodash';

export interface ConfigurableRequest<Params, Query, Body> {
  params: Params;
  query: Query;
  body: Body;
}

export interface Request<Params, Query, Body> extends ConfigurableRequest<Params, Query, Body> {
  path: string,
  headers: IncomingHttpHeaders;
}

export interface Response<Body> {
  code: number;
  headers: OutgoingHttpHeaders;
  body: Body;
}

export type MakeRequest<Params, Query, Body> = (req: express.Request) => ConfigurableRequest<Params, Query, Body>;

// TODO use this to type middleware
export type TransformRequest<RPA, RQA, RBA, RPB, RQB, RBB> = (request: Request<RPA, RQA, RBA>) => Promise<ConfigurableRequest<RPB, RQB, RBB>>;

export type MakeResponse<ReqParams, ReqQuery, ReqBody, ResBody> = (request: Request<ReqParams, ReqQuery, ReqBody>) => Promise<Response<ResBody>>;

export type Respond<Body> = (expressResponse: express.Response, response: Response<Body>) => express.Response;

export interface Handler<ReqParams, ReqQuery, ReqBody, ResBody> {
  makeRequest: MakeRequest<ReqParams, ReqQuery, ReqBody>;
  makeResponse: MakeResponse<ReqParams, ReqQuery, ReqBody, ResBody>;
  respond: Respond<ResBody>;
}

export function makeHandler<RP, RQ, ReqB, ResB>(handler: Handler<RP, RQ, ReqB, ResB>): express.RequestHandler {
  return (req, res) => {
    const request = assign(handler.makeRequest(req), {
      path: req.path,
      headers: req.headers
    });
    handler.makeResponse(request)
      .then(handler.respond.bind(null, res))
      .catch(respondServerError.bind(null, res));
  };
}

// TODO Use type system to ensure ResB can be stringified as JSON.
export function makeHandlerJson<P, Q, ReqB, ResB>(makeRequest: MakeRequest<P, Q, ReqB>, makeResponse: MakeResponse<P, Q, ReqB, ResB>): express.RequestHandler {
  return makeHandler({
    makeRequest,
    makeResponse,
    respond: respondJson
  });
}

export function respondJson<Body>(expressResponse: express.Response, response: Response<Body>): express.Response {
  const { code, headers, body } = response;
  return expressResponse
    .status(code)
    .set(headers)
    .json(body);
}

export function respondNotFoundJson(expressResponse: express.Response): express.Response {
  return expressResponse.status(404).json({});
}

export function respondServerError<Body>(expressResponse: express.Response, error: Error): express.Response {
  return expressResponse
    .status(500)
    .json({
      message: error.message,
      stack: error.stack,
      raw: error.toString()
    });
}

///////////
// NOTES //
///////////

// Below is a WIP for type-safe, lower-level implementation.
/*type TransformRequest<ReqBody> = (req: Request<ReqBody>) => Promise<Request<ReqBody>>;

type MakeResponse<ReqBody, ResBody> = (req: Request<ReqBody>) => Promise<Response<ResBody>>;

function handleError(expressResponse: express.Response, error: Error): void {
  res
    .status(500)
    .json({
      message: error.message,
      stack: error.stack,
      raw: error.toString()
    });
}

function handle<ReqBody, ResBody>(middlewaexpressResponse: Array<TransformRequest<ReqBody>>, handler: MakeResponse<ReqBody, ResBody>): express.RequestHandler {
  return (req, res, next) => {
    const promise = middlewares.reduce(
      (acc, m) => acc.then(request => m(request)),
      // Initial request
      Promise.resolve({
        headers: req.headers,
        body: req.body
      })
    );
    promise
      .then(request => handler(request))
      .then(response => {
        res
          .status(response.code)
          .set(response.headers)
          .send(response.body);
      })
      .catch(error => handleError(res, error));
  };
}*/
