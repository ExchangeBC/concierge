import { Page, State } from 'front-end/lib/app/types';
import { RouteAuthDefinition, Router } from 'front-end/lib/framework';
import * as PageSignUpBuyer from 'front-end/lib/pages/sign-up/buyer';
import * as PageSignUpVendor from 'front-end/lib/pages/sign-up/vendor';
import { get } from 'lodash';
import { getString } from 'shared/lib';
import { UserType } from 'shared/lib/types';

const PAGE_TITLE_SUFFIX = 'BC Concierge';

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
  redirect: '/sign-in',
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
      path: '/terms-and-conditions',
      pageId: 'termsAndConditions',
      auth: isBuyerOrVendor
    },
    {
      path: '/profile/:userId',
      pageId: 'profile',
      auth: isSignedIn
    },
    {
      path: '/users',
      pageId: 'userList',
      auth: isProgramStaff
    },
    {
      path: '/about',
      pageId: 'about'
    },
    {
      path: '/accessibility',
      pageId: 'accessibility'
    },
    {
      path: '/copyright',
      pageId: 'copyright'
    },
    {
      path: '/disclaimer',
      pageId: 'disclaimer'
    },
    {
      path: '/privacy',
      pageId: 'privacy'
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
        const signUpBuyerParams: PageSignUpBuyer.Params = {
          fixedBarBottom: state.fixedBarBottom
        };
        if (outgoingPage.tag === 'signUpBuyer' && state.pages.signUpBuyer) {
          signUpBuyerParams.accountInformation = state.pages.signUpBuyer.accountInformation.set('userType', UserType.Buyer);
        }
        return {
          tag: 'signUpBuyer',
          value: signUpBuyerParams
        };
      case 'signUpVendor':
        const signUpVendorParams: PageSignUpVendor.Params = {
          fixedBarBottom: state.fixedBarBottom
        };
        if (outgoingPage.tag === 'signUpBuyer' && state.pages.signUpBuyer) {
          signUpVendorParams.accountInformation = state.pages.signUpBuyer.accountInformation.set('userType', UserType.Vendor);
        }
        return {
          tag: 'signUpVendor',
          value: signUpVendorParams
        };
      case 'signUpProgramStaff':
        return {
          tag: 'signUpProgramStaff',
          value: {
            fixedBarBottom: state.fixedBarBottom
          }
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
      case 'termsAndConditions':
        return {
          tag: 'termsAndConditions',
          value: {
            userId: get(state.session, ['user', 'id'], '')
          }
        };
      case 'profile':
        return {
          tag: 'profile',
          value: {
            profileUserId: getString(params, 'userId'),
            viewerUser: state.getIn(['session', 'user'])
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
      case 'about':
        return {
          tag: 'about',
          value: null
        };
      case 'accessibility':
        return {
          tag: 'accessibility',
          value: null
        };
      case 'copyright':
        return {
          tag: 'copyright',
          value: null
        };
      case 'disclaimer':
        return {
          tag: 'disclaimer',
          value: null
        };
      case 'privacy':
        return {
          tag: 'privacy',
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
      case 'termsAndConditions':
        return '/terms-and-conditions';
      case 'profile':
        return `/profile/${page.value.profileUserId}`;
      case 'userList':
        return '/users';
      case 'requestForInformationList':
        return '/requests-for-information';
      case 'about':
        return '/about';
      case 'accessibility':
        return '/accessibility';
      case 'copyright':
        return '/copyright';
      case 'disclaimer':
        return '/disclaimer';
      case 'privacy':
        return '/privacy';
      case 'noticeChangePassword':
        return '/notice/change-password';
      case 'noticeResetPassword':
        return '/notice/reset-password';
      case 'noticeForgotPassword':
        return '/notice/forgot-password';
      case 'noticeNotFound':
        return '/not-found';
    }
  },

  pageToMetadata(page) {
    const makeMetadata = (title?: string) => ({
      title: title ? `${title} — ${PAGE_TITLE_SUFFIX}` : PAGE_TITLE_SUFFIX
    });
    switch (page.tag) {
      case 'landing':
        return makeMetadata('Welcome');
      case 'signIn':
        return makeMetadata('Sign In');
      case 'signUpBuyer':
        return makeMetadata('Sign Up: Buyer');
      case 'signUpVendor':
        return makeMetadata('Sign Up: Vendor');
      case 'signUpProgramStaff':
        return makeMetadata('Create a Program Staff Account');
      case 'signOut':
        return makeMetadata('Signed Out');
      case 'changePassword':
        return makeMetadata('Change your Password');
      case 'resetPassword':
        return makeMetadata('Reset your Password');
      case 'forgotPassword':
        return makeMetadata('Forgotten your Password?');
      case 'termsAndConditions':
        return makeMetadata('Terms and Conditions');
      case 'profile':
        // TODO add user's name to the title
        return makeMetadata('Profile');
      case 'userList':
        return makeMetadata('Users');
      case 'requestForInformationList':
        return makeMetadata('Requests for Information');
      case 'about':
        return makeMetadata('About');
      case 'accessibility':
        return makeMetadata('Accessibility');
      case 'copyright':
        return makeMetadata('Copyright');
      case 'disclaimer':
        return makeMetadata('Disclaimer');
      case 'privacy':
        return makeMetadata('Privacy');
      case 'noticeChangePassword':
        return makeMetadata('Password Change Successful');
      case 'noticeResetPassword':
        return makeMetadata('Password Reset Successful');
      case 'noticeForgotPassword':
        return makeMetadata('Check your Inbox');
      case 'noticeNotFound':
        return makeMetadata('Not Found');
    }
  }

};

export default router;
