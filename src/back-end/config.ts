import { config } from 'dotenv';
import { resolve } from 'path';

config();

function get(name: string , fallback: string): string {
  return process.env[name] || fallback;
}

export const ENV = get('NODE_ENV', 'production');

export const PORT = parseInt(get('PORT', '3000'), 10);

export const MONGO_URL = get('MONGO_URL', 'mongodb://localhost:27017/concierge');

export const SECRET = get('SECRET', 'foobar');

export const FRONT_END_BUILD_DIR = resolve(__dirname, '../../build/front-end');
