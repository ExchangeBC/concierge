import { Handler, namespaceRoute, Route, Router } from 'back-end/lib/server';
import { HttpMethod } from 'shared/lib/types';

 /**
  * This type allows a resource to indicate which Models it needs at the type level.
  * Then, when creating routers for each resource, we provide it an object containing
  * all of the mongoose Models we have. If that object doesn't contain a `Model` that is
  * defined by any resource's `RequiredModels` type parameter, we will see a compile-time
  * error.
  */

export type Models<AvailableModels, RequiredModels extends keyof AvailableModels> = Pick<AvailableModels, RequiredModels>;

// TODO unused, but would be useful when we have
// type-safe URL parsing.
/*export interface ReadOneRequestParams {
  id: string;
}

export interface ReadManyRequestQuery {
  offset: number;
  count: number;
}

export interface UpdateRequestParams {
  id: string;
}

export interface DeleteRequestParams {
  id: string;
}*/

export type CrudAction<AvailableModels, RequiredModels extends keyof AvailableModels, IncomingReqBody, TransformedReqBody, ResBody, Session> = (Models: Models<AvailableModels, RequiredModels>) => Handler<IncomingReqBody, TransformedReqBody, ResBody, Session>;

export type Create<SupportedRequestBodies, SupportedResponseBodies, AvailableModels, RequiredModels extends keyof AvailableModels, TransformedReqBody, Session> = CrudAction<AvailableModels, RequiredModels, SupportedRequestBodies, TransformedReqBody, SupportedResponseBodies, Session>;

export type ReadOne<SupportedResponseBodies, AvailableModels, RequiredModels extends keyof AvailableModels, Session> = CrudAction<AvailableModels, RequiredModels, null, null, SupportedResponseBodies, Session>;

export type ReadMany<SupportedResponseBodies, AvailableModels, RequiredModels extends keyof AvailableModels, Session> = CrudAction<AvailableModels, RequiredModels, null, null, SupportedResponseBodies, Session>;

export type Update<SupportedRequestBodies, SupportedResponseBodies, AvailableModels, RequiredModels extends keyof AvailableModels, TransformedReqBody, Session> = CrudAction<AvailableModels, RequiredModels, SupportedRequestBodies, TransformedReqBody, SupportedResponseBodies, Session>;

export type Delete<SupportedResponseBodies, AvailableModels, RequiredModels extends keyof AvailableModels, Session> = CrudAction<AvailableModels, RequiredModels, null, null, SupportedResponseBodies, Session>;

export interface Resource<SupportedRequestBodies, SupportedResponseBodies, AvailableModels, RequiredModels extends keyof AvailableModels, CReqB, UReqB, Session> {
  routeNamespace: string;
  create?: Create<SupportedRequestBodies, SupportedResponseBodies, AvailableModels, RequiredModels, CReqB, Session>;
  readOne?: ReadOne<SupportedResponseBodies, AvailableModels, RequiredModels, Session>;
  readMany?: ReadMany<SupportedResponseBodies, AvailableModels, RequiredModels, Session>;
  update?: Update<SupportedRequestBodies, SupportedResponseBodies, AvailableModels, RequiredModels, UReqB, Session>;
  delete?: Delete<SupportedResponseBodies, AvailableModels, RequiredModels, Session>;
}

export function makeCreateRoute<SupportedRequestBodies, SupportedResponseBodies, AvailableModels, RequiredModels extends keyof AvailableModels, ReqB, Session>(Models: Models<AvailableModels, RequiredModels>, create: Create<SupportedRequestBodies, SupportedResponseBodies, AvailableModels, RequiredModels, ReqB, Session>): Route<SupportedRequestBodies, ReqB, SupportedResponseBodies, null, Session> {
  const handler = create(Models);
  return {
    method: HttpMethod.Post,
    path: '/',
    handler
  };
}

export function makeReadOneRoute<SupportedRequestBodies, SupportedResponseBodies, AvailableModels, RequiredModels extends keyof AvailableModels, Session>(Models: Models<AvailableModels, RequiredModels>, readOne: ReadOne<SupportedResponseBodies, AvailableModels, RequiredModels, Session>): Route<SupportedRequestBodies, null, SupportedResponseBodies, null, Session> {
  const handler = readOne(Models);
  return {
    method: HttpMethod.Get,
    path: '/:id',
    handler: {
      ...handler,
      async transformRequest() {
        return null;
      }
    }
  };
}

export function makeReadManyRoute<SupportedRequestBodies, SupportedResponseBodies, AvailableModels, RequiredModels extends keyof AvailableModels, Session>(Models: Models<AvailableModels, RequiredModels>, readMany: ReadMany<SupportedResponseBodies, AvailableModels, RequiredModels, Session>): Route<SupportedRequestBodies, null, SupportedResponseBodies, null, Session> {
  const handler = readMany(Models);
  return {
    method: HttpMethod.Get,
    path: '/',
    handler: {
      ...handler,
      async transformRequest() {
        return null;
      }
    }
  };
}

export function makeUpdateRoute<SupportedRequestBodies, SupportedResponseBodies, AvailableModels, RequiredModels extends keyof AvailableModels, ReqB, Session>(Models: Models<AvailableModels, RequiredModels>, update: Update<SupportedRequestBodies, SupportedResponseBodies, AvailableModels, RequiredModels, ReqB, Session>): Route<SupportedRequestBodies, ReqB, SupportedResponseBodies, null, Session> {
  const handler = update(Models);
  return {
    method: HttpMethod.Put,
    path: '/:id',
    handler
  };
}

export function makeDeleteRoute<SupportedRequestBodies, SupportedResponseBodies, AvailableModels, RequiredModels extends keyof AvailableModels, Session>(Models: Models<AvailableModels, RequiredModels>, deleteFn: Delete<SupportedResponseBodies, AvailableModels, RequiredModels, Session>): Route<SupportedRequestBodies, null, SupportedResponseBodies, null, Session> {
  const handler = deleteFn(Models);
  return {
    method: HttpMethod.Delete,
    path: '/:id',
    handler: {
      ...handler,
      async transformRequest() {
        return null;
      }
    }
  };
}

export function makeRouter<SupportedRequestBodies, SupportedResponseBodies, AvailableModels, RequiredModels extends keyof AvailableModels, CReqB, UReqB, Session>(resource: Resource<SupportedRequestBodies, SupportedResponseBodies, AvailableModels, RequiredModels, CReqB, UReqB, Session>): (models: Models<AvailableModels, RequiredModels>) => Router<SupportedRequestBodies, SupportedResponseBodies, Session> {
  return Models => {
    // We do not destructure `delete` because it conflicts with a TypeScript keyword.
    const { create, readOne, readMany, update } = resource;
    const routes = [];
    if (create) { routes.push(makeCreateRoute(Models, create)); }
    if (readOne) { routes.push(makeReadOneRoute(Models, readOne)); }
    if (readMany) { routes.push(makeReadManyRoute(Models, readMany)); }
    if (update) { routes.push(makeUpdateRoute(Models, update)); }
    if (resource.delete) { routes.push(makeDeleteRoute(Models, resource.delete)); }
    return routes.map(route => namespaceRoute(resource.routeNamespace, route));
  };
}
