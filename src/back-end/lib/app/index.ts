import { AvailableModels, Session, SupportedRequestBodies, SupportedResponseBodies } from 'back-end/lib/app/types';
import * as crud from 'back-end/lib/crud';
import loggerHook from 'back-end/lib/hooks/logger';
import basicAuth from 'back-end/lib/map-routes/basic-auth';
import DiscoveryDayResponseResource from 'back-end/lib/resources/discovery-day-response';
import FeedbackResource from 'back-end/lib/resources/feedback';
import FileResource from 'back-end/lib/resources/file';
import FileBlobResource from 'back-end/lib/resources/file-blob';
import ForgotPasswordTokenResource from 'back-end/lib/resources/forgot-password-token';
import RfiResource from 'back-end/lib/resources/request-for-information';
import RfiPreviewResource from 'back-end/lib/resources/request-for-information/preview';
import RfiResponseResource from 'back-end/lib/resources/request-for-information/response';
import SessionResource from 'back-end/lib/resources/session';
import UserResource from 'back-end/lib/resources/user';
import FrontEndRouter from 'back-end/lib/routers/front-end';
import StatusRouter from 'back-end/lib/routers/status';
import * as FeedbackSchema from 'back-end/lib/schemas/feedback';
import * as FileSchema from 'back-end/lib/schemas/file';
import * as ForgotPasswordTokenSchema from 'back-end/lib/schemas/forgot-password-token';
import * as RfiSchema from 'back-end/lib/schemas/request-for-information';
import * as RfiResponseSchema from 'back-end/lib/schemas/request-for-information/response';
import * as SessionSchema from 'back-end/lib/schemas/session';
import * as UserSchema from 'back-end/lib/schemas/user';
import { addHooksToRoute, namespaceRoute, notFoundJsonRoute, Route, Router } from 'back-end/lib/server';
import { concat, flatten, flow, map } from 'lodash/fp';
import * as mongoose from 'mongoose';
import mongooseDefault from 'mongoose';
import { flipCurried } from 'shared/lib';

export async function connectToDatabase(mongoUrl: string): Promise<mongoose.Connection> {
  await mongooseDefault.connect(mongoUrl, {
    useNewUrlParser: true
  });
  return mongooseDefault.connection;
}

export function createModels(): AvailableModels {
  return {
    Session: mongoose.model('Session', SessionSchema.schema),
    User: mongoose.model('User', UserSchema.schema),
    Feedback: mongoose.model('Feedback', FeedbackSchema.schema),
    ForgotPasswordToken: mongoose.model('ForgotPasswordToken', ForgotPasswordTokenSchema.schema),
    File: mongoose.model('File', FileSchema.schema),
    Rfi: mongoose.model('Rfi', RfiSchema.schema),
    RfiPreview: mongoose.model('RfiPreview', RfiSchema.schema),
    RfiResponse: mongoose.model('RfiResponse', RfiResponseSchema.schema)
  };
};

interface CreateRouterParams {
  Models: AvailableModels;
  basicAuth?: {
    username: string;
    passwordHash: string;
  };
}

export function createRouter(params: CreateRouterParams): Router<SupportedRequestBodies, SupportedResponseBodies, Session> {
  const hooks = [
    loggerHook
  ];

  // Add new resources to this array.
  const resources: Array<crud.Resource<SupportedRequestBodies, SupportedResponseBodies, AvailableModels, any, any, any, Session>> = [
    UserResource,
    SessionResource,
    ForgotPasswordTokenResource,
    FeedbackResource,
    FileResource,
    FileBlobResource,
    RfiResource,
    RfiPreviewResource,
    DiscoveryDayResponseResource,
    RfiResponseResource
  ];

  // Define CRUD routes.
  // We need to use `flippedConcat` as using `concat` binds the routes in the wrong order.
  const flippedConcat = flipCurried(concat);
  const crudRoutes = flow([
    // Create routers from resources.
    map((resource: crud.Resource<SupportedRequestBodies, SupportedResponseBodies, AvailableModels, any, any, any, Session>) => {
      return crud.makeRouter(resource)(params.Models);
    }),
    // Make a flat list of routes.
    flatten,
    // Respond with a standard 404 JSON response if API route is not handled.
    flippedConcat(notFoundJsonRoute),
    // Namespace all CRUD routes with '/api'.
    map((route: Route<SupportedRequestBodies, any, SupportedResponseBodies, any, Session>) => namespaceRoute('/api', route))
  ])(resources);

  // Collect all routes.
  let allRoutes = flow([
    // API routes.
    flippedConcat(crudRoutes),
    // Front-end router.
    flippedConcat(FrontEndRouter),
    // Add global hooks to all routes.
    map((route: Route<SupportedRequestBodies, any, SupportedResponseBodies, any, Session>) => addHooksToRoute(hooks, route))
  ])([]);

  // Add basic auth if required.
  if (params.basicAuth) {
    allRoutes = allRoutes.map(basicAuth({
      ...params.basicAuth,
      mapHook: a => a
    }));
  }

  // Add the status router.
  // This should not be behind basic auth.
  allRoutes = StatusRouter.concat(allRoutes);

  return allRoutes;
}
