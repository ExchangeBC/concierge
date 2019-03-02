import { Init } from 'front-end/lib/framework';
import * as Notice from 'front-end/lib/pages/notice/components/notice';

export type Params = null;

export type Msg = Notice.Msg;

export type State = Notice.State;

export const init: Init<Params, State> = async () => {
  return {
    title: 'Check Your Inbox',
    body: 'We have sent you an email with instructions on how to reset your password.',
    button: {
      text: 'Return to the Home Page',
      page: {
        tag: 'landing',
        value: null
      }
    }
  };
};

export const update = Notice.update;

export const view = Notice.view;

export const component = {
  init,
  update: Notice.update,
  view: Notice.view
};
