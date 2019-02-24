import { composeTransformRequest, Handler, HttpMethod, JsonResponseBody, mapJsonResponse, mapRespond, namespaceRoute, Route, Router } from 'back-end/lib/server';
import { Map, Set } from 'immutable';
import { get } from 'lodash';
import mongoose from 'mongoose';

export type Model<Data> = mongoose.Model<Data & mongoose.Document>;

export type ExtraModels = Map<string, mongoose.Model<mongoose.Document>>;

export interface ReadOneRequestParams {
  id: string;
}

export interface ReadManyRequestQuery {
  offset: number;
  count: number;
}

export interface ReadManyResponse<Data> {
  total: number;
  offset: number;
  count: number;
  items: Data[];
}

export interface UpdateRequestParams {
  id: string;
}

export interface DeleteRequestParams {
  id: string;
}

export type CrudAction<Data, RPA, RQA, ReqA, RPB, RQB, ReqB, ResB> = (Model: Model<Data>, ExtraModels: ExtraModels) => Handler<RPA, RQA, ReqA, RPB, RQB, ReqB, ResB>;

export type Create<Data, RequestBody, ResponseBody> = CrudAction<Data, null, null, any, null, null, RequestBody, ResponseBody>;

export type ReadOne<Data, ResponseBody> = CrudAction<Data, ReadOneRequestParams, null, null, ReadOneRequestParams, null, null, ResponseBody>;

export type ReadMany<Data, RequestBodyItem, ErrorResponseBody> = CrudAction<Data, null, ReadManyRequestQuery, null, null, ReadManyRequestQuery, null, ReadManyResponse<RequestBodyItem> | ErrorResponseBody>;

export type Update<Data, RequestBody, ResponseBody> = CrudAction<Data, UpdateRequestParams, null, any, UpdateRequestParams, null, RequestBody, ResponseBody>;

export type Delete<Data, ResponseBody> = CrudAction<Data, DeleteRequestParams, null, null, DeleteRequestParams, null, null, ResponseBody>;

export interface Resource<Data, CReqB, CResB, ROResB, RMResBI, RMEResB, UReqB, UResB, DResB> {
  routeNamespace: string;
  model: string;
  extraModels?: Set<string>;
  create?: Create<Data, CReqB, CResB>;
  readOne?: ReadOne<Data, ROResB>;
  readMany?: ReadMany<Data, RMResBI, RMEResB>;
  update?: Update<Data, UReqB, UResB>;
  delete?: Delete<Data, DResB>;
}

export function makeCreateRoute<Data, ReqB, ResB>(Model: Model<Data>, ExtraModels: ExtraModels, create: Create<Data, ReqB, ResB>): Route<null, null, ReqB, JsonResponseBody, null> {
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

export function makeReadOneRoute<Data, ResB>(Model: Model<Data>, ExtraModels: ExtraModels, readOne: ReadOne<Data, ResB>): Route<ReadOneRequestParams, null, null, JsonResponseBody, null> {
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

export function makeReadManyRoute<Data, ResBI, ERB>(Model: Model<Data>, ExtraModels: ExtraModels, readMany: ReadMany<Data, ResBI, ERB>): Route<null, ReadManyRequestQuery, null, JsonResponseBody, null> {
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

export function makeUpdateRoute<Data, ReqB, ResB>(Model: Model<Data>, ExtraModels: ExtraModels, update: Update<Data, ReqB, ResB>): Route<UpdateRequestParams, null, ReqB, JsonResponseBody, null> {
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

export function makeDeleteRoute<Data, ResB>(Model: Model<Data>, ExtraModels: ExtraModels, deleteFn: Delete<Data, ResB>): Route<DeleteRequestParams, null, null, JsonResponseBody, null> {
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

export function makeRouter<Data, CReqB, CResB, ROResB, RMResBI, RMEResB, UReqB, UResB, DResB>(resource: Resource<Data, CReqB, CResB, ROResB, RMResBI, RMEResB, UReqB, UResB, DResB>): (Model: Model<Data>, ExtraModels: ExtraModels) => Router<JsonResponseBody> {
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
