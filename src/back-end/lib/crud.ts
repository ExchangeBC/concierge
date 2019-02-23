import { composeTransformRequest, HttpMethod, JsonResponseBody, mapJsonResponse, mapRespond, namespaceRoute, Respond, Route, Router, TransformRequestBody } from 'back-end/lib/server';
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

export interface Create<Data, RequestBody, ResponseBody> {
  transformRequestBody(Model: Model<Data>, ExtraModels: ExtraModels): TransformRequestBody<null, null, any, RequestBody>;
  run(Model: Model<Data>, ExtraModels: ExtraModels): Respond<null, null, RequestBody, ResponseBody>;
}

export type ReadOne<Data, ResponseBody> = (Model: Model<Data>, ExtraModels: ExtraModels) => Respond<ReadOneRequestParams, null, null, ResponseBody>;

export type ReadMany<Data, ResponseBodyItem, ErrorResponseBody> = (Model: Model<Data>, ExtraModels: ExtraModels) => Respond<null, ReadManyRequestQuery, null, ReadManyResponse<ResponseBodyItem> | ErrorResponseBody>;

export interface Update<Data, UpdateRequestBody, ResponseBody> {
  transformRequestBody(Model: Model<Data>, ExtraModels: ExtraModels): TransformRequestBody<UpdateRequestParams, null, any, UpdateRequestBody>;
  run(Model: Model<Data>, ExtraModels: ExtraModels): Respond<UpdateRequestParams, null, UpdateRequestBody, ResponseBody>;
}

export type Delete<Data, ResponseBody> = (Model: Model<Data>, ExtraModels: ExtraModels) => Respond<DeleteRequestParams, null, null, ResponseBody>;

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
        async request => ({
          params: request.params,
          query: request.query,
          body: await create.transformRequestBody(Model, ExtraModels)(request)
        })
      ),
      respond: mapRespond(create.run(Model, ExtraModels), mapJsonResponse)
    }
  };
}

export function makeReadOneRoute<Data, ResB>(Model: Model<Data>, ExtraModels: ExtraModels, readOne: ReadOne<Data, ResB>): Route<ReadOneRequestParams, null, null, JsonResponseBody, null> {
  return {
    method: HttpMethod.Get,
    path: '/:id',
    handler: {
      transformRequest: async request => ({
        params: {
          id: get(request, ['params', 'id'], '')
        },
        query: null,
        body: null
      }),
      respond: mapRespond(readOne(Model, ExtraModels), mapJsonResponse)
    }
  };
}

export function makeReadManyRoute<Data, ResBI, ERB>(Model: Model<Data>, ExtraModels: ExtraModels, readMany: ReadMany<Data, ResBI, ERB>): Route<null, ReadManyRequestQuery, null, JsonResponseBody, null> {
  return {
    method: HttpMethod.Get,
    path: '/',
    handler: {
      transformRequest: async request => ({
        params: null,
        query: {
          offset: get(request, ['params', 'offset'], ''),
          count: get(request, ['params', 'count'], '')
        },
        body: null
      }),
      respond: mapRespond(readMany(Model, ExtraModels), mapJsonResponse)
    }
  };
}

export function makeUpdateRoute<Data, ReqB, ResB>(Model: Model<Data>, ExtraModels: ExtraModels, update: Update<Data, ReqB, ResB>): Route<UpdateRequestParams, null, ReqB, JsonResponseBody, null> {
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
        async request => ({
          params: request.params,
          query: request.query,
          body: await update.transformRequestBody(Model, ExtraModels)(request)
        })
      ),
      respond: mapRespond(update.run(Model, ExtraModels), mapJsonResponse)
    }
  };
}

export function makeDeleteRoute<Data, ResB>(Model: Model<Data>, ExtraModels: ExtraModels, deleteFn: Delete<Data, ResB>): Route<DeleteRequestParams, null, null, JsonResponseBody, null> {
  return {
    method: HttpMethod.Delete,
    path: '/:id',
    handler: {
      transformRequest: async request => ({
        params: {
          id: get(request, ['params', 'id'], '')
        },
        query: null,
        body: null
      }),
      respond: mapRespond(deleteFn(Model, ExtraModels), mapJsonResponse)
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
