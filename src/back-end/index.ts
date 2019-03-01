import { MONGO_URL, PORT } from 'back-end/config';
import * as app from 'back-end/lib/app';
import { makeDomainLogger } from 'back-end/lib/logger';
import { console as consoleAdapter } from 'back-end/lib/logger/adapters';
import * as SessionSchema from 'back-end/lib/schemas/session';
import { express, ExpressAdapter } from 'back-end/lib/server/adapters';

const logger = makeDomainLogger(consoleAdapter, 'back-end');

async function start() {
  // Connect to MongoDB.
  await app.connectToDatabase(MONGO_URL);
  logger.info('connected to MongoDB');
  const Models = app.createModels();
  const router = app.createRouter(Models);
  // Bind the server to a port and listen for incoming connections.
  // Need to lock-in Session type here.
  const adapter: ExpressAdapter<app.Session> = express();
  const SessionModel = Models.Session;
  adapter({
    router,
    sessionIdToSession: SessionSchema.sessionIdToSession(SessionModel),
    sessionToSessionId: SessionSchema.sessionToSessionId(SessionModel),
    port: PORT
  });
  // TODO broadcast on 0.0.0.0
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
