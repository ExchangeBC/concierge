import { composeTransformRequest, HttpMethod, JsonResponseBody, mapJsonResponse, mapRespond, Respond, Route, Router, TransformRequestBody } from 'back-end/lib/server';
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

export interface Create<Data, CreateRequestBody, ErrorResponseBody> {
  transformRequestBody(Model: Model<Data>, ExtraModels: ExtraModels): TransformRequestBody<null, null, any, CreateRequestBody>;
  run(Model: Model<Data>, ExtraModels: ExtraModels): Respond<null, null, CreateRequestBody, Data | ErrorResponseBody>;
}

export type ReadOne<Data, ErrorResponseBody> = (Model: Model<Data>, ExtraModels: ExtraModels) => Respond<ReadOneRequestParams, null, null, Data | ErrorResponseBody>;

export type ReadMany<Data, ErrorResponseBody> = (Model: Model<Data>, ExtraModels: ExtraModels) => Respond<null, ReadManyRequestQuery, null, ReadManyResponse<Data> | ErrorResponseBody>;

export interface Update<Data, UpdateRequestBody, ErrorResponseBody> {
  transformRequestBody(Model: Model<Data>, ExtraModels: ExtraModels): TransformRequestBody<UpdateRequestParams, null, any, UpdateRequestBody>;
  run(Model: Model<Data>, ExtraModels: ExtraModels): Respond<UpdateRequestParams, null, UpdateRequestBody, Data | ErrorResponseBody>;
}

export type Delete<Data, ErrorResponseBody> = (Model: Model<Data>, ExtraModels: ExtraModels) => Respond<DeleteRequestParams, null, null, null | ErrorResponseBody>;

export interface Resource<Data, CreateRequestBody, UpdateRequestBody, CreateErrorResponseBody, ReadOneErrorResponseBody, ReadManyErrorResponseBody, UpdateErrorResponseBody, DeleteErrorResponseBody> {
  routeNamespace: string;
  model: string;
  extraModels?: Set<string>;
  create?: Create<Data, CreateRequestBody, CreateErrorResponseBody>;
  readOne?: ReadOne<Data, ReadOneErrorResponseBody>;
  readMany?: ReadMany<Data, ReadManyErrorResponseBody>;
  update?: Update<Data, UpdateRequestBody, UpdateErrorResponseBody>;
  delete?: Delete<Data, DeleteErrorResponseBody>;
}

export function makeCreateRoute<Data, CreateRequestBody, ErrorResponseBody>(Model: Model<Data>, ExtraModels: ExtraModels, create: Create<Data, CreateRequestBody, ErrorResponseBody>): Route<null, null, CreateRequestBody, JsonResponseBody, null> {
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

export function makeReadOneRoute<Data, ErrorResponseBody>(Model: Model<Data>, ExtraModels: ExtraModels, readOne: ReadOne<Data, ErrorResponseBody>): Route<ReadOneRequestParams, null, null, JsonResponseBody, null> {
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

export function makeReadManyRoute<Data, ErrorResponseBody>(Model: Model<Data>, ExtraModels: ExtraModels, readMany: ReadMany<Data, ErrorResponseBody>): Route<null, ReadManyRequestQuery, null, JsonResponseBody, null> {
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

export function makeUpdateRoute<Data, UpdateRequestBody, ErrorResponseBody>(Model: Model<Data>, ExtraModels: ExtraModels, update: Update<Data, UpdateRequestBody, ErrorResponseBody>): Route<UpdateRequestParams, null, UpdateRequestBody, JsonResponseBody, null> {
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

export function makeDeleteRoute<Data, ErrorResponseBody>(Model: Model<Data>, ExtraModels: ExtraModels, deleteFn: Delete<Data, ErrorResponseBody>): Route<DeleteRequestParams, null, null, JsonResponseBody, null> {
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

export function makeRouter<Data, CRB, URB, CERB, ROERB, RMERB, UERB, DERB>(resource: Resource<Data, CRB, URB, CERB, ROERB, RMERB, UERB, DERB>): (Model: Model<Data>, ExtraModels: ExtraModels) => Router<JsonResponseBody> {
  return (Model, ExtraModels) => {
    // We do not destructure `delete` because it conflicts with a TypeScript keyword.
    const { create, readOne, readMany, update } = resource;
    const routes = [];
    if (create) { routes.push(makeCreateRoute(Model, ExtraModels, create)); }
    if (readOne) { routes.push(makeReadOneRoute(Model, ExtraModels, readOne)); }
    if (readMany) { routes.push(makeReadManyRoute(Model, ExtraModels, readMany)); }
    if (update) { routes.push(makeUpdateRoute(Model, ExtraModels, update)); }
    if (resource.delete) { routes.push(makeDeleteRoute(Model, ExtraModels, resource.delete)); }
    // Add namespace prefix
    routes.forEach(route => route.path = `${resource.routeNamespace}${route.path}`);
    return routes;
  };
}
