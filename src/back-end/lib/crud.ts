import { DomainLogger } from 'back-end/lib/logger';
import { HttpMethod, JsonResponseBody, mapJsonResponse, mapRespond, Respond, Route, Router } from 'back-end/lib/server';
import { Map, Set } from 'immutable';
import { get } from 'lodash';
import mongoose from 'mongoose';

type ModelMap = Map<string, mongoose.Model<mongoose.Document>>;

export interface ReadOneRequestParams {
  id: string;
}

export interface ReadManyRequestQuery {
  offset: number;
  count: number;
}

export interface ReadManyResponse<Document> {
  total: number;
  offset: number;
  count: number;
  items: Document[];
}

export interface UpdateRequestParams {
  id: string;
}

export interface DeleteRequestParams {
  id: string;
}

export interface Create<Document extends mongoose.Document, CreateRequestBody, ErrorResponseBody> {
  transformRequestBody(raw: any, logger: DomainLogger): Promise<CreateRequestBody>;
  run(Model: mongoose.Model<Document>, ExtraModels: ModelMap): Respond<null, null, CreateRequestBody, Document | ErrorResponseBody>;
}

export type ReadOne<Document extends mongoose.Document, ErrorResponseBody> = (Model: mongoose.Model<Document>, ExtraModels: ModelMap) => Respond<ReadOneRequestParams, null, null, Document | ErrorResponseBody>;

export type ReadMany<Document extends mongoose.Document, ErrorResponseBody> = (Model: mongoose.Model<Document>, ExtraModels: ModelMap) => Respond<null, ReadManyRequestQuery, null, ReadManyResponse<Document> | ErrorResponseBody>;

export interface Update<Document extends mongoose.Document, UpdateRequestBody, ErrorResponseBody> {
  transformRequestBody(raw: any, logger: DomainLogger): Promise<UpdateRequestBody>;
  run(Model: mongoose.Model<Document>, ExtraModels: ModelMap): Respond<UpdateRequestParams, null, UpdateRequestBody, Document | ErrorResponseBody>;
}

export type Delete<Document extends mongoose.Document, ErrorResponseBody> = (Model: mongoose.Model<Document>, ExtraModels: ModelMap) => Respond<DeleteRequestParams, null, null, null | ErrorResponseBody>;

export interface Resource<Document extends mongoose.Document, CreateRequestBody, UpdateRequestBody, CreateErrorResponseBody, ReadOneErrorResponseBody, ReadManyErrorResponseBody, UpdateErrorResponseBody, DeleteErrorResponseBody> {
  routeNamespace: string;
  model: string;
  extraModels?: Set<string>;
  create?: Create<Document, CreateRequestBody, CreateErrorResponseBody>;
  readOne?: ReadOne<Document, ReadOneErrorResponseBody>;
  readMany?: ReadMany<Document, ReadManyErrorResponseBody>;
  update?: Update<Document, UpdateRequestBody, UpdateErrorResponseBody>;
  delete?: Delete<Document, DeleteErrorResponseBody>;
}

export function makeCreateRoute<Document extends mongoose.Document, CreateRequestBody, ErrorResponseBody>(Model: mongoose.Model<Document>, ExtraModels: ModelMap, create: Create<Document, CreateRequestBody, ErrorResponseBody>): Route<null, null, CreateRequestBody, JsonResponseBody, null> {
  return {
    method: HttpMethod.Post,
    path: '/',
    handler: {
      transformRequest: async request => ({
        params: null,
        query: null,
        body: await create.transformRequestBody(request.body, request.logger)
      }),
      respond: mapRespond(create.run(Model, ExtraModels), mapJsonResponse)
    }
  };
}

export function makeReadOneRoute<Document extends mongoose.Document, ErrorResponseBody>(Model: mongoose.Model<Document>, ExtraModels: ModelMap, readOne: ReadOne<Document, ErrorResponseBody>): Route<ReadOneRequestParams, null, null, JsonResponseBody, null> {
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

export function makeReadManyRoute<Document extends mongoose.Document, ErrorResponseBody>(Model: mongoose.Model<Document>, ExtraModels: ModelMap, readMany: ReadMany<Document, ErrorResponseBody>): Route<null, ReadManyRequestQuery, null, JsonResponseBody, null> {
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

export function makeUpdateRoute<Document extends mongoose.Document, UpdateRequestBody, ErrorResponseBody>(Model: mongoose.Model<Document>, ExtraModels: ModelMap, update: Update<Document, UpdateRequestBody, ErrorResponseBody>): Route<UpdateRequestParams, null, UpdateRequestBody, JsonResponseBody, null> {
  return {
    method: HttpMethod.Put,
    path: '/:id',
    handler: {
      transformRequest: async request => ({
        params: {
          id: get(request, ['params', 'id'], '')
        },
        query: null,
        body: await update.transformRequestBody(request.body, request.logger)
      }),
      respond: mapRespond(update.run(Model, ExtraModels), mapJsonResponse)
    }
  };
}

export function makeDeleteRoute<Document extends mongoose.Document, ErrorResponseBody>(Model: mongoose.Model<Document>, ExtraModels: ModelMap, deleteFn: Delete<Document, ErrorResponseBody>): Route<DeleteRequestParams, null, null, JsonResponseBody, null> {
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

export function makeRouter<Document extends mongoose.Document, CRB, URB, CERB, ROERB, RMERB, UERB, DERB>(resource: Resource<Document, CRB, URB, CERB, ROERB, RMERB, UERB, DERB>): (Model: mongoose.Model<Document>, ExtraModels: ModelMap) => Router<JsonResponseBody> {
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
