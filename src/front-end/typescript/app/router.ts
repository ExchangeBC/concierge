import { get } from 'lodash';
import { ADT, Router } from '../lib/framework';
import * as PageSay from '../pages/say';

export type Page = ADT<'loading', null> | ADT<'loadingTwo', null> | ADT<'say', PageSay.Params>;

export const router: Router<Page> = {

  routes: [
    {
      path: '/loading',
      pageId: 'loading'
    },
    {
      path: '/loading-two',
      pageId: 'loadingTwo'
    },
    {
      path: '/say/:message',
      pageId: 'say'
    },
    {
      path: '*',
      pageId: 'notFound'
    }
  ],

  locationToPage(pageId, params) {
    switch (pageId) {
      case 'loading':
        return {
          tag: 'loading',
          data: null
        };
      case 'loadingTwo':
        return {
          tag: 'loadingTwo',
          data: null
        };
      case 'say':
        return {
          tag: 'say',
          data: {
            message: get(params, 'message', '')
          }
        };
      default:
        return {
          tag: 'say',
          data: {
            message: 'Not Found'
          }
        };
    }
  },

  pageToUrl(page) {
    switch (page.tag) {
      case 'loading':
        return '/loading';
      case 'loadingTwo':
        return '/loading-two';
      case 'say':
        return `/say/${page.data.message}`;
      default:
        return '/say/not-found';
    }
  }

};
