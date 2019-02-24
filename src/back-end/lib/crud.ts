import { composeTransformRequest, Handler, HttpMethod, JsonResponseBody, mapJsonResponse, mapRespond, namespaceRoute, Route, Router } from 'back-end/lib/server';
import { Map, Set } from 'immutable';
import { get } from 'lodash';
import mongoose from 'mongoose';

export type ExtraModels = Map<string, mongoose.Model<mongoose.Document>>;

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

export type CrudAction<Model, RPA, RQA, ReqBA, RPB, RQB, ReqBB, ResB, Session> = (Model: Model, ExtraModels: ExtraModels) => Handler<RPA, RQA, ReqBA, RPB, RQB, ReqBB, ResB, Session>;

export type Create<Model, RequestBody, ResponseBody, Session> = CrudAction<Model, null, null, any, null, null, RequestBody, ResponseBody, Session>;

export type ReadOne<Model, ResponseBody, Session> = CrudAction<Model, ReadOneRequestParams, null, null, ReadOneRequestParams, null, null, ResponseBody, Session>;

export type ReadMany<Model, RequestBodyItem, ErrorResponseBody, Session> = CrudAction<Model, null, ReadManyRequestQuery, null, null, ReadManyRequestQuery, null, ReadManyResponse<RequestBodyItem> | ErrorResponseBody, Session>;

export type Update<Model, RequestBody, ResponseBody, Session> = CrudAction<Model, UpdateRequestParams, null, any, UpdateRequestParams, null, RequestBody, ResponseBody, Session>;

export type Delete<Model, ResponseBody, Session> = CrudAction<Model, DeleteRequestParams, null, null, DeleteRequestParams, null, null, ResponseBody, Session>;

export interface Resource<Model, CReqB, CResB, ROResB, RMResBI, RMEResB, UReqB, UResB, DResB, Session> {
  routeNamespace: string;
  model: string;
  extraModels?: Set<string>;
  create?: Create<Model, CReqB, CResB, Session>;
  readOne?: ReadOne<Model, ROResB, Session>;
  readMany?: ReadMany<Model, RMResBI, RMEResB, Session>;
  update?: Update<Model, UReqB, UResB, Session>;
  delete?: Delete<Model, DResB, Session>;
}

export function makeCreateRoute<Model, ReqB, ResB, Session>(Model: Model, ExtraModels: ExtraModels, create: Create<Model, ReqB, ResB, Session>): Route<null, null, ReqB, JsonResponseBody, null, Session> {
  const handler = create(Model, ExtraModels);
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

export function makeReadOneRoute<Model, ResB, Session>(Model: Model, ExtraModels: ExtraModels, readOne: ReadOne<Model, ResB, Session>): Route<ReadOneRequestParams, null, null, JsonResponseBody, null, Session> {
  const handler = readOne(Model, ExtraModels);
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

export function makeReadManyRoute<Model, ResBI, ERB, Session>(Model: Model, ExtraModels: ExtraModels, readMany: ReadMany<Model, ResBI, ERB, Session>): Route<null, ReadManyRequestQuery, null, JsonResponseBody, null, Session> {
  const handler = readMany(Model, ExtraModels);
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

export function makeUpdateRoute<Model, ReqB, ResB, Session>(Model: Model, ExtraModels: ExtraModels, update: Update<Model, ReqB, ResB, Session>): Route<UpdateRequestParams, null, ReqB, JsonResponseBody, null, Session> {
  const handler = update(Model, ExtraModels);
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

export function makeDeleteRoute<Model, ResB, Session>(Model: Model, ExtraModels: ExtraModels, deleteFn: Delete<Model, ResB, Session>): Route<DeleteRequestParams, null, null, JsonResponseBody, null, Session> {
  const handler = deleteFn(Model, ExtraModels);
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

export function makeRouter<Model, CReqB, CResB, ROResB, RMResBI, RMEResB, UReqB, UResB, DResB, Session>(resource: Resource<Model, CReqB, CResB, ROResB, RMResBI, RMEResB, UReqB, UResB, DResB, Session>): (Model: Model, ExtraModels: ExtraModels) => Router<JsonResponseBody, Session> {
  return (Model, ExtraModels) => {
    // We do not destructure `delete` because it conflicts with a TypeScript keyword.
    const { create, readOne, readMany, update } = resource;
    const routes = [];
    if (create) { routes.push(makeCreateRoute(Model, ExtraModels, create)); }
    if (readOne) { routes.push(makeReadOneRoute(Model, ExtraModels, readOne)); }
    if (readMany) { routes.push(makeReadManyRoute(Model, ExtraModels, readMany)); }
    if (update) { routes.push(makeUpdateRoute(Model, ExtraModels, update)); }
    if (resource.delete) { routes.push(makeDeleteRoute(Model, ExtraModels, resource.delete)); }
    return routes.map(route => namespaceRoute(resource.routeNamespace, route));
  };
}
