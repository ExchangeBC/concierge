import { concat, flow, map } from 'lodash/fp';
import * as mongoose from 'mongoose';
import { PORT } from './config';
import loggerHook from './hooks/logger';
import * as crud from './lib/crud';
import { makeDomainLogger } from './lib/logger';
import { console } from './lib/logger/adapters';
import { addHooksToRoute, JsonResponseBody, namespaceRoute, notFoundJsonRoute, Route } from './lib/server';
import { express } from './lib/server/adapters';
import userResource from './resources/user';
import frontEndRouter from './routers/front-end';
import * as UserSchema from './schemas/user';

const logger = makeDomainLogger(console, 'back-end');

// Models
const UserModel: UserSchema.Model = mongoose.model(UserSchema.NAME, UserSchema.schema);

// Set up global hooks.
const hooks = [
  loggerHook
];

// Set up app router.
// We need to use `flippedConcat` as using `concat` binds the routes in the wrong order.
const flippedConcat = (a: any) => (b: any[]): any[] => concat(b)(a);
const router = flow(
  // API routes.
  flippedConcat(crud.makeRouter(userResource)(UserModel)),
  flippedConcat(notFoundJsonRoute),
  map((route: Route<any, any, any, JsonResponseBody, any>) => namespaceRoute('/api', route)),
  // Front-end router.
  flippedConcat(frontEndRouter),
  // Add global hooks.
  map((route: Route<any, any, any, any, any>) => addHooksToRoute(hooks, route))
)([]);

router.forEach(r => logger.info(r.path));

// Start the server.
express.run(router, PORT);
logger.info('server started', { host: '0.0.0.0', port: String(PORT) });
