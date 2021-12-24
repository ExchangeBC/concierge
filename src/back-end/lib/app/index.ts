import { SCHEDULED_MAINTENANCE } from 'back-end/config';
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
import ViResource from 'back-end/lib/resources/vendor-idea';
import ViLogItemResource from 'back-end/lib/resources/vendor-idea/log-item';
import AdminRouter from 'back-end/lib/routers/admin';
import FrontEndRouter from 'back-end/lib/routers/front-end';
import StatusRouter from 'back-end/lib/routers/status';
import FeatureFlagRouter from 'back-end/lib/routers/feature-flag';
import * as FeedbackSchema from 'back-end/lib/schemas/feedback';
import * as FileSchema from 'back-end/lib/schemas/file';
import * as ForgotPasswordTokenSchema from 'back-end/lib/schemas/forgot-password-token';
import * as RfiSchema from 'back-end/lib/schemas/request-for-information';
import * as RfiResponseSchema from 'back-end/lib/schemas/request-for-information/response';
import * as SessionSchema from 'back-end/lib/schemas/session';
import * as UserSchema from 'back-end/lib/schemas/user';
import * as ViSchema from 'back-end/lib/schemas/vendor-idea';
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
    Session: mongoose.model<SessionSchema.Data & mongoose.Document>('Session', SessionSchema.schema),
    User: mongoose.model<UserSchema.Data & mongoose.Document>('User', UserSchema.schema),
    Feedback: mongoose.model<FeedbackSchema.Data & mongoose.Document>('Feedback', FeedbackSchema.schema),
    ForgotPasswordToken: mongoose.model<ForgotPasswordTokenSchema.Data & mongoose.Document>('ForgotPasswordToken', ForgotPasswordTokenSchema.schema),
    File: mongoose.model<FileSchema.Data & mongoose.Document>('File', FileSchema.schema),
    Rfi: mongoose.model<RfiSchema.Data & mongoose.Document>('Rfi', RfiSchema.schema),
    RfiPreview: mongoose.model<RfiSchema.Data & mongoose.Document>('RfiPreview', RfiSchema.schema),
    RfiResponse: mongoose.model<RfiResponseSchema.Data & mongoose.Document>('RfiResponse', RfiResponseSchema.schema),
    VendorIdea: mongoose.model<ViSchema.Data & mongoose.Document>('VendorIdea', ViSchema.schema)
  };
}

interface CreateRouterParams {
  Models: AvailableModels;
  basicAuth?: {
    username: string;
    passwordHash: string;
  };
}

export function createRouter(params: CreateRouterParams): Router<SupportedRequestBodies, SupportedResponseBodies, Session> {
  const hooks = [loggerHook];

  // Add new resources to this array.
  const resources: Array<crud.Resource<SupportedRequestBodies, SupportedResponseBodies, AvailableModels, any, any, any, Session>> = [UserResource, SessionResource, ForgotPasswordTokenResource, FeedbackResource, FileResource, FileBlobResource, RfiResource, RfiPreviewResource, DiscoveryDayResponseResource, RfiResponseResource, ViResource, ViLogItemResource];

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
    // Do not expose CRUD routes if undergoing scheduled maintenance.
    flippedConcat(SCHEDULED_MAINTENANCE ? [] : crudRoutes),
    // Vend an HTML page with all email notifications for reference.
    flippedConcat(AdminRouter().map((r) => namespaceRoute('/admin', r))),
    // Front-end router.
    // Vend the downtime HTML file during scheduled maintenance.
    flippedConcat(FrontEndRouter(SCHEDULED_MAINTENANCE ? 'downtime.html' : 'index.html')),
    // Add global hooks to all routes.
    map((route: Route<SupportedRequestBodies, any, SupportedResponseBodies, any, Session>) => addHooksToRoute(hooks, route))
  ])([]);

  // Add basic auth if required.
  if (params.basicAuth) {
    allRoutes = allRoutes.map(
      basicAuth({
        ...params.basicAuth,
        mapHook: (a) => a
      })
    );
  }

  // Add the feature flag router so the front-end can query for feature flags
  allRoutes = FeatureFlagRouter.concat(allRoutes);

  // Add the status router.
  // This should not be behind basic auth.
  allRoutes = StatusRouter.concat(allRoutes);

  return allRoutes;
}
