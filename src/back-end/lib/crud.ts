import * as express from 'express';
import { flow, identity, isNumber } from 'lodash';
import { Document, Model } from 'mongoose';
import { bindRoute, HttpMethod, Request, respondJson, Response, Route } from './server';

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

export interface Create<Item extends Document, CreateRequestBody> {
  transformRequestBody(raw: any): CreateRequestBody;
  run(Model: Model<Item>): (request: Request<null, null, CreateRequestBody>) => Promise<Response<Item>>;
}

export type ReadOne<Item extends Document> = (Model: Model<Item>) => (request: Request<ReadOneRequestParams, null, null>) => Promise<Response<Item>>;

export type ReadMany<Item extends Document> = (Model: Model<Item>) => (request: Request<null, ReadManyRequestQuery, null>) => Promise<Response<ReadManyResponse<Item>>>;

export interface Update<Item extends Document, UpdateRequestBody> {
  transformRequestBody(raw: any): UpdateRequestBody;
  // TODO make higher-order function using MakeResponse
  run(Model: Model<Item>): (request: Request<UpdateRequestParams, null, UpdateRequestBody>) => Promise<Response<Item>>;
}

export type Delete<Item extends Document> = (Model: Model<Item>) => (request: Request<DeleteRequestParams, null, null>) => Promise<Response<null>>;

export interface Resource<Item extends Document, CreateRequestBody, UpdateRequestBody> {
  ROUTE_NAMESPACE: string;
  MODEL_NAME: string;
  create?: Create<Item, CreateRequestBody>;
  readOne?: ReadOne<Item>;
  readMany?: ReadMany<Item>;
  update?: Update<Item, UpdateRequestBody>;
  delete?: Delete<Item>;
}

export function makeCreateRoute<Item extends Document, CreateRequestBody>(Model: Model<Item>, create: Create<Item, CreateRequestBody>): Route<null, null, CreateRequestBody, Item> {
  return {
    method: HttpMethod.Post,
    pattern: '/',
    handler: {
      makeRequest: req => ({
        params: null,
        query: null,
        body: create.transformRequestBody(req.body)
      }),
      makeResponse: create.run(Model),
      respond: respondJson
    }
  };
}

export function makeReadOneRoute<Item extends Document>(Model: Model<Item>, readOne: ReadOne<Item>): Route<ReadOneRequestParams, null, null, Item> {
  return {
    method: HttpMethod.Get,
    pattern: '/:id',
    handler: {
      makeRequest: req => ({
        params: {
          id: req.params.id || ''
        },
        query: null,
        body: null
      }),
      makeResponse: readOne(Model),
      respond: respondJson
    }
  };
}

export function makeReadManyRoute<Item extends Document>(Model: Model<Item>, readMany: ReadMany<Item>): Route<null, ReadManyRequestQuery, null, ReadManyResponse<Item>> {
  return {
    method: HttpMethod.Get,
    pattern: '/',
    handler: {
      makeRequest: req => {
        const { offset, count } = req.query;
        return {
          params: null,
          query: {
            offset: isNumber(offset) ? offset : 0,
            count: isNumber(count) ? count : 20
          },
          body: null
        };
      },
      makeResponse: readMany(Model),
      respond: respondJson
    }
  };
}

export function makeUpdateRoute<Item extends Document, UpdateRequestBody>(Model: Model<Item>, update: Update<Item, UpdateRequestBody>): Route<UpdateRequestParams, null, UpdateRequestBody, Item> {
  return {
    method: HttpMethod.Put,
    pattern: '/:id',
    handler: {
      makeRequest: req => ({
        params: {
          id: req.params.id || ''
        },
        query: null,
        body: update.transformRequestBody(req.body)
      }),
      makeResponse: update.run(Model),
      respond: respondJson
    }
  };
}

export function makeDeleteRoute<Item extends Document>(Model: Model<Item>, deleteFn: Delete<Item>): Route<DeleteRequestParams, null, null, null> {
  return {
    method: HttpMethod.Delete,
    pattern: '/:id',
    handler: {
      makeRequest: req => ({
        params: {
          id: req.params.id || ''
        },
        query: null,
        body: null
      }),
      makeResponse: deleteFn(Model),
      respond: respondJson
    }
  };
}

export function router<Item extends Document, CRB, URB>(resource: Resource<Item, CRB, URB>): (Model: Model<Item>) => express.Router {
  return Model => {
    const { create, readOne, readMany, update } = resource;
    return flow([
      create ? bindRoute(makeCreateRoute(Model, create)) : identity,
      readOne ? bindRoute(makeReadOneRoute(Model, readOne)) : identity,
      readMany ? bindRoute(makeReadManyRoute(Model, readMany)) : identity,
      update ? bindRoute(makeUpdateRoute(Model, update)) : identity,
      resource.delete ? bindRoute(makeDeleteRoute(Model, resource.delete)) : identity
    ])(express.Router());
    return router;
  };
}
