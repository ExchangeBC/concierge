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

export interface Create<Data, CreateRequestBody, SuccessResponseBody, ErrorResponseBody> {
  transformRequestBody(Model: Model<Data>, ExtraModels: ExtraModels): TransformRequestBody<null, null, any, CreateRequestBody>;
  run(Model: Model<Data>, ExtraModels: ExtraModels): Respond<null, null, CreateRequestBody, SuccessResponseBody | ErrorResponseBody>;
}

export type ReadOne<Data, SuccessResponseBody, ErrorResponseBody> = (Model: Model<Data>, ExtraModels: ExtraModels) => Respond<ReadOneRequestParams, null, null, SuccessResponseBody | ErrorResponseBody>;

export type ReadMany<Data, SuccessResponseBodyItem, ErrorResponseBody> = (Model: Model<Data>, ExtraModels: ExtraModels) => Respond<null, ReadManyRequestQuery, null, ReadManyResponse<SuccessResponseBodyItem> | ErrorResponseBody>;

export interface Update<Data, UpdateRequestBody, SuccessResponseBody, ErrorResponseBody> {
  transformRequestBody(Model: Model<Data>, ExtraModels: ExtraModels): TransformRequestBody<UpdateRequestParams, null, any, UpdateRequestBody>;
  run(Model: Model<Data>, ExtraModels: ExtraModels): Respond<UpdateRequestParams, null, UpdateRequestBody, SuccessResponseBody | ErrorResponseBody>;
}

export type Delete<Data, SuccessResponseBody, ErrorResponseBody> = (Model: Model<Data>, ExtraModels: ExtraModels) => Respond<DeleteRequestParams, null, null, SuccessResponseBody | ErrorResponseBody>;

export interface Resource<Data, CRB, CSRB, CERB, ROSRB, ROERB, RMSRBI, RMERB, URB, USRB, UERB, DSRB, DERB> {
  routeNamespace: string;
  model: string;
  extraModels?: Set<string>;
  create?: Create<Data, CRB, CSRB, CERB>;
  readOne?: ReadOne<Data, ROSRB, ROERB>;
  readMany?: ReadMany<Data, RMSRBI, RMERB>;
  update?: Update<Data, URB, USRB, UERB>;
  delete?: Delete<Data, DSRB, DERB>;
}

export function makeCreateRoute<Data, RB, SRB, ERB>(Model: Model<Data>, ExtraModels: ExtraModels, create: Create<Data, RB, SRB, ERB>): Route<null, null, RB, JsonResponseBody, null> {
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

export function makeReadOneRoute<Data, SRB, ERB>(Model: Model<Data>, ExtraModels: ExtraModels, readOne: ReadOne<Data, SRB, ERB>): Route<ReadOneRequestParams, null, null, JsonResponseBody, null> {
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

export function makeReadManyRoute<Data, SRB, ERB>(Model: Model<Data>, ExtraModels: ExtraModels, readMany: ReadMany<Data, SRB, ERB>): Route<null, ReadManyRequestQuery, null, JsonResponseBody, null> {
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

export function makeUpdateRoute<Data, URB, SRB, ERB>(Model: Model<Data>, ExtraModels: ExtraModels, update: Update<Data, URB, SRB, ERB>): Route<UpdateRequestParams, null, URB, JsonResponseBody, null> {
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

export function makeDeleteRoute<Data, SRB, ERB>(Model: Model<Data>, ExtraModels: ExtraModels, deleteFn: Delete<Data, SRB, ERB>): Route<DeleteRequestParams, null, null, JsonResponseBody, null> {
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

export function makeRouter<Data, CRB, CSRB, CERB, ROSRB, ROERB, RMSRBI, RMERB, URB, USRB, UERB, DSRB, DERB>(resource: Resource<Data, CRB, CSRB, CERB, ROSRB, ROERB, RMSRBI, RMERB, URB, USRB, UERB, DSRB, DERB>): (Model: Model<Data>, ExtraModels: ExtraModels) => Router<JsonResponseBody> {
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
