import { config } from 'dotenv';
import { resolve } from 'path';

config();

function get(name: string , fallback: string): string {
  return process.env[name] || fallback;
}

export const ENV = get('NODE_ENV', 'production');

export const PORT = parseInt(get('PORT', '3000'), 10);

// Check for automatic service host name for mongodb (should be set if in OpenShift), otherwise use dotenv
export const MONGO_URL = process.env.MONGODB_SERVICE_HOST && process.env.MONGODB_SERVICE_PORT ?
                          `mongodb://${process.env.MONGODB_SERVICE_HOST}:${process.env.MONGODB_SERVICE_PORT}/concierge` :
                          get('MONGO_URL', 'mongodb://localhost:27017/concierge');

export const COOKIE_SECRET = get('COOKIE_SECRET', 'foobar');

export const FRONT_END_BUILD_DIR = resolve(__dirname, '../../build/front-end');
