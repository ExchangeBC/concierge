import * as crud from 'back-end/lib/crud';
import loggerHook from 'back-end/lib/hooks/logger';
import FileResource from 'back-end/lib/resources/file';
import ForgotPasswordTokenResource from 'back-end/lib/resources/forgot-password-token';
import SessionResource from 'back-end/lib/resources/session';
import UserResource from 'back-end/lib/resources/user';
import FrontEndRouter from 'back-end/lib/routers/front-end';
import * as FileSchema from 'back-end/lib/schemas/file';
import * as ForgotPasswordTokenSchema from 'back-end/lib/schemas/forgot-password-token';
import * as SessionSchema from 'back-end/lib/schemas/session';
import * as UserSchema from 'back-end/lib/schemas/user';
import { addHooksToRoute, FileResponseBody, JsonRequestBody, JsonResponseBody, MultipartRequestBody, namespaceRoute, notFoundJsonRoute, NullRequestBody, Route, Router, TextResponseBody } from 'back-end/lib/server';
import { concat, flatten, flow, map } from 'lodash/fp';
import * as mongoose from 'mongoose';
import mongooseDefault from 'mongoose';
import { flipCurried } from 'shared/lib';

export type Session = SessionSchema.AppSession;

export async function connectToDatabase(mongoUrl: string): Promise<mongoose.Connection> {
  await mongooseDefault.connect(mongoUrl, {
    useNewUrlParser: true
  });
  return mongooseDefault.connection;
}

// Add new models as properties on this interface.
export interface AvailableModels {
  Session: SessionSchema.Model;
  User: UserSchema.Model;
  ForgotPasswordToken: ForgotPasswordTokenSchema.Model;
  File: FileSchema.Model;
}

export function createModels(): AvailableModels {
  // Add new models to this object.
  return {
    Session: mongoose.model('Session', SessionSchema.schema),
    User: mongoose.model('User', UserSchema.schema),
    ForgotPasswordToken: mongoose.model('ForgotPasswordToken', ForgotPasswordTokenSchema.schema),
    File: mongoose.model('File', FileSchema.schema)
  };
};

export type SupportedRequestBodies = JsonRequestBody | MultipartRequestBody | NullRequestBody;

export type SupportedResponseBodies = JsonResponseBody | FileResponseBody | TextResponseBody;

export function createRouter(Models: AvailableModels): Router<SupportedRequestBodies, SupportedResponseBodies, Session> {
  const hooks = [
    loggerHook
  ];

  // Add new resources to this array.
  const resources: Array<crud.Resource<SupportedRequestBodies, AvailableModels, any, any, any, any, any, any, any, any, any, Session>> = [
    UserResource,
    SessionResource,
    ForgotPasswordTokenResource,
    FileResource
  ];

  // Define CRUD routes.
  // We need to use `flippedConcat` as using `concat` binds the routes in the wrong order.
  const flippedConcat = flipCurried(concat);
  const crudRoutes = flow([
    // Create routers from resources.
    map((resource: crud.Resource<SupportedRequestBodies, AvailableModels, any, any, any, any, any, any, any, any, any, Session>) => {
      return crud.makeRouter(resource)(Models);
    }),
    // Make a flat list of routes.
    flatten,
    // Respond with a standard 404 JSON response if API route is not handled.
    flippedConcat(notFoundJsonRoute),
    // Namespace all CRUD routes with '/api'.
    map((route: Route<SupportedRequestBodies, any, any, any, JsonResponseBody, any, Session>) => namespaceRoute('/api', route))
  ])(resources);

  // Return all routes.
  return flow([
    // API routes.
    flippedConcat(crudRoutes),
    // Front-end router.
    flippedConcat(FrontEndRouter),
    // Add global hooks to all routes.
    map((route: Route<SupportedRequestBodies, any, any, any, SupportedResponseBodies, any, Session>) => addHooksToRoute(hooks, route))
  ])([]);
}
