import * as express from 'express';
import { IncomingHttpHeaders, OutgoingHttpHeaders } from 'http';
import { Document } from 'mongoose';

export interface Request<Params, Query, Body> {
  headers: IncomingHttpHeaders;
  params: Params;
  query: Query;
  body: Body;
}

export interface Response<Body> {
  code: number;
  headers: OutgoingHttpHeaders;
  body: Body;
}

export type MakeRequest<Params, Query, Body> = (req: express.Request) => Request<Params, Query, Body>;

export type MakeResponse<ReqParams, ReqQuery, ReqBody, ResBody> = (request: Request<ReqParams, ReqQuery, ReqBody>) => Promise<Response<ResBody>>;

// TODO use type system to ensure ResB can be stringified to JSON
export function handleJson<P, Q, ReqB, ResB>(makeRequest: MakeRequest<P, Q, ReqB>, makeResponse: MakeResponse<P, Q, ReqB, ResB>): express.RequestHandler {
  return (req, res) => {
    makeResponse(makeRequest(req))
      .then(respondJson.bind(null, res))
      .catch(respondServerError.bind(null, res));
  };
}

// TODO may not need this, handleJson is probably sufficient
export function handleDocument<P, Q, ReqB, ResB extends Document>(makeRequest: MakeRequest<P, Q, ReqB>, makeResponse: MakeResponse<P, Q, ReqB, ResB>): express.RequestHandler {
  return handleJson(makeRequest, async request => {
    const response = await makeResponse(request);
    response.body = response.body.toJSON();
    return response;
  });
}

export function respondJson<Body>(res: express.Response, response: Response<Body>): express.Response {
  const { code, headers, body } = response;
  return res
    .status(code)
    .set(headers)
    .json(body);
}

export function respondNotFoundJson(res: express.Response): express.Response {
  return res.status(404).json({});
}

export function respondServerError<Body>(res: express.Response, error: Error): express.Response {
  return res
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
/*type Middleware<ReqBody> = (req: Request<ReqBody>) => Promise<Request<ReqBody>>;

type Handler<ReqBody, ResBody> = (req: Request<ReqBody>) => Promise<Response<ResBody>>;

function handleError(res: express.Response, error: Error): void {
  res
    .status(500)
    .json({
      message: error.message,
      stack: error.stack,
      raw: error.toString()
    });
}

function handle<ReqBody, ResBody>(middlewares: Array<Middleware<ReqBody>>, handler: Handler<ReqBody, ResBody>): express.RequestHandler {
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
