import { config } from 'dotenv';
import { resolve } from 'path';

const get = (name, fallback = undefined) => process.env[name] || fallback;
const env = get('NODE_ENV', 'development');

config({
  path: resolve(__dirname, `../../${env}.env`)
});

export default {
  env,
  port: parseInt(get('PORT', 3000), 10),
  mongoUrl: get('MONGO_URL', 'mongodb://dev:dev@localhost:27017/concierge'),
  secret: get('SECRET', 'foobar')
};
