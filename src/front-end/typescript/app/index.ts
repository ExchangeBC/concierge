import { App } from '../lib/framework';
import init from './init';
import router from './router';
import { Msg, Page, State } from './types';
import update from './update';
import view from './view';

export const app: App<State, Msg, Page> = {
  init,
  update,
  view,
  router
};
