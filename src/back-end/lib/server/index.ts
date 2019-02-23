// TODO how to handle receiving files via multipart request?

import { DomainLogger } from 'back-end/lib/logger';
import { existsSync, readFileSync, statSync } from 'fs';
import { IncomingHttpHeaders, OutgoingHttpHeaders } from 'http';
import { assign } from 'lodash';
import { lookup } from 'mime-types';
import mongoose from 'mongoose';
import { ADT } from 'shared/lib/types';

export enum HttpMethod {
  Any = '*',
  Get = 'GET',
  Post = 'POST',
  Put = 'PUT',
  Patch = 'PATCH',
  Delete = 'DELETE',
  Options = 'OPTIONS',
  Unknown = 'UNKNOWN'
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

export interface ConfigurableRequest<Params, Query, Body> {
  params: Params;
  query: Query;
  body: Body;
}

export function nullConfigurableRequest(): ConfigurableRequest<null, null, null> {
  return {
    params: null,
    query: null,
    body: null
  };
}

export interface Request<Params, Query, Body> extends ConfigurableRequest<Params, Query, Body> {
  id: mongoose.Types.ObjectId;
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

export type JsonResponseBody = ADT<'json', any>;

export function makeJsonResponseBody(value: any): JsonResponseBody {
  return {
    tag: 'json',
    value
  };
}

export function mapJsonResponse(response: Response<any>): Response<JsonResponseBody> {
  return {
    code: response.code,
    headers: response.headers,
    body: makeJsonResponseBody(response.body)
  };
}

export interface File {
  buffer: Buffer;
  contentType: string;
}

export type FileResponseBody = ADT<'file', File | null>;

// TODO do we need fallback handling here?
// TODO do something better than responding with a `null` file.
export function makeFileResponseBody(path: string, fallbackPath?: string): FileResponseBody {
  function nullFile(): FileResponseBody {
    return { tag: 'file', value: null };
  }
  try {
    function validFile(path: string): boolean {
      return existsSync(path) && statSync(path).isFile();
    }
    function unsafeRead(path: string): FileResponseBody {
      return {
        tag: 'file',
        value: {
          buffer: readFileSync(path),
          contentType: lookup(path) || 'application/octet-stream'
        }
      };
    }
    if (validFile(path)) {
      return unsafeRead(path);
    } else if (fallbackPath && validFile(fallbackPath)) {
      return unsafeRead(fallbackPath);
    } else {
      return nullFile();
    }
  } catch (e) {
    return nullFile();
  }
}

export function mapFileResponse(response: Response<string>): Response<FileResponseBody> {
  return {
    code: response.code,
    headers: response.headers,
    body: makeFileResponseBody(response.body)
  };
}

export type TextResponseBody = ADT<'text', string>;

export function makeTextResponseBody(value: string): TextResponseBody {
  return {
    tag: 'text',
    value
  };
}

export function mapTextResponse(response: Response<string>): Response<TextResponseBody> {
  return {
    code: response.code,
    headers: response.headers,
    body: makeTextResponseBody(response.body)
  };
}

export type ErrorResponseBody = ADT<'error', Error>;

export function makeErrorResponseBody(value: Error): ErrorResponseBody {
  return {
    tag: 'error',
    value
  };
}

export function mapErrorResponse(response: Response<Error>): Response<ErrorResponseBody> {
  return {
    code: response.code,
    headers: response.headers,
    body: makeErrorResponseBody(response.body)
  };
}

export type TransformRequest<RPA, RQA, RBA, RPB, RQB, RBB> = (request: Request<RPA, RQA, RBA>) => Promise<ConfigurableRequest<RPB, RQB, RBB>>;

export function composeTransformRequest<RPA, RQA, RBA, RPB, RQB, RBB, RPC, RQC, RBC>(a: TransformRequest<RPA, RQA, RBA, RPB, RQB, RBB>, b: TransformRequest<RPB, RQB, RBB, RPC, RQC, RBC>): TransformRequest<RPA, RQA, RBA, RPC, RQC, RBC> {
  return async request => {
    const newRequest = assign({}, request, await a(request));
    return assign({}, newRequest, await b(newRequest));
  };
}

export type TransformRequestBody<RP, RQ, RBA, RBB> = (request: Request<RP, RQ, RBA>) => Promise<RBB>;

export type Respond<RP, RQ, ReqB, ResB> = (request: Request<RP, RQ, ReqB>) => Promise<Response<ResB>>;

export function mapRespond<RP, RQ, ReqB, ResBA, ResBB>(respond: Respond<RP, RQ, ReqB, ResBA>, fn: (response: Response<ResBA>) => Response<ResBB>): Respond<RP, RQ, ReqB, ResBB> {
  return async request => {
    const response = await respond(request);
    return fn(response);
  };
}

export interface Handler<RP, RQ, ReqB, ResB> {
  transformRequest: TransformRequest<object, object, any, RP, RQ, ReqB>;
  respond: Respond<RP, RQ, ReqB, ResB>;
}

export const notFoundJsonHandler: Handler<any, any, any, JsonResponseBody> = {

  async transformRequest(request) {
    return request;
  },

  async respond(request) {
    return {
      code: 404,
      headers: {},
      body: makeJsonResponseBody({})
    };
  }

};

export interface RouteHook<RP, RQ, ReqB, ResB, State> {
  before(request: Request<RP, RQ, ReqB>): Promise<State>;
  after?(state: State, request: Request<RP, RQ, ReqB>, response: Response<ResB>): Promise<void>;
}

export function combineHooks(hooks: Array<RouteHook<any, any, any, any, any>>): RouteHook<any, any, any, any, any> {
  return {
    async before(request) {
      const results = [];
      for (const hook of hooks) {
        results.push({
          state: await hook.before(request),
          after: hook.after
        });
      }
      return results;
    },
    async after(state, request, response) {
      for (const hook of state) {
        if (hook.after) {
          hook.after(hook.state, request, response);
        }
      }
    }
  };
}

export interface Route<RP, RQ, ReqB, ResB, HS> {
  method: HttpMethod;
  path: string;
  handler: Handler<RP, RQ, ReqB, ResB>;
  hook?: RouteHook<RP, RQ, ReqB, ResB, HS>;
}

export function namespaceRoute(prefix: string, route: Route<any, any, any, any, any>) {
  const path = `${prefix.replace(/\/*$/, '')}/${route.path.replace(/^\/*/, '')}`;
  return assign(route, { path });
}

export function addHooksToRoute(hooks: Array<RouteHook<any, any, any, any, any>>, route: Route<any, any, any, any, any>): Route<any, any, any, any, any> {
  const newHook = combineHooks(hooks);
  route.hook = route.hook ? combineHooks([newHook, route.hook]) : newHook;
  return route;
}

export const notFoundJsonRoute: Route<any, any, any, JsonResponseBody, any> = {
  method: HttpMethod.Any,
  path: '*',
  handler: notFoundJsonHandler
}

export type Router<ResB> = Array<Route<any, any, any, ResB, any>>;
