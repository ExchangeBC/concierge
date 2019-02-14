import * as express from 'express';
import { isNumber } from 'lodash';
import { Document, Model } from 'mongoose';
import { makeHandlerJson, Request, respondNotFoundJson, Response } from './server';

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
  // TODO make higher-order function using MakeResponse
  handler(Model: Model<Item>, request: Request<null, null, CreateRequestBody>): Promise<Response<Item>>;
}

export type ReadOne<Item extends Document> = (Model: Model<Item>, request: Request<ReadOneRequestParams, null, null>) => Promise<Response<Item>>;

export type ReadMany<Item extends Document> = (Model: Model<Item>, request: Request<null, ReadManyRequestQuery, null>) => Promise<Response<ReadManyResponse<Item>>>;

export interface Update<Item extends Document, UpdateRequestBody> {
  transformRequestBody(raw: any): UpdateRequestBody;
  // TODO make higher-order function using MakeResponse
  handler(Model: Model<Item>, request: Request<UpdateRequestParams, null, UpdateRequestBody>): Promise<Response<Item>>;
}

export type Delete<Item extends Document> = (Model: Model<Item>, request: Request<DeleteRequestParams, null, null>) => Promise<Response<null>>;

export interface Resource<Item extends Document, CreateRequestBody, UpdateRequestBody> {
  ROUTE_NAMESPACE: string;
  MODEL_NAME: string;
  create?: Create<Item, CreateRequestBody>;
  readOne?: ReadOne<Item>;
  readMany?: ReadMany<Item>;
  update?: Update<Item, UpdateRequestBody>;
  delete?: Delete<Item>;
}

function handleCreate<Item extends Document, CreateRequestBody>(Model: Model<Item>, create: Create<Item, CreateRequestBody>): express.RequestHandler {
  return makeHandlerJson(
    req => ({
      params: null,
      query: null,
      body: create.transformRequestBody(req.body)
    }),
    create.handler.bind(null, Model)
  );
}

function handleReadOne<Item extends Document>(Model: Model<Item>, readOne: ReadOne<Item>): express.RequestHandler {
  return makeHandlerJson(
    req => ({
      params: {
        id: req.params.id || ''
      },
      query: null,
      body: null
    }),
    readOne.bind(null, Model)
  );
}

function handleReadMany<Item extends Document>(Model: Model<Item>, readMany: ReadMany<Item>): express.RequestHandler {
  return makeHandlerJson(
    req => {
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
    async request => {
      return await readMany(Model, request);
    }
  );
}

function handleUpdate<Item extends Document, UpdateRequestBody>(Model: Model<Item>, update: Update<Item, UpdateRequestBody>): express.RequestHandler {
  return makeHandlerJson(
    req => ({
      params: {
        id: req.params.id || ''
      },
      query: null,
      body: update.transformRequestBody(req.body)
    }),
    update.handler.bind(null, Model)
  );
}

function handleDelete<Item extends Document>(Model: Model<Item>, deleteFn: Delete<Item>): express.RequestHandler {
  return makeHandlerJson(
    req => ({
      params: {
        id: req.params.id || ''
      },
      query: null,
      body: null
    }),
    deleteFn.bind(null, Model)
  );
}

export function router<Item extends Document, CRB, URB>(resource: Resource<Item, CRB, URB>): (Model: Model<Item>) => express.Router {
  return Model => {
    const router = express.Router();
    const { create, readOne, readMany, update } = resource;
    if (create) { router.post('/', handleCreate(Model, create)); }
    if (readOne) { router.get('/:id', handleReadOne(Model, readOne)); }
    if (readMany) { router.get('/', handleReadMany(Model, readMany)); }
    if (update) { router.put('/:id', handleUpdate(Model, update)); }
    if (resource.delete) { router.delete('/:id', handleDelete(Model, resource.delete)); }
    router.use((req, res) => respondNotFoundJson(res));
    return router;
  };
}
