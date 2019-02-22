import { MONGO_URL, PORT } from 'back-end/config';
import loggerHook from 'back-end/hooks/logger';
import * as crud from 'back-end/lib/crud';
import { makeDomainLogger } from 'back-end/lib/logger';
import { console } from 'back-end/lib/logger/adapters';
import { addHooksToRoute, JsonResponseBody, namespaceRoute, notFoundJsonRoute, Route } from 'back-end/lib/server';
import { express } from 'back-end/lib/server/adapters';
import userResource from 'back-end/resources/user';
import frontEndRouter from 'back-end/routers/front-end';
import * as BuyerProfileSchema from 'back-end/schemas/buyer-profile';
import * as ProgramStaffProfileSchema from 'back-end/schemas/program-staff-profile';
import * as UserSchema from 'back-end/schemas/user';
import * as VendorProfileSchema from 'back-end/schemas/vendor-profile';
import { Map } from 'immutable';
import { concat, flatten, flow, map } from 'lodash/fp';
import mongoose from 'mongoose';

const logger = makeDomainLogger(console, 'back-end');

function connect(mongoUrl: string) {
  return new Promise((resolve, reject) => {
    mongoose.connect(mongoUrl, {
      useNewUrlParser: true
    });
    const db = mongoose.connection;
    db.once('error', reject);
    db.once('open', () => resolve());
  });
}

async function start() {
  // Connect to MongoDB.
  await connect(MONGO_URL);
  logger.info('connected to MongoDB');
  // Declare resources.
  const resources: Array<crud.Resource<any, any, any, any, any, any, any, any>> = [
    userResource
  ];
  // Declare models as a map.
  const Models: Map<string, mongoose.Model<any>> = Map({
    [UserSchema.NAME]: mongoose.model(UserSchema.NAME, UserSchema.schema),
    [BuyerProfileSchema.NAME]: mongoose.model(BuyerProfileSchema.NAME, BuyerProfileSchema.schema),
    [VendorProfileSchema.NAME]: mongoose.model(VendorProfileSchema.NAME, VendorProfileSchema.schema),
    [ProgramStaffProfileSchema.NAME]: mongoose.model(ProgramStaffProfileSchema.NAME, ProgramStaffProfileSchema.schema)
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
    map((resource: crud.Resource<any, any, any, any, any, any, any, any>) => {
      const Model = Models.get(resource.MODEL_NAME);
      if (Model) {
        logger.info('created resource router', { routeNamespace: resource.ROUTE_NAMESPACE });
        return crud.makeRouter(resource)(Model);
      } else {
        // Throw an error if a requested model doesn't exist for a resource.
        const msg = 'could not create resource router: undefined Model';
        logger.error(msg, { routeNamespace: resource.ROUTE_NAMESPACE });
        throw new Error(msg);
      }
    }),
    // Make a flat list of routes.
    flatten,
    // Respond with a standard 404 JSON response if API route is not handled.
    flippedConcat(notFoundJsonRoute),
    // Namespace all CRUD routes with '/api'.
    map((route: Route<any, any, any, JsonResponseBody, any>) => namespaceRoute('/api', route))
  ])(resources);
  // Set up the app router.
  const router = flow([
    // API routes.
    flippedConcat(crudRoutes),
    // Front-end router.
    flippedConcat(frontEndRouter),
    // Add global hooks to all routes.
    map((route: Route<any, any, any, any, any>) => addHooksToRoute(hooks, route))
  ])([]);
  // Bind the server to a port and listen for incoming connections.
  express.run(router, PORT);
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
