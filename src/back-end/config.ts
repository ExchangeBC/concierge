import { config } from 'dotenv';

config();

const get = (name, fallback = undefined) => process.env[name] || fallback;

export default {
  env: get('NODE_ENV', 'production'),
  port: parseInt(get('PORT', 3000), 10),
  mongoUrl: get('MONGO_URL', 'mongodb://dev:dev@localhost:27017/concierge'),
  secret: get('SECRET', 'foobar')
};
