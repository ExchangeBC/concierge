import { BASIC_AUTH_PASSWORD_HASH, BASIC_AUTH_USERNAME, getConfigErrors, MONGO_URL, SERVER_HOST, SERVER_PORT } from 'back-end/config';
import * as app from 'back-end/lib/app';
import { FileUploadMetadata, Session } from 'back-end/lib/app/types';
import { makeDomainLogger } from 'back-end/lib/logger';
import { console as consoleAdapter } from 'back-end/lib/logger/adapters';
import * as SessionSchema from 'back-end/lib/schemas/session';
import { makeErrorResponseBody } from 'back-end/lib/server';
import { express, ExpressAdapter } from 'back-end/lib/server/adapters';
import { get } from 'lodash';
import { getString } from 'shared/lib';
import { MAX_MULTIPART_FILES_SIZE } from 'shared/lib/resources/file';
import { optional, validateAuthLevel } from 'shared/lib/validators';

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
  const router = app.createRouter({
    Models,
    basicAuth: BASIC_AUTH_USERNAME && BASIC_AUTH_PASSWORD_HASH
      ? { username: BASIC_AUTH_USERNAME, passwordHash: BASIC_AUTH_PASSWORD_HASH }
      : undefined
  });
  // Bind the server to a port and listen for incoming connections.
  // Need to lock-in Session type here.
  const adapter: ExpressAdapter<Session, FileUploadMetadata> = express();
  const SessionModel = Models.Session;
  adapter({
    router,
    sessionIdToSession: SessionSchema.sessionIdToSession(SessionModel),
    sessionToSessionId: SessionSchema.sessionToSessionId(SessionModel),
    host: SERVER_HOST,
    port: SERVER_PORT,
    maxMultipartFilesSize: MAX_MULTIPART_FILES_SIZE,
    parseFileUploadMetadata(raw) {
      return {
        authLevel: optional(validateAuthLevel, get(raw, 'authLevel')),
        alias: getString(raw, 'alias') || undefined
      };
    }
  });
  logger.info('server started', { host: SERVER_HOST, port: String(SERVER_PORT) });
}

start()
  .catch(error => {
    logger.error('app startup failed', makeErrorResponseBody(error).value);
    process.exit(1);
  });
