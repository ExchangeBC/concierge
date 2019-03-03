import { Page, State } from 'front-end/lib/app/types';
import { RouteAuthDefinition, Router } from 'front-end/lib/framework';
import * as PageSignUpProgramStaff from 'front-end/lib/pages/sign-up/program-staff';
import { get } from 'lodash';
import { getString } from 'shared/lib';
import { UserType } from 'shared/lib/types';

const isSignedOut: RouteAuthDefinition<UserType> = {
  level: { tag: 'signedOut', value: undefined },
  redirect: '/',
  signOut: false
};

const isSignedIn: RouteAuthDefinition<UserType> = {
  level: { tag: 'signedIn', value: undefined },
  redirect: '/sign-in',
  signOut: false
};

const isBuyerOrVendor: RouteAuthDefinition<UserType> = {
  level: { tag: 'userType', value: [UserType.Buyer, UserType.Vendor] },
  redirect: '/',
  signOut: false
};

const isProgramStaff: RouteAuthDefinition<UserType> = {
  level: { tag: 'userType', value: [UserType.ProgramStaff] },
  redirect: '/',
  signOut: false
};

const router: Router<State, Page, UserType> = {

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
      // Alias the buyer sign-up page.
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
      auth: isProgramStaff
    },
    {
      path: '/sign-out',
      pageId: 'signOut',
      auth: {
        level: { tag: 'signedOut', value: undefined },
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
      path: '/reset-password/:forgotPasswordToken/:userId',
      pageId: 'resetPassword'
    },
    {
      path: '/forgot-password',
      pageId: 'forgotPassword',
      auth: isSignedOut
    },
    {
      path: '/profile/:userId',
      pageId: 'profile',
      auth: isSignedIn
    },
    {
      path: '/terms-and-conditions',
      pageId: 'termsAndConditions',
      auth: isBuyerOrVendor
    },
    {
      path: '/users',
      pageId: 'userList',
      auth: isProgramStaff
    },
    {
      path: '/requests-for-information',
      pageId: 'requestForInformationList',
      auth: isSignedIn
    },
    {
      path: '/notice/change-password',
      pageId: 'noticeChangePassword'
    },
    {
      path: '/notice/reset-password',
      pageId: 'noticeResetPassword'
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

  locationToPage(pageId, params, state) {
    const outgoingPage = state.activePage;
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
        let signUpBuyerParams = {};
        if (outgoingPage.tag === 'signUpVendor' && state.pages.signUpVendor) {
          signUpBuyerParams = {
            accountInformation: state.pages.signUpVendor.accountInformation.set('userType', UserType.Buyer)
          };
        }
        return {
          tag: 'signUpBuyer',
          value: signUpBuyerParams
        };
      case 'signUpVendor':
        let signUpVendorParams = {};
        if (outgoingPage.tag === 'signUpBuyer' && state.pages.signUpBuyer) {
          signUpVendorParams = {
            accountInformation: state.pages.signUpBuyer.accountInformation.set('userType', UserType.Vendor)
          };
        }
        return {
          tag: 'signUpVendor',
          value: signUpVendorParams
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
          value: {
            userId: getString(state.session, ['user', 'id'])
          }
        };
      case 'resetPassword':
        return {
          tag: 'resetPassword',
          value: {
            forgotPasswordToken: getString(params, 'forgotPasswordToken'),
            userId: getString(params, 'userId')
          }
        };
      case 'forgotPassword':
        return {
          tag: 'forgotPassword',
          value: null
        };
      case 'profile':
        return {
          tag: 'profile',
          value: {
            profileUserId: getString(params, 'userId'),
            viewerUser: state.getIn(['session', 'user'])
          }
        };
      case 'termsAndConditions':
        return {
          tag: 'termsAndConditions',
          value: {
            userId: get(state.session, ['user', 'id'], '')
          }
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
      case 'noticeResetPassword':
        return {
          tag: 'noticeResetPassword',
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
      case 'resetPassword':
        return `/reset-password/${page.value.forgotPasswordToken}/${page.value.userId}`;
      case 'forgotPassword':
        return '/forgot-password';
      case 'profile':
        return `/profile/${page.value.profileUserId}`;
      case 'termsAndConditions':
        return '/terms-and-conditions';
      case 'userList':
        return '/users';
      case 'requestForInformationList':
        return '/request-for-information';
      case 'noticeChangePassword':
        return '/notice/change-password';
      case 'noticeResetPassword':
        return '/notice/reset-password';
      case 'noticeForgotPassword':
        return '/notice/forgot-password';
      case 'noticeNotFound':
        return '/not-found';
    }
  }

};

export default router;
