import { Page } from 'front-end/lib/app/types';
import { Router } from 'front-end/lib/framework';
import { get } from 'lodash';

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
      case 'say':
        return `/say/${page.data.message}`;
      default:
        return '/say/not-found';
    }
  }

};

export default router;
