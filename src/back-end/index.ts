import { MONGO_URL, PORT } from 'back-end/config';
import * as crud from 'back-end/lib/crud';
import loggerHook from 'back-end/lib/hooks/logger';
import { makeDomainLogger } from 'back-end/lib/logger';
import { console as consoleAdapter } from 'back-end/lib/logger/adapters';
import sessionResource from 'back-end/lib/resources/session';
import userResource from 'back-end/lib/resources/user';
import frontEndRouter from 'back-end/lib/routers/front-end';
import * as SessionSchema from 'back-end/lib/schemas/session';
import * as UserSchema from 'back-end/lib/schemas/user';
import { addHooksToRoute, JsonResponseBody, namespaceRoute, notFoundJsonRoute, Route } from 'back-end/lib/server';
import { express, ExpressAdapter } from 'back-end/lib/server/adapters';
import { Map, Set } from 'immutable';
import { concat, flatten, flow, map } from 'lodash/fp';
import mongoose from 'mongoose';
import { model } from 'mongoose';

const logger = makeDomainLogger(consoleAdapter, 'back-end');

type Session = SessionSchema.Data;

async function start() {
  // Connect to MongoDB.
  await mongoose.connect(MONGO_URL, {
    useNewUrlParser: true
  });
  logger.info('connected to MongoDB');
  // Declare resources.
  const resources: Array<crud.Resource<any, any, any, any, any, any, any, any, any, Session>> = [
    userResource,
    sessionResource
  ];
  // Declare models as a map.
  const SessionModel: SessionSchema.Model = model(SessionSchema.NAME, SessionSchema.schema);
  const Models: Map<string, mongoose.Model<mongoose.Document>> = Map({
    [UserSchema.NAME]: model(UserSchema.NAME, UserSchema.schema),
    [SessionSchema.NAME]: SessionModel
  });
  // Declare global hooks.
  const hooks = [
    loggerHook
  ];
  // Define CRUD routes.
  // We need to use `flippedConcat` as using `concat` binds the routes in the wrong order.
  const flippedConcat = (a: any) => (b: any[]): any[] => concat(b)(a);
  const crudRoutes = flow([
    // Create routers from resources.
    map((resource: crud.Resource<any, any, any, any, any, any, any, any, any, Session>) => {
      const Model = Models.get(resource.model);
      const extraModels = resource.extraModels || Set([]);
      const ExtraModels = Models.filter((v, k) => !!extraModels.get(k));
      if (Model && extraModels.size === ExtraModels.size) {
        logger.info('created resource router', { routeNamespace: resource.routeNamespace });
        return crud.makeRouter(resource)(Model, ExtraModels);
      } else {
        // Throw an error if a requested model doesn't exist for a resource.
        const msg = 'could not create resource router; Model is undefined';
        logger.error(msg, { routeNamespace: resource.routeNamespace, model: resource.model, extraModels: resource.extraModels });
        throw new Error(msg);
      }
    }),
    // Make a flat list of routes.
    flatten,
    // Respond with a standard 404 JSON response if API route is not handled.
    flippedConcat(notFoundJsonRoute),
    // Namespace all CRUD routes with '/api'.
    map((route: Route<any, any, any, JsonResponseBody, any, Session>) => namespaceRoute('/api', route))
  ])(resources);
  // Set up the app router.
  const router = flow([
    // API routes.
    flippedConcat(crudRoutes),
    // Front-end router.
    flippedConcat(frontEndRouter),
    // Add global hooks to all routes.
    map((route: Route<any, any, any, any, any, Session>) => addHooksToRoute(hooks, route))
  ])([]);
  // Bind the server to a port and listen for incoming connections.
  // Need to lock-in Session type here.
  const adapter: ExpressAdapter<Session> = express();
  adapter({
    router,
    sessionIdToSession: SessionSchema.sessionIdToSession(SessionModel),
    sessionToSessionId: SessionSchema.sessionToSessionId(SessionModel),
    port: PORT
  });
  logger.info('server started', { host: '0.0.0.0', port: String(PORT) });
}

start()
  .catch(err => {
    logger.error('app startup failed', {
      stack: err.stack,
      message: err.message,
      raw: err
    });
    process.exit(1);
  });
