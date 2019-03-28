import { Init } from 'front-end/lib/framework';
import * as Notice from 'front-end/lib/pages/notice/components/notice';

export interface Params {
  rfiId?: string;
};

export type Msg = Notice.Msg;

export type State = Notice.State;

export const init: Init<Params, State> = async ({ rfiId }) => {
  const defaultState: State = {
    title: 'Only Vendors can respond to RFIs',
    body: 'You must be signed in as a Vendor to respond to this Request for Information.'
  };
  if (rfiId) {
    return {
      ...defaultState,
      button: {
        text: 'View the RFI\'s Details',
        page: {
          tag: 'requestForInformationView' as 'requestForInformationView',
          value: { rfiId }
        }
      }
    };
  }
  return {
    ...defaultState,
    button: {
      text: 'View All RFIs',
      page: {
        tag: 'requestForInformationList' as 'requestForInformationList',
        value: {} as {}
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
