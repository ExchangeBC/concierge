import { makeDomainLogger } from 'back-end/lib/logger';
import { console as consoleAdapter } from 'back-end/lib/logger/adapters';
import dotenv from 'dotenv';
import { existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import url from 'url';

const logger = makeDomainLogger(consoleAdapter, 'back-end:config');

// export the root directory of the repository.
export const REPOSITORY_ROOT_DIR = resolve(__dirname, '../../');

// Load environment variables from a .env file.
dotenv.config({
  debug: process.env.NODE_ENV === 'development',
  path: resolve(REPOSITORY_ROOT_DIR, '.env')
});

function get(name: string , fallback: string): string {
  return process.env[name] || fallback;
}

function getMongoUrl(): string | null {
  // *SERVICE* variables are set automatically by OpenShift.
  const databaseServiceName = (process.env.DATABASE_SERVICE_NAME || 'mongodb').toUpperCase().replace(/-/g, '_');
  const host = get(`${databaseServiceName}_SERVICE_HOST`, '');
  const port = get(`${databaseServiceName}_SERVICE_PORT`, '');
  const user = get('MONGODB_USER', '');
  const password = get('MONGODB_PASSWORD', '');
  const databaseName = get('MONGODB_DATABASE_NAME', '');
  const replicaSetName = get('MONGODB_REPLICA_NAME', '')
  // Support OpenShift's environment variables.
  if (host && port && user && password && databaseName) {
    const mongoUrl = `mongodb://${user}:${password}@${host}:${port}/${databaseName}`;
    if (replicaSetName) {
      return `${mongoUrl}?replicaSet=${replicaSetName}`
    } else {
      return mongoUrl
    }
  } else {
    // Return standard MONGO_URL as fallback.
    return get('MONGO_URL', '') || null;
  }
}

export const ENV = get('NODE_ENV', 'production');

export const SERVER_HOST = get('SERVER_HOST', '127.0.0.1');

export const SERVER_PORT = parseInt(get('SERVER_PORT', '3000'), 10);

export const BASIC_AUTH_USERNAME = get('BASIC_AUTH_USERNAME', '');

export const BASIC_AUTH_PASSWORD_HASH = get('BASIC_AUTH_PASSWORD_HASH', '');

export const MONGO_URL = getMongoUrl();

export const TOKEN_SECRET = get('TOKEN_SECRET', '');

export const COOKIE_SECRET = get('COOKIE_SECRET', '');

export const SCHEDULED_MAINTENANCE = !!parseInt(get('SCHEDULED_MAINTENANCE', '0'), 10);

export const FRONT_END_BUILD_DIR = resolve(REPOSITORY_ROOT_DIR, 'build/front-end');

const fileStorageDir = get('FILE_STORAGE_DIR', '');
export const FILE_STORAGE_DIR = fileStorageDir && resolve(REPOSITORY_ROOT_DIR, fileStorageDir);

export const TMP_DIR = join(FILE_STORAGE_DIR, '__tmp');

const productionMailerConfigOptions = {
  host: get('MAILER_HOST', ''),
  port: parseInt(get('MAILER_PORT', '25'), 10),
  secure: false,
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  ignoreTLS: false,
  tls: {
    rejectUnauthorized: false
  }
};

const developmentMailerConfigOptions = {
  service: 'gmail',
  auth: {
    user: get('MAILER_GMAIL_USER', ''),
    pass: get('MAILER_GMAIL_PASS', '')
  },
  tls: {
    rejectUnauthorized: false
  }
};

export const MAILER_CONFIG = ENV === 'development' ? developmentMailerConfigOptions : productionMailerConfigOptions;

export const MAILER_NOREPLY = 'noreply@procurementconcierge.gov.bc.ca';

export const MAILER_FROM = get('MAILER_FROM', `Procurement Concierge Program <${MAILER_NOREPLY}>`);

export const MAILER_ROOT_URL = get('MAILER_ROOT_URL', 'https://procurementconcierge.gov.bc.ca').replace(/\/*$/, '');

export const CONTACT_EMAIL = get('CONTACT_EMAIL', '');

function isPositiveInteger(n: number): boolean {
  return !isNaN(n) && !!n && n >= 0 && Math.abs(n % 1) === 0;
}

function errorToJson(error: Error): object {
  return {
    message: error.message,
    stack: error.stack,
    raw: error.toString()
  };
}

export function getConfigErrors(): string[] {
  let errors: string[] = [];

  if (ENV !== 'development' && ENV !== 'production') {
    errors.push('NODE_ENV must be either "development" or "production"');
  }

  if (!SERVER_HOST.match(/^\d+\.\d+\.\d+\.\d+/)) {
    errors.push('SERVER_HOST must be a valid IP address.');
  }

  if (!isPositiveInteger(SERVER_PORT)) {
    errors.push('SERVER_PORT must be a positive integer.');
  }

  if (BASIC_AUTH_USERNAME && !BASIC_AUTH_PASSWORD_HASH) {
    errors.push('BASIC_AUTH_PASSWORD_HASH must be specified if BASIC_AUTH_USERNAME is non-empty.');
  }

  if (!BASIC_AUTH_USERNAME && BASIC_AUTH_PASSWORD_HASH) {
    errors.push('BASIC_AUTH_USERNAME must be specified if BASIC_AUTH_PASSWORD_HASH is non-empty.');
  }

  if (!MONGO_URL) {
    errors = errors.concat([
      'MONGO* variables must be a properly specified.',
      'Either specify MONGO_URL, or specify the MONGODB_SERVICE_HOST, MONGODB_SERVICE_PORT, MONGODB_USER, MONGODB_PASSWORD, MONGODB_DATABASE_NAME environment variables.'
    ]);
  }

  if (!TOKEN_SECRET) {
    errors.push('TOKEN_SECRET must be specified.');
  }

  if (!COOKIE_SECRET) {
    errors.push('COOKIE_SECRET must be specified.');
  }

  // TODO validate FILE_STORAGE_DIR is a directory
  // and we have correct write permissions.
  if (!FILE_STORAGE_DIR) {
    errors.push('FILE_STORAGE_DIR must be specified.');
  }
  // Create FILE_STORAGE_DIR
  try {
    if (!existsSync(FILE_STORAGE_DIR)) {
      mkdirSync(FILE_STORAGE_DIR, { recursive: true });
    }
  } catch (error) {
    logger.error('error caught trying to create FILE_STORAGE_DIR', errorToJson(error));
    errors.push('FILE_STORAGE_DIR does not exist and this process was unable to create it.');
  }

  // TODO validate TMP_DIR is a directory
  // and we have correct write permissions.
  if (!TMP_DIR) {
    errors.push('TMP_DIR must be specified.');
  }
  // Create TMP_DIR
  try {
    if (!existsSync(TMP_DIR)) {
      mkdirSync(TMP_DIR, { recursive: true });
    }
  } catch (error) {
    logger.error('error caught trying to create TMP_DIR', errorToJson(error));
    errors.push('TMP_DIR does not exist and this process was unable to create it.');
  }

  if (ENV === 'production' && (!productionMailerConfigOptions.host || !isPositiveInteger(productionMailerConfigOptions.port))) {
    errors = errors.concat([
      'MAILER_* variables must be properly specified for production.',
      'MAILER_HOST and MAILER_PORT (positive integer) must all be specified.'
    ]);
  }

  if (ENV === 'development' && (!developmentMailerConfigOptions.auth.user || !developmentMailerConfigOptions.auth.pass)) {
    errors = errors.concat([
      'MAILER_* variables must be properly specified for development.',
      'MAILER_GMAIL_USER and MAILER_GMAIL_PASS must both be specified.'
    ]);
  }

  if (!MAILER_FROM || !MAILER_FROM.match(/^[^<>@]+<[^@]+@[^@]+\.[^@]+>$/)) {
    errors.push('MAILER_FROM must be specified using the format: "Name <email@domain.tld>".');
  }

  const mailerRootUrl = url.parse(MAILER_ROOT_URL);
  if (!MAILER_ROOT_URL || !mailerRootUrl.protocol || !mailerRootUrl.host) {
    errors.push('MAILER_ROOT_URL must be specified as a valid URL with a protocol and host.');
  }

  if (!CONTACT_EMAIL || !CONTACT_EMAIL.match(/^[^@]+@[^@]+\.[^@]+$/)) {
    errors.push('CONTACT_EMAIL must be specified as a valid email address.');
  }

  return errors;
}
