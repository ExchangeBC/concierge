import init from 'front-end/lib/app/init';
import router from 'front-end/lib/app/router';
import { Msg, Page, State } from 'front-end/lib/app/types';
import update from 'front-end/lib/app/update';
import view from 'front-end/lib/app/view';
import { App } from 'front-end/lib/framework';
import { UserType } from 'shared/lib/types';

const app: App<State, Msg, Page, UserType> = {
  init,
  update,
  view,
  router
};

export default app;
