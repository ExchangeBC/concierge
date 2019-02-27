import { Page } from 'front-end/lib/app/types';
import { AuthLevel, Router } from 'front-end/lib/framework';
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
      path: '/sign-up',
      pageId: 'signUp',
      auth: {
        level: AuthLevel.SignedOut,
        redirect: '/say/test-redirect'
      }
    },
    {
      path: '/sign-out',
      pageId: 'signOut'
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
          value: undefined
        };
      case 'loading':
        return {
          tag: 'loading',
          value: null
        };
      case 'signUp':
        return {
          tag: 'signUp',
          value: null
        };
      case 'signOut':
        return {
          tag: 'signOut',
          value: null
        };
      case 'say':
        return {
          tag: 'say',
          value: {
            message: get(params, 'message', '')
          }
        };
      default:
        return {
          tag: 'say',
          value: {
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
      case 'signUp':
        return '/sign-up';
      case 'signOut':
        return '/sign-out';
      case 'say':
        return `/say/${page.value.message}`;
      default:
        return '/say/not-found';
    }
  }

};

export default router;
