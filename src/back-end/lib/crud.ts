import { composeTransformRequest, Handler, HttpMethod, JsonResponseBody, mapJsonResponse, mapRespond, namespaceRoute, Route, Router } from 'back-end/lib/server';
import { get } from 'lodash';

// This type allows a resource to indicate which Models it needs at the type level.
// Then, when creating routers for each resource, we provide it an object containing
// all of the mongoose Models we have. If that object doesn't contain a `Model` that is
// defined by any resource's `RequiredModels` type parameter, we will see a compile-time
// error.
export type Models<AvailableModels, RequiredModels extends keyof AvailableModels> = Pick<AvailableModels, RequiredModels>;

export interface ReadOneRequestParams {
  id: string;
}

export interface ReadManyRequestQuery {
  offset: number;
  count: number;
}

export interface ReadManyResponse<Item> {
  total: number;
  offset: number;
  count: number;
  items: Item[];
}

export interface UpdateRequestParams {
  id: string;
}

export interface DeleteRequestParams {
  id: string;
}

export type CrudAction<AvailableModels, RequiredModels extends keyof AvailableModels, RPA, RQA, ReqBA, RPB, RQB, ReqBB, ResB, Session> = (Models: Models<AvailableModels, RequiredModels>) => Handler<RPA, RQA, ReqBA, RPB, RQB, ReqBB, ResB, Session>;

export type Create<AvailableModels, RequiredModels extends keyof AvailableModels, RequestBody, ResponseBody, Session> = CrudAction<AvailableModels, RequiredModels, null, null, any, null, null, RequestBody, ResponseBody, Session>;

export type ReadOne<AvailableModels, RequiredModels extends keyof AvailableModels, ResponseBody, Session> = CrudAction<AvailableModels, RequiredModels, ReadOneRequestParams, null, null, ReadOneRequestParams, null, null, ResponseBody, Session>;

export type ReadMany<AvailableModels, RequiredModels extends keyof AvailableModels, RequestBodyItem, ErrorResponseBody, Session> = CrudAction<AvailableModels, RequiredModels, null, ReadManyRequestQuery, null, null, ReadManyRequestQuery, null, ReadManyResponse<RequestBodyItem> | ErrorResponseBody, Session>;

export type Update<AvailableModels, RequiredModels extends keyof AvailableModels, RequestBody, ResponseBody, Session> = CrudAction<AvailableModels, RequiredModels, UpdateRequestParams, null, any, UpdateRequestParams, null, RequestBody, ResponseBody, Session>;

export type Delete<AvailableModels, RequiredModels extends keyof AvailableModels, ResponseBody, Session> = CrudAction<AvailableModels, RequiredModels, DeleteRequestParams, null, null, DeleteRequestParams, null, null, ResponseBody, Session>;

export interface Resource<AvailableModels, RequiredModels extends keyof AvailableModels, CReqB, CResB, ROResB, RMResBI, RMEResB, UReqB, UResB, DResB, Session> {
  routeNamespace: string;
  create?: Create<AvailableModels, RequiredModels, CReqB, CResB, Session>;
  readOne?: ReadOne<AvailableModels, RequiredModels, ROResB, Session>;
  readMany?: ReadMany<AvailableModels, RequiredModels, RMResBI, RMEResB, Session>;
  update?: Update<AvailableModels, RequiredModels, UReqB, UResB, Session>;
  delete?: Delete<AvailableModels, RequiredModels, DResB, Session>;
}

export function makeCreateRoute<AvailableModels, RequiredModels extends keyof AvailableModels, ReqB, ResB, Session>(Models: Models<AvailableModels, RequiredModels>, create: Create<AvailableModels, RequiredModels, ReqB, ResB, Session>): Route<null, null, ReqB, JsonResponseBody, null, Session> {
  const handler = create(Models);
  return {
    method: HttpMethod.Post,
    path: '/',
    handler: {
      transformRequest: composeTransformRequest(
        async request => ({
          params: null,
          query: null,
          body: request.body
        }),
        handler.transformRequest
      ),
      respond: mapRespond(handler.respond, mapJsonResponse)
    }
  };
}

export function makeReadOneRoute<AvailableModels, RequiredModels extends keyof AvailableModels, ResB, Session>(Models: Models<AvailableModels, RequiredModels>, readOne: ReadOne<AvailableModels, RequiredModels, ResB, Session>): Route<ReadOneRequestParams, null, null, JsonResponseBody, null, Session> {
  const handler = readOne(Models);
  return {
    method: HttpMethod.Get,
    path: '/:id',
    handler: {
      transformRequest: composeTransformRequest(
        async request => ({
          params: {
            id: get(request, ['params', 'id'], '')
          },
          query: null,
          body: null
        }),
        handler.transformRequest
      ),
      respond: mapRespond(handler.respond, mapJsonResponse)
    }
  };
}

export function makeReadManyRoute<AvailableModels, RequiredModels extends keyof AvailableModels, ResBI, ERB, Session>(Models: Models<AvailableModels, RequiredModels>, readMany: ReadMany<AvailableModels, RequiredModels, ResBI, ERB, Session>): Route<null, ReadManyRequestQuery, null, JsonResponseBody, null, Session> {
  const handler = readMany(Models);
  return {
    method: HttpMethod.Get,
    path: '/',
    handler: {
      transformRequest: composeTransformRequest(
        async request => ({
          params: null,
          query: {
            offset: get(request, ['params', 'offset'], ''),
            count: get(request, ['params', 'count'], '')
          },
          body: null
        }),
        handler.transformRequest
      ),
      respond: mapRespond(handler.respond, mapJsonResponse)
    }
  };
}

export function makeUpdateRoute<AvailableModels, RequiredModels extends keyof AvailableModels, ReqB, ResB, Session>(Models: Models<AvailableModels, RequiredModels>, update: Update<AvailableModels, RequiredModels, ReqB, ResB, Session>): Route<UpdateRequestParams, null, ReqB, JsonResponseBody, null, Session> {
  const handler = update(Models);
  return {
    method: HttpMethod.Put,
    path: '/:id',
    handler: {
      transformRequest: composeTransformRequest(
        async request => ({
          params: {
            id: get(request, ['params', 'id'], '')
          },
          query: null,
          body: request.body
        }),
        handler.transformRequest
      ),
      respond: mapRespond(handler.respond, mapJsonResponse)
    }
  };
}

export function makeDeleteRoute<AvailableModels, RequiredModels extends keyof AvailableModels, ResB, Session>(Models: Models<AvailableModels, RequiredModels>, deleteFn: Delete<AvailableModels, RequiredModels, ResB, Session>): Route<DeleteRequestParams, null, null, JsonResponseBody, null, Session> {
  const handler = deleteFn(Models);
  return {
    method: HttpMethod.Delete,
    path: '/:id',
    handler: {
      transformRequest: composeTransformRequest(
        async request => ({
          params: {
            id: get(request, ['params', 'id'], '')
          },
          query: null,
          body: null
        }),
        handler.transformRequest
      ),
      respond: mapRespond(handler.respond, mapJsonResponse)
    }
  };
}

export function makeRouter<AvailableModels, RequiredModels extends keyof AvailableModels, CReqB, CResB, ROResB, RMResBI, RMEResB, UReqB, UResB, DResB, Session>(resource: Resource<AvailableModels, RequiredModels, CReqB, CResB, ROResB, RMResBI, RMEResB, UReqB, UResB, DResB, Session>): (models: Models<AvailableModels, RequiredModels>) => Router<JsonResponseBody, Session> {
  return Models => {
    // We do not destructure `delete` because it conflicts with a TypeScript keyword.
    const { create, readOne, readMany, update } = resource;
    const routes = [];
    if (create) { routes.push(makeCreateRoute(Models, create)); }
    if (readOne) { routes.push(makeReadOneRoute(Models, readOne)); }
    if (readMany) { routes.push(makeReadManyRoute(Models, readMany)); }
    if (update) { routes.push(makeUpdateRoute(Models, update)); }
    if (resource.delete) { routes.push(makeDeleteRoute(Models, resource.delete)); }
    return routes.map(route => namespaceRoute(resource.routeNamespace, route));
  };
}
