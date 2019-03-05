import { config } from 'dotenv';
import { resolve } from 'path';

config();

function get(name: string , fallback: string): string {
  return process.env[name] || fallback;
}

function getMongoUrl(): string | null {
  // *SERVICE* variables are set automatically by OpenShift.
  const host = get('MONGODB_SERVICE_HOST', '');
  const port = get('MONGODB_SERVICE_PORT', '');
  const user = get('MONGODB_USER', '');
  const password = get('MONGODB_PASSWORD', '');
  const databaseName = get('MONGODB_DATABASE_NAME', '');
  // Support OpenShift's environment variables.
  if (host && port && user && password && databaseName) {
    return `mongodb://${user}:${password}@${host}:${port}/${databaseName}`;
  } else {
    // Return standard MONGO_URL as fallback.
    return get('MONGO_URL', '') || null;
  }
}

export const ENV = get('NODE_ENV', 'production');

export const HOST = get('HOST', '127.0.0.1');

export const PORT = parseInt(get('PORT', '3000'), 10);

export const MONGO_URL = getMongoUrl();

export const TOKEN_SECRET = get('TOKEN_SECRET', '');

export const COOKIE_SECRET = get('COOKIE_SECRET', '');

export const FRONT_END_BUILD_DIR = resolve(__dirname, '../../build/front-end');

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

export const MAILER_CONFIG = {
  from: get('MAILER_FROM', 'Procurement Concierge Program <noreply@procurement.concierge.gov.bc.ca>'),
  options: ENV === 'development' ? developmentMailerConfigOptions : productionMailerConfigOptions
};

function isPositiveInteger(n: number): boolean {
  return !!n && !isNaN(n) && n >= 0 && Math.abs(PORT % 1) > 0;
}

export function getConfigErrors(): string[] {
  let errors: string[] = [];

  if (ENV !== 'development' && ENV !== 'production') {
    errors.push('NODE_ENV must be either "development" or "production"');
  }

  if (!HOST.match(/^\d+\.\d+\.\d+\.\d+/)) {
    errors.push('HOST must be a valid IP address.');
  }

  if (!isPositiveInteger(PORT)) {
    errors.push('PORT must be a positive integer.');
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

  if (ENV === 'production' && (!MAILER_CONFIG.from || !productionMailerConfigOptions.host || !isPositiveInteger(productionMailerConfigOptions.port))) {
    errors = errors.concat([
      'MAILER_* variables must be properly specified for production.',
      'MAILER_FROM, MAILER_HOST and MAILER_PORT (positive integer) must all be specified.'
    ]);
  }

  if (ENV === 'development' && (!MAILER_CONFIG.from || !developmentMailerConfigOptions.auth.user || !developmentMailerConfigOptions.auth.pass)) {
    errors = errors.concat([
      'MAILER_* variables must be properly specified for development.',
      'MAILER_GMAIL_USER and MAILER_GMAIL_PASS must both be specified.'
    ]);
  }

  return errors;
}
