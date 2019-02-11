import * as express from 'express';
// import { IncomingHttpHeaders, OutgoingHttpHeaders } from 'http';
import { Set } from 'immutable';
import { Document, Model } from 'mongoose';

//////////////////////////
// Low-level HTTP types //
//////////////////////////

interface HTTPStatusCode {
  httpStatusCode: number;
}

/*interface Request<Body> {
  headers: IncomingHttpHeaders;
  body: Body;
}

interface Response<Body> {
  code: HTTPStatusCode;
  headers: OutgoingHttpHeaders;
  body: Body;
}*/

//////////
// CRUD //
//////////

enum CRUDAction {
  Create,
  ReadOne,
  ReadMany,
  Update,
  Delete
}

interface CRUDStatusCodes<StatusCode> {
  ok: StatusCode;
  created: StatusCode;
  deleted: StatusCode;
  notFound: StatusCode;
  invalidRequestBody: StatusCode;
  unsupportedAction: StatusCode;
}

interface CRUDResource<Interface extends Document, StatusCode> {
  model: Model<Interface>;
  codes: CRUDStatusCodes<StatusCode>;
  // TODO add support for custom handler behaviour
  // Possible change supportedActions to Map<CRUDAction, HandlerFunction>
  supportedActions: Set<CRUDAction>;
}

// This function returns an express RequestHandler that creates an instance of Model in the database.
// handleReadOne, handleReadMany, handleUpdate, handleDelete all have the same type signature.
function handleCreate<M, SC extends HTTPStatusCode>(model: M, codes: CRUDStatusCodes<SC>): express.RequestHandler {
  return (req, res, next) => { return; };
}

function handleReadOne<M, SC extends HTTPStatusCode>(model: M, codes: CRUDStatusCodes<SC>): express.RequestHandler {
  return (req, res, next) => { return; };
}

function handleReadMany<M, SC extends HTTPStatusCode>(model: M, codes: CRUDStatusCodes<SC>): express.RequestHandler {
  return (req, res, next) => { return; };
}

function handleUpdate<M, SC extends HTTPStatusCode>(model: M, codes: CRUDStatusCodes<SC>): express.RequestHandler {
  return (req, res, next) => { return; };
}

function handleDelete<M, SC extends HTTPStatusCode>(model: M, codes: CRUDStatusCodes<SC>): express.RequestHandler {
  return (req, res, next) => { return; };
}

function handleUnsupportedAction<SC extends HTTPStatusCode>(codes: CRUDStatusCodes<SC>): express.RequestHandler {
  return (req, res, next) => { return; };
}

// This function creates an express Router given a CRUDResource.
function createCRUDRouter<I extends Document, SC extends HTTPStatusCode>(resource: CRUDResource<I, SC>): express.Router {
  const router = express.Router();
  const { model, codes, supportedActions } = resource;
  for (const action of supportedActions) {
    switch (action) {
      case CRUDAction.Create:
        router.post('/', handleCreate(model, codes));
        break;
      case CRUDAction.ReadOne:
        router.get('/:id', handleReadOne(model, codes));
        break;
      case CRUDAction.ReadMany:
        router.get('/', handleReadMany(model, codes));
        break;
      case CRUDAction.Update:
        router.put('/:id', handleUpdate(model, codes));
        break;
      case CRUDAction.Delete:
        router.delete('/:id', handleDelete(model, codes));
        break;
    }
  }
  router.use(handleUnsupportedAction(codes));
  return router;
}

///////////
// NOTES //
///////////

// type CreateCRUDRouter<A extends Document, B extends HTTPStatusCode> = (resource: CRUDResource<A, B>) => express.Router;
// type CRUDHandler<Model extends Document, StatusCode extends HTTPStatusCode> = (model: Model, codes: CRUDStatusCodes<StatusCode>) => express.RequestHandler;

/*interface CRUDHandlers<Interface extends Document> {
  create?(model: Model<Interface>, body: any): Promise<Response<Model<Interface>>>;
  readOne?(model: Model<Interface>, id: string): Promise<Response<Model<Interface>>>;
  readMany?(model: Model<Interface>): Promise<Response<Model<Interface>>>;
}*/

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
