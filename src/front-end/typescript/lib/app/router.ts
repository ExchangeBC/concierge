import { Page } from 'front-end/lib/app/types';
import { AuthLevel, RouteAuthDefinition, Router } from 'front-end/lib/framework';
import { get } from 'lodash';

const isSignedOut: RouteAuthDefinition = {
  level: AuthLevel.SignedOut,
  redirect: '/',
  signOut: false
};

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
      path: '/sign-in',
      pageId: 'signIn',
      auth: isSignedOut
    },
    {
      // Alias the buyer page here.
      path: '/sign-up',
      pageId: 'signUpBuyer',
      auth: isSignedOut
    },
    {
      path: '/sign-up/buyer',
      pageId: 'signUpBuyer',
      auth: isSignedOut
    },
    {
      path: '/sign-up/vendor',
      pageId: 'signUpVendor',
      auth: isSignedOut
    },
    {
      path: '/sign-up/program-staff',
      pageId: 'signUpProgramStaff',
      auth: isSignedOut
    },
    {
      path: '/sign-out',
      pageId: 'signOut',
      auth: {
        level: AuthLevel.SignedOut,
        redirect: '/sign-out',
        // signOut must be true, or this will trigger an infinite loop.
        signOut: true
      }
    },
    {
      path: '/settings',
      pageId: 'settings'
    },
    {
      path: '/users',
      pageId: 'userList'
    },
    {
      path: '/requests-for-information',
      pageId: 'requestForInformationList'
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
          value: null
        };
      case 'loading':
        return {
          tag: 'loading',
          value: null
        };
      case 'signIn':
        return {
          tag: 'signIn',
          value: null
        };
      case 'signUpBuyer':
        return {
          tag: 'signUpBuyer',
          value: null
        };
      case 'signUpVendor':
        return {
          tag: 'signUpVendor',
          value: null
        };
      case 'signUpProgramStaff':
        return {
          tag: 'signUpProgramStaff',
          value: null
        };
      case 'signOut':
        return {
          tag: 'signOut',
          value: null
        };
      case 'settings':
        return {
          tag: 'settings',
          value: null
        };
      case 'userList':
        return {
          tag: 'userList',
          value: null
        };
      case 'requestForInformationList':
        return {
          tag: 'requestForInformationList',
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
      case 'signIn':
        return '/sign-in';
      case 'signUpBuyer':
        return '/sign-up/buyer';
      case 'signUpVendor':
        return '/sign-up/vendor';
      case 'signUpProgramStaff':
        return '/sign-up/program-staff';
      case 'signOut':
        return '/sign-out';
      case 'settings':
        return '/settings';
      case 'userList':
        return '/users';
      case 'requestForInformationList':
        return '/request-for-information';
      case 'say':
        return `/say/${page.value.message}`;
      default:
        return '/say/not-found';
    }
  }

};

export default router;
