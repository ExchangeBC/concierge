import { config } from 'dotenv';
import { resolve } from 'path';

config();

function get(name: string , fallback: string): string {
  return process.env[name] || fallback;
}

function getMongoUrl() {
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
    return get('MONGO_URL', 'mongodb://localhost:27017/concierge');
  }
}

export const ENV = get('NODE_ENV', 'production');

export const PORT = parseInt(get('PORT', '3000'), 10);

export const MONGO_URL = getMongoUrl();
export const COOKIE_SECRET = get('COOKIE_SECRET', 'foobar');

export const FRONT_END_BUILD_DIR = resolve(__dirname, '../../build/front-end');
