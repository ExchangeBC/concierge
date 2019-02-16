import * as express from 'express';
import { IncomingHttpHeaders, OutgoingHttpHeaders } from 'http';
import { assign } from 'lodash';
import * as mongoose from 'mongoose';
import { DomainLogger, makeDomainLogger } from './logger';
import { console } from './logger/adapters';

export enum HttpMethod {
  Get, Post, Put, Patch, Delete, Options, Unknown
}

export interface ConfigurableRequest<Params, Query, Body> {
  params: Params;
  query: Query;
  body: Body;
}

export interface Request<Params, Query, Body> extends ConfigurableRequest<Params, Query, Body> {
  path: string,
  headers: IncomingHttpHeaders;
  logger: DomainLogger;
  method: HttpMethod;
}

export interface Response<Body> {
  code: number;
  headers: OutgoingHttpHeaders;
  body: Body;
}

export type MakeRequest<Params, Query, Body> = (req: express.Request) => ConfigurableRequest<Params, Query, Body>;

export type TransformRequest<RPA, RQA, RBA, RPB, RQB, RBB> = (request: Request<RPA, RQA, RBA>) => Promise<ConfigurableRequest<RPB, RQB, RBB>>;

export type MakeResponse<ReqParams, ReqQuery, ReqBody, ResBody> = (request: Request<ReqParams, ReqQuery, ReqBody>) => Promise<Response<ResBody>>;

export type Respond<Body> = (expressResponse: express.Response, response: Response<Body>) => express.Response;

export interface Handler<ReqParams, ReqQuery, ReqBody, ResBody> {
  makeRequest: MakeRequest<ReqParams, ReqQuery, ReqBody>;
  makeResponse: MakeResponse<ReqParams, ReqQuery, ReqBody, ResBody>;
  respond: Respond<ResBody>;
}

export function parseHttpMethod(raw: string): HttpMethod {
  switch (raw.toLowerCase()) {
    case 'get':
      return HttpMethod.Get;
    case 'post':
      return HttpMethod.Post;
    case 'put':
      return HttpMethod.Put;
    case 'patch':
      return HttpMethod.Patch;
    case 'delete':
      return HttpMethod.Delete;
    case 'options':
      return HttpMethod.Options;
    default:
      return HttpMethod.Unknown;
  }
}

export function makeHandler<RP, RQ, ReqB, ResB>(handler: Handler<RP, RQ, ReqB, ResB>): express.RequestHandler {
  return (req, res) => {
    const request = assign(handler.makeRequest(req), {
      method: parseHttpMethod(req.method),
      path: req.path,
      headers: req.headers,
      logger: makeDomainLogger(console, `request:${new mongoose.Types.ObjectId()}`)
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
