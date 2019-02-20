import { get } from 'lodash';
import { Router } from '../lib/framework';
import { Page } from './types';

const router: Router<Page> = {

  routes: [
    {
      path: '/',
      pageId: 'landing'
    },
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
      case 'landing':
        return {
          tag: 'landing',
          data: undefined
        };
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
      case 'landing':
        return '/';
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

export default router;
