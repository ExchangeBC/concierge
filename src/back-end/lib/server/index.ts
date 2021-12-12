import { DomainLogger } from 'back-end/lib/logger';
import { existsSync, readFileSync, statSync } from 'fs';
import { IncomingHttpHeaders, OutgoingHttpHeaders } from 'http';
import { assign } from 'lodash';
import { lookup } from 'mime-types';
import mongoose from 'mongoose';
import { ADT, HttpMethod } from 'shared/lib/types';

export function parseHttpMethod(raw: string): HttpMethod | null {
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
      return null;
  }
}

export type SessionId = mongoose.Types.ObjectId;

export function parseSessionId(raw: any): SessionId {
  try {
    return new mongoose.Types.ObjectId(raw);
  } catch {
    return new mongoose.Types.ObjectId();
  }
}

export type SessionIdToSession<Session> = (sessionId: SessionId) => Promise<Session>;

export type SessionToSessionId<Session> = (session: Session) => SessionId;

export interface Request<Body, Session> {
  readonly id: mongoose.Types.ObjectId;
  readonly path: string;
  readonly headers: IncomingHttpHeaders;
  readonly logger: DomainLogger;
  readonly method: HttpMethod;
  readonly session: Session;
  readonly params: Record<string, string>;
  readonly query: Record<string, string>;
  readonly body: Body;
}

export type TextRequestBody = ADT<'text', string>;

export function makeTextRequestBody(value: string): TextRequestBody {
  return {
    tag: 'text',
    value
  };
}

export type JsonRequestBody = ADT<'json', any>;

export function makeJsonRequestBody(value: any): JsonRequestBody {
  return {
    tag: 'json',
    value
  };
}

export interface FileUpload<Metadata> {
  readonly name: string;
  readonly path: string;
  readonly metadata?: Metadata;
}

export type FileRequestBody<FileUploadMetadata> = ADT<'file', FileUpload<FileUploadMetadata>>;

export function makeFileRequestBody<FileUploadMetadata>(value: FileUpload<FileUploadMetadata>): FileRequestBody<FileUploadMetadata> {
  return {
    tag: 'file',
    value
  };
}

export interface Response<Body, Session> {
  readonly code: number;
  readonly headers: OutgoingHttpHeaders;
  readonly session: Session;
  readonly body: Body;
}

export function basicResponse<Body, Session>(code: number, session: Session, body: Body): Response<Body, Session> {
  return {
    code,
    body,
    session,
    headers: {}
  };
}

export type HtmlResponseBody = ADT<'html', string>;

export function makeHtmlResponseBody(value: string): HtmlResponseBody {
  return {
    tag: 'html',
    value
  };
}

export type TextResponseBody = ADT<'text', string>;

export function makeTextResponseBody(value: string): TextResponseBody {
  return {
    tag: 'text',
    value
  };
}

export function mapTextResponse<Session>(response: Response<string, Session>): Response<TextResponseBody, Session> {
  return {
    code: response.code,
    headers: response.headers,
    session: response.session,
    body: makeTextResponseBody(response.body)
  };
}

export type JsonResponseBody<Value = any> = ADT<'json', Value>;

export function makeJsonResponseBody<Value = any>(value: Value): JsonResponseBody<Value> {
  return {
    tag: 'json',
    value
  } as JsonResponseBody<Value>;
}

export function mapJsonResponse<Session, Value = any>(response: Response<Value, Session>): Response<JsonResponseBody<Value>, Session> {
  return {
    code: response.code,
    headers: response.headers,
    session: response.session,
    body: makeJsonResponseBody(response.body)
  };
}

export interface ResponseFile {
  readonly buffer: Buffer;
  readonly contentType: string;
  readonly contentEncoding?: string;
  readonly contentDisposition?: string;
}

export type FileResponseBody = ADT<'file', ResponseFile>;

function validFile(path: string): boolean {
  return existsSync(path) && statSync(path).isFile();
}

function unsafeMakeFileResponseBody(path: string, contentType?: string, contentEncoding?: string, contentDisposition?: string): FileResponseBody {
  return {
    tag: 'file',
    value: {
      buffer: readFileSync(path),
      contentType: contentType || lookup(path) || 'application/octet-stream',
      contentEncoding,
      contentDisposition
    }
  };
}

export function tryMakeFileResponseBody(path: string, contentType?: string, contentEncoding?: string, contentDisposition?: string): FileResponseBody | null {
  try {
    if (validFile(path)) {
      return unsafeMakeFileResponseBody(path, contentType, contentEncoding, contentDisposition);
    } else {
      return null;
    }
  } catch (e) {
    return null;
  }
}

export function tryMakeFileResponseBodyWithGzip(filePath: string): FileResponseBody | null {
  const compressedFilePath = filePath.replace(/(\.gz)*$/, '.gz');
  const response = tryMakeFileResponseBody(compressedFilePath, lookup(filePath) || undefined, 'gzip');
  return response || tryMakeFileResponseBody(filePath);
}

export function mapFileResponse<Session>(response: Response<string, Session>): Response<FileResponseBody | null, Session> {
  return {
    code: response.code,
    headers: response.headers,
    session: response.session,
    body: tryMakeFileResponseBody(response.body)
  };
}

export interface ErrorValue {
  readonly message: string;
  readonly stack?: string;
  readonly raw: string;
}

export type ErrorResponseBody = ADT<'error', ErrorValue>;

export function makeErrorResponseBody(error: Error): ErrorResponseBody {
  return {
    tag: 'error',
    value: {
      message: error.message,
      stack: error.stack,
      raw: error.toString()
    }
  };
}

export function mapErrorResponse<Session>(response: Response<Error, Session>): Response<ErrorResponseBody, Session> {
  return {
    code: response.code,
    headers: response.headers,
    session: response.session,
    body: makeErrorResponseBody(response.body)
  };
}

export type TransformRequest<RBA, RBB, Session> = (request: Request<RBA, Session>) => Promise<RBB>;

export function composeTransformRequest<RBA, RBB, RBC, Session>(a: TransformRequest<RBA, RBB, Session>, b: TransformRequest<RBB, RBC, Session>): TransformRequest<RBA, RBC, Session> {
  return async (request) => {
    const bodyA = await a(request);
    return await b({
      ...request,
      body: bodyA
    });
  };
}

export type Respond<ReqB, ResB, Session> = (request: Request<ReqB, Session>) => Promise<Response<ResB, Session>>;

export function mapRespond<ReqB, ResBA, ResBB, Session>(respond: Respond<ReqB, ResBA, Session>, fn: (response: Response<ResBA, Session>) => Response<ResBB, Session>): Respond<ReqB, ResBB, Session> {
  return async (request) => {
    const response = await respond(request);
    return fn(response);
  };
}

export interface Handler<ReqBA, ReqBB, ResB, Session> {
  readonly transformRequest: TransformRequest<ReqBA, ReqBB, Session>;
  readonly respond: Respond<ReqBB, ResB, Session>;
}

export const notFoundJsonHandler: Handler<any, any, JsonResponseBody, any> = {
  async transformRequest(request) {
    return request;
  },

  async respond(request) {
    return {
      code: 404,
      headers: {},
      session: request.session,
      body: makeJsonResponseBody({})
    };
  }
};

type BeforeHook<ReqB, State, Session> = (request: Request<ReqB, Session>) => Promise<State>;

type AfterHook<ReqB, ResB, State, Session> = (state: State, request: Request<ReqB, Session>, response: Response<ResB, Session>) => Promise<void>;

export interface RouteHook<ReqB, ResB, State, Session> {
  readonly before: BeforeHook<ReqB, State, Session>;
  readonly after?: AfterHook<ReqB, ResB, State, Session>;
}

export function combineHooks<Session>(hooks: Array<RouteHook<any, any, any, Session>>): RouteHook<any, any, any, Session> {
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

export interface Route<IncomingReqBody, TransformedReqBody, ResBody, HookState, Session> {
  readonly method: HttpMethod;
  readonly path: string;
  readonly handler: Handler<IncomingReqBody, TransformedReqBody, ResBody, Session>;
  readonly hook?: RouteHook<TransformedReqBody, ResBody, HookState, Session>;
}

export function namespaceRoute(prefix: string, route: Route<any, any, any, any, any>) {
  const path = `${prefix.replace(/\/*$/, '')}/${route.path.replace(/^\/*/, '')}`;
  return assign(route, { path });
}

export function addHooksToRoute<Session>(hooks: Array<RouteHook<any, any, any, Session>>, route: Route<any, any, any, any, Session>): Route<any, any, any, any, Session> {
  const newHook = combineHooks(hooks);
  return {
    ...route,
    hook: route.hook ? combineHooks([newHook, route.hook]) : newHook
  };
}

export type MapHandler<ReqBA, ReqBB, ReqBC, ResBA, ResBB, Session> = (oldHandler: Handler<ReqBA, ReqBB, ResBA, Session>) => Handler<ReqBA, ReqBC, ResBB, Session>;

export type MapHook<ReqBA, ReqBB, ResBA, ResBB, StateA, StateB, Session> = (oldHook: RouteHook<ReqBA, ResBA, StateA, Session>) => RouteHook<ReqBB, ResBB, StateB, Session>;

export type MapRoute<ReqBA, ReqBB, ReqBC, ResBA, ResBB, HookStateA, HookStateB, Session> = (oldRoute: Route<ReqBA, ReqBB, ResBA, HookStateA, Session>) => Route<ReqBA, ReqBC, ResBB, HookStateB, Session>;

/**
 * Create a function that transforms a route's handler and hook
 * in a type-safe way.
 */

export function createMapRoute<ReqBA, ReqBB, ReqBC, ResBA, ResBB, HookStateA, HookStateB, Session>(mapHandler: MapHandler<ReqBA, ReqBB, ReqBC, ResBA, ResBB, Session>, mapHook: MapHook<ReqBB, ReqBC, ResBA, ResBB, HookStateA, HookStateB, Session>): MapRoute<ReqBA, ReqBB, ReqBC, ResBA, ResBB, HookStateA, HookStateB, Session> {
  return (route) => ({
    ...route,
    handler: mapHandler(route.handler),
    hook: route.hook && mapHook(route.hook)
  });
}

export const notFoundJsonRoute: Route<any, any, JsonResponseBody, any, any> = {
  method: HttpMethod.Any,
  path: '*',
  handler: notFoundJsonHandler
};

export type Router<ReqB, ResB, Session> = Array<Route<ReqB, any, ResB, any, Session>>;
