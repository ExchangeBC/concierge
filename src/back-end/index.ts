import bodyParser from 'body-parser';
import { default as express, Router } from 'express';
import * as mongoose from 'mongoose';
import { PORT } from './config';
import * as FrontEndHandler from './handlers/front-end';
import * as crud from './lib/crud';
import { makeHandler } from './lib/server';
import UserResource from './resources/user';
import * as UserSchema from './schemas/user';

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
