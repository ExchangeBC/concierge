import bodyParser from 'body-parser';
import { default as express, Router } from 'express';
import * as mongoose from 'mongoose';
import * as crud from './lib/crud';
import UserResource from './resources/user';
import * as UserSchema from './schemas/user';

function start(port: number): void {
  // Models
  const UserModel: UserSchema.Model = mongoose.model(UserSchema.NAME, UserSchema.schema);
  // API
  const api: Router = Router();
  api.use(`/${UserResource.ROUTE_NAMESPACE}`, crud.router(UserResource)(UserModel));
  // Main express app
  const app = express();
  app.use('/api', bodyParser.json(), api);
  app.listen(port);
}

start(3000);
