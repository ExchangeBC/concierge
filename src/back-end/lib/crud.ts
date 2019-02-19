import { get } from 'lodash';
import mongoose from 'mongoose';
import { HttpMethod, JsonResponseBody, mapJsonResponse, mapRespond, Respond, Route, Router } from './server';

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

export interface Create<Document extends mongoose.Document, CreateRequestBody> {
  transformRequestBody(raw: any): CreateRequestBody;
  run(Model: mongoose.Model<Document>): Respond<null, null, CreateRequestBody, Document>;
}

export type ReadOne<Document extends mongoose.Document> = (Model: mongoose.Model<Document>) => Respond<ReadOneRequestParams, null, null, Document>;

export type ReadMany<Document extends mongoose.Document> = (Model: mongoose.Model<Document>) => Respond<null, ReadManyRequestQuery, null, ReadManyResponse<Document>>;

export interface Update<Document extends mongoose.Document, UpdateRequestBody> {
  transformRequestBody(raw: any): UpdateRequestBody;
  run(Model: mongoose.Model<Document>): Respond<UpdateRequestParams, null, UpdateRequestBody, Document>;
}

export type Delete<Document extends mongoose.Document> = (Model: mongoose.Model<Document>) => Respond<DeleteRequestParams, null, null, null>;

export interface Resource<Document extends mongoose.Document, CreateRequestBody, UpdateRequestBody> {
  ROUTE_NAMESPACE: string;
  MODEL_NAME: string;
  create?: Create<Document, CreateRequestBody>;
  readOne?: ReadOne<Document>;
  readMany?: ReadMany<Document>;
  update?: Update<Document, UpdateRequestBody>;
  delete?: Delete<Document>;
}

export function makeCreateRoute<Document extends mongoose.Document, CreateRequestBody>(Model: mongoose.Model<Document>, create: Create<Document, CreateRequestBody>): Route<null, null, CreateRequestBody, JsonResponseBody, null> {
  return {
    method: HttpMethod.Post,
    path: '/',
    handler: {
      transformRequest: async request => ({
        params: null,
        query: null,
        body: create.transformRequestBody(request.body)
      }),
      respond: mapRespond(create.run(Model), mapJsonResponse)
    }
  };
}

export function makeReadOneRoute<Document extends mongoose.Document>(Model: mongoose.Model<Document>, readOne: ReadOne<Document>): Route<ReadOneRequestParams, null, null, JsonResponseBody, null> {
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
      respond: mapRespond(readOne(Model), mapJsonResponse)
    }
  };
}

export function makeReadManyRoute<Document extends mongoose.Document>(Model: mongoose.Model<Document>, readMany: ReadMany<Document>): Route<null, ReadManyRequestQuery, null, JsonResponseBody, null> {
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
      respond: mapRespond(readMany(Model), mapJsonResponse)
    }
  };
}

export function makeUpdateRoute<Document extends mongoose.Document, UpdateRequestBody>(Model: mongoose.Model<Document>, update: Update<Document, UpdateRequestBody>): Route<UpdateRequestParams, null, UpdateRequestBody, JsonResponseBody, null> {
  return {
    method: HttpMethod.Put,
    path: '/:id',
    handler: {
      transformRequest: async request => ({
        params: {
          id: get(request, ['params', 'id'], '')
        },
        query: null,
        body: update.transformRequestBody(request.body)
      }),
      respond: mapRespond(update.run(Model), mapJsonResponse)
    }
  };
}

export function makeDeleteRoute<Document extends mongoose.Document>(Model: mongoose.Model<Document>, deleteFn: Delete<Document>): Route<DeleteRequestParams, null, null, JsonResponseBody, null> {
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
      respond: mapRespond(deleteFn(Model), mapJsonResponse)
    }
  };
}

export function makeRouter<Document extends mongoose.Document, CRB, URB>(resource: Resource<Document, CRB, URB>): (Model: mongoose.Model<Document>) => Router<JsonResponseBody> {
  return Model => {
    // We do not destructure `delete` because it conflicts with a TypeScript keyword.
    const { create, readOne, readMany, update } = resource;
    const routes = [];
    if (create) { routes.push(makeCreateRoute(Model, create)); }
    if (readOne) { routes.push(makeReadOneRoute(Model, readOne)); }
    if (readMany) { routes.push(makeReadManyRoute(Model, readMany)); }
    if (update) { routes.push(makeUpdateRoute(Model, update)); }
    if (resource.delete) { routes.push(makeDeleteRoute(Model, resource.delete)); }
    // Add namespace prefix
    routes.forEach(route => route.path = `${resource.ROUTE_NAMESPACE}${route.path}`);
    return routes;
  };
}
