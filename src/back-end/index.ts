import * as express from 'express';
import { IncomingHttpHeaders, OutgoingHttpHeaders } from 'http';
import { isNumber } from 'lodash';
import { Document, Model } from 'mongoose';

//////////////////////////
// Low-level Http types //
//////////////////////////

interface Request<Params, Query, Body> {
  headers: IncomingHttpHeaders;
  params: Params;
  query: Query;
  body: Body;
}

interface Response<Body> {
  code: number;
  headers: OutgoingHttpHeaders;
  body: Body;
}

//////////
// CRUD //
//////////

interface ReadOneRequestParams {
  id: string;
}

interface ReadManyRequestQuery {
  offset: number;
  count: number;
}

interface ReadManyResponse<Item> {
  total: number;
  offset: number;
  count: number;
  items: Item[];
}

interface UpdateRequestParams {
  id: string;
}

interface DeleteRequestParams {
  id: string;
}

interface Create<Item extends Document, CreateRequestBody> {
  transformRequestBody(raw: any): CreateRequestBody;
  handler(model: Model<Item>, request: Request<null, null, CreateRequestBody>): Promise<Response<Item>>;
}

type ReadOne<Item extends Document> = (model: Model<Item>, request: Request<ReadOneRequestParams, null, null>) => Promise<Response<Item>>;

type ReadMany<Item extends Document> = (model: Model<Item>, request: Request<null, ReadManyRequestQuery, null>) => Promise<Response<ReadManyResponse<Item>>>;

interface Update<Item extends Document, UpdateRequestBody> {
  transformRequestBody(raw: any): UpdateRequestBody;
  handler(model: Model<Item>, request: Request<UpdateRequestParams, null, UpdateRequestBody>): Promise<Response<Item>>;
}

type Delete<Item extends Document> = (model: Model<Item>, request: Request<DeleteRequestParams, null, null>) => Promise<Response<null>>;

interface Resource<Item extends Document, CreateRequestBody, UpdateRequestBody> {
  model: Model<Item>;
  create?: Create<Item, CreateRequestBody>;
  readOne?: ReadOne<Item>;
  readMany?: ReadMany<Item>;
  // tslint:disable-next-line: member-ordering
  update?: Update<Item, UpdateRequestBody>;
  delete?: Delete<Item>;
}

type MakeRequest<Params, Query, Body> = (req: express.Request) => Request<Params, Query, Body>;
type MakeResponse<ReqParams, ReqQuery, ReqBody, ResBody> = (request: Request<ReqParams, ReqQuery, ReqBody>) => Promise<Response<ResBody>>;

function handleCreate<Item extends Document, CreateRequestBody>(model: Model<Item>, create: Create<Item, CreateRequestBody>): express.RequestHandler {
  return handleJson(
    req => ({
      headers: req.headers,
      params: null,
      query: null,
      body: create.transformRequestBody(req.body)
    }),
    create.handler.bind(null, model)
  );
}

function handleReadOne<Item extends Document>(model: Model<Item>, readOne: ReadOne<Item>): express.RequestHandler {
  return handleJson(
    req => ({
      headers: req.headers,
      params: {
        id: req.params.id || ''
      },
      query: null,
      body: null
    }),
    readOne.bind(null, model)
  );
}

function handleReadMany<Item extends Document>(model: Model<Item>, readMany: ReadMany<Item>): express.RequestHandler {
  return handleJson(
    req => {
      const { offset, count } = req.query;
      return {
        headers: req.headers,
        params: null,
        query: {
          offset: isNumber(offset) ? offset : 0,
          count: isNumber(count) ? count : 20
        },
        body: null
      };
    },
    readMany.bind(null, model)
  );
}

function handleUpdate<Item extends Document, UpdateRequestBody>(model: Model<Item>, update: Update<Item, UpdateRequestBody>): express.RequestHandler {
  return handleJson(
    req => ({
      headers: req.headers,
      params: {
        id: req.params.id || ''
      },
      query: null,
      body: update.transformRequestBody(req.body)
    }),
    update.handler.bind(null, model)
  );
}

function handleDelete<Item extends Document>(model: Model<Item>, deleteFn: Delete<Item>): express.RequestHandler {
  return handleJson(
    req => ({
      headers: req.headers,
      params: {
        id: req.params.id || ''
      },
      query: null,
      body: null
    }),
    deleteFn.bind(null, model)
  );
}

function handleNotFound(): express.RequestHandler {
  return (req, res) => {
    res.status(404).json({});
  };
}

function handleJson<P, Q, ReqB, ResB>(makeRequest: MakeRequest<P, Q, ReqB>, makeResponse: MakeResponse<P, Q, ReqB, ResB>): express.RequestHandler {
  return (req, res) => {
    makeResponse(makeRequest(req))
      .then(respondJson.bind(null, res))
      .catch(respondServerError.bind(null, res));
  };
}

function respondJson<Body>(res: express.Response, response: Response<Body>): express.Response {
  const { code, headers, body } = response;
  return res
    .status(code)
    .set(headers)
    .json(body);
}

function respondServerError<Body>(res: express.Response, error: Error): express.Response {
  return res
    .status(500)
    .json({
      message: error.message,
      stack: error.stack,
      raw: error.toString()
    });
}

// This function creates an express Router given a Resource.
function crudRouter<I extends Document, CRB, URB>(resource: Resource<I, CRB, URB>): express.Router {
  const router = express.Router();
  const { model, create, readOne, readMany, update } = resource;
  if (create) { router.post('/', handleCreate(model, create)); }
  if (readOne) { router.get('/:id', handleReadOne(model, readOne)); }
  if (readMany) { router.get('/', handleReadMany(model, readMany)); }
  if (update) { router.put('/:id', handleUpdate(model, update)); }
  if (resource.delete) { router.delete('/', handleDelete(model, resource.delete)); }
  router.use(handleNotFound());
  return router;
}

///////////
// NOTES //
///////////

// Below is a WIP for type-safe, lower-level implementation.
/*type Middleware<ReqBody> = (req: Request<ReqBody>) => Promise<Request<ReqBody>>;

type Handler<ReqBody, ResBody> = (req: Request<ReqBody>) => Promise<Response<ResBody>>;

function handleError(res: express.Response, error: Error): void {
  res
    .status(500)
    .json({
      message: error.message,
      stack: error.stack,
      raw: error.toString()
    });
}

function handle<ReqBody, ResBody>(middlewares: Array<Middleware<ReqBody>>, handler: Handler<ReqBody, ResBody>): express.RequestHandler {
  return (req, res, next) => {
    const promise = middlewares.reduce(
      (acc, m) => acc.then(request => m(request)),
      // Initial request
      Promise.resolve({
        headers: req.headers,
        body: req.body
      })
    );
    promise
      .then(request => handler(request))
      .then(response => {
        res
          .status(response.code)
          .set(response.headers)
          .send(response.body);
      })
      .catch(error => handleError(res, error));
  };
}*/
