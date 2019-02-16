import bodyParser from 'body-parser';
import { default as express, Router } from 'express';
import * as mongoose from 'mongoose';
import { PORT } from './config';
import * as FrontEndHandler from './handlers/front-end';
import * as crud from './lib/crud';
import { makeDomainLogger } from './lib/logger';
import { console } from './lib/logger/adapters';
import { makeHandler } from './lib/server';
import UserResource from './resources/user';
import * as UserSchema from './schemas/user';

const logger = makeDomainLogger(console, 'back-end');

// Models
const UserModel: UserSchema.Model = mongoose.model(UserSchema.NAME, UserSchema.schema);

// Initialize main express app.
const app = express();

// API
const api: Router = Router();
api.use(`/${UserResource.ROUTE_NAMESPACE}`, crud.router(UserResource)(UserModel));
app.use('/api', bodyParser.json(), api);

// Front-end

app.use(makeHandler(FrontEndHandler.handler));

// Listen.
app.listen(PORT);
logger.info('server started', { host: '0.0.0.0', port: String(PORT) });
