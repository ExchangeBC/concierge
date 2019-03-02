import { Page } from 'front-end/lib/app/types';
import { AuthLevel, RouteAuthDefinition, Router } from 'front-end/lib/framework';
import * as PageSignUpBuyer from 'front-end/lib/pages/sign-up/buyer';
import * as PageSignUpProgramStaff from 'front-end/lib/pages/sign-up/program-staff';
import * as PageSignUpVendor from 'front-end/lib/pages/sign-up/vendor';

const isSignedOut: RouteAuthDefinition = {
  level: AuthLevel.SignedOut,
  redirect: '/',
  signOut: false
};

const isSignedIn: RouteAuthDefinition = {
  level: AuthLevel.SignedIn,
  redirect: '/sign-in',
  signOut: false
};

const router: Router<Page> = {

  routes: [
    {
      path: '/',
      pageId: 'landing'
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
      path: '/change-password',
      pageId: 'changePassword',
      auth: isSignedIn
    },
    {
      path: '/forgot-password',
      pageId: 'forgotPassword',
      auth: isSignedOut
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
      path: '/notice/change-password',
      pageId: 'noticeChangePassword'
    },
    {
      path: '/notice/forgot-password',
      pageId: 'noticeForgotPassword'
    },
    {
      path: '*',
      pageId: 'noticeNotFound'
    }
  ],

  locationToPage(pageId, params) {
    switch (pageId) {
      case 'landing':
        return {
          tag: 'landing',
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
          value: {} as PageSignUpBuyer.Params
        };
      case 'signUpVendor':
        return {
          tag: 'signUpVendor',
          value: {} as PageSignUpVendor.Params
        };
      case 'signUpProgramStaff':
        return {
          tag: 'signUpProgramStaff',
          value: {} as PageSignUpProgramStaff.Params
        };
      case 'signOut':
        return {
          tag: 'signOut',
          value: null
        };
      case 'changePassword':
        return {
          tag: 'changePassword',
          value: null
        };
      case 'forgotPassword':
        return {
          tag: 'forgotPassword',
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
      case 'noticeChangePassword':
        return {
          tag: 'noticeChangePassword',
          value: null
        };
      case 'noticeForgotPassword':
        return {
          tag: 'noticeForgotPassword',
          value: null
        };
      case 'noticeNotFound':
        return {
          tag: 'noticeNotFound',
          value: null
        };
      // TODO remove default
      default:
        return {
          tag: 'noticeNotFound',
          value: null
        };
    }
  },

  pageToUrl(page) {
    switch (page.tag) {
      case 'landing':
        return '/';
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
      case 'changePassword':
        return '/change-password';
      case 'forgotPassword':
        return '/forgot-password';
      case 'settings':
        return '/settings';
      case 'userList':
        return '/users';
      case 'requestForInformationList':
        return '/request-for-information';
      case 'noticeChangePassword':
        return '/notice/change-password';
      case 'noticeForgotPassword':
        return '/notice/forgot-password';
      case 'noticeNotFound':
        return '/not-found';
    }
  }

};

export default router;
