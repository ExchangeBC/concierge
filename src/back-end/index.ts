import { getConfigErrors, MONGO_URL, SERVER_HOST, SERVER_PORT } from 'back-end/config';
import * as app from 'back-end/lib/app';
import { makeDomainLogger } from 'back-end/lib/logger';
import { console as consoleAdapter } from 'back-end/lib/logger/adapters';
import * as SessionSchema from 'back-end/lib/schemas/session';
import { express, ExpressAdapter } from 'back-end/lib/server/adapters';
import { MAX_MULTIPART_FILES_SIZE } from 'shared/lib/resources/file';

const logger = makeDomainLogger(consoleAdapter, 'back-end');

async function start() {
  // Ensure all environment variables are specified correctly.
  const configErrors = getConfigErrors();
  if (configErrors.length || !MONGO_URL) {
    configErrors.forEach((error: string) => logger.error(error));
    throw new Error('Invalid environment variable configuration.');
  }
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
    host: SERVER_HOST,
    port: SERVER_PORT,
    maxMultipartFilesSize: MAX_MULTIPART_FILES_SIZE
  });
  logger.info('server started', { host: SERVER_HOST, port: String(SERVER_PORT) });
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
