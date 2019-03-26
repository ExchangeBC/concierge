import { Page, State } from 'front-end/lib/app/types';
import { RouteAuthDefinition, Router } from 'front-end/lib/framework';
import * as PageSignIn from 'front-end/lib/pages/sign-in';
import * as PageSignUpBuyer from 'front-end/lib/pages/sign-up/buyer';
import * as PageSignUpVendor from 'front-end/lib/pages/sign-up/vendor';
import { get } from 'lodash';
import { getString } from 'shared/lib';
import { UserType, userTypeToTitleCase } from 'shared/lib/types';

// TODO we can remove `pageId` strings from the routes array
// by adding a function to each routes definition instead.
// The function would take in params and state,
// and return a value of type `Page`.

const PAGE_TITLE_SUFFIX = 'Procurement Concierge Program';

const isSignedOut: RouteAuthDefinition<Page, UserType> = {
  level: { tag: 'signedOut', value: undefined },
  redirect: () => ({ tag: 'landing', value: {} }),
  signOut: false
};

const isSignedIn: RouteAuthDefinition<Page, UserType> = {
  level: { tag: 'signedIn', value: undefined },
  redirect: page => {
    return {
      tag: 'signIn',
      value: {
        redirectOnSuccess: page
      }
    };
  },
  signOut: false
};

const isVendor: RouteAuthDefinition<Page, UserType> = {
  level: { tag: 'userType', value: [UserType.Vendor] },
  // TODO redirect to the view RFI page.
  redirect: page => ({ tag: 'landing', value: {} }),
  signOut: false
};

const isBuyerOrVendor: RouteAuthDefinition<Page, UserType> = {
  level: { tag: 'userType', value: [UserType.Buyer, UserType.Vendor] },
  redirect: () => ({ tag: 'landing', value: {} }),
  signOut: false
};

const isProgramStaff: RouteAuthDefinition<Page, UserType> = {
  level: { tag: 'userType', value: [UserType.ProgramStaff] },
  redirect: page => {
    return {
      tag: 'signIn',
      value: {
        redirectOnSuccess: page
      }
    };
  },
  signOut: false
};

function serialize<Params>(params: Params): string {
  return btoa(JSON.stringify(params));
}

function deserialize<Params>(s: string): Params {
  return JSON.parse(atob(s)) as Params;
}

const router: Router<State, Page, UserType> = {

  fallbackPage: {
    tag: 'landing',
    value: {}
  },

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
      path: '/sign-in/:params',
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
        redirect: () => ({ tag: 'signOut', value: null }),
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
      path: '/profiles/:userId',
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
      path: '/guide',
      pageId: 'guide'
    },
    {
      path: '/requests-for-information/create',
      pageId: 'requestForInformationCreate',
      auth: isProgramStaff
    },
    {
      path: '/requests-for-information/:rfiId/edit',
      pageId: 'requestForInformationEdit',
      auth: isProgramStaff
    },
    {
      path: '/requests-for-information/:rfiId/view',
      pageId: 'requestForInformationView'
    },
    {
      path: '/requests-for-information/:rfiId/respond',
      pageId: 'requestForInformationList',
      auth: isVendor
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
          value: {
            signedIn: !!(state.session && state.session.user),
            userType: get(state.session, ['user', 'type'])
          }
        };
      case 'signIn':
        const signInSerializedParams = get(params, 'params');
        let signInValue = {} as PageSignIn.Params;
        if (signInSerializedParams) {
          signInValue = deserialize(signInSerializedParams);
        }
        return {
          tag: 'signIn',
          value: signInValue
        };
      case 'signUpBuyer':
        const signUpBuyerParams: PageSignUpBuyer.Params = {
          fixedBarBottom: state.fixedBarBottom
        };
        // Persist the email, password, confirmPassword fields when switching sign-up forms.
        if (outgoingPage.tag === 'signUpVendor' && state.pages.signUpVendor) {
          signUpBuyerParams.accountInformation = state.pages.signUpVendor.accountInformation.set('userType', UserType.Buyer);
        }
        return {
          tag: 'signUpBuyer',
          value: signUpBuyerParams
        };
      case 'signUpVendor':
        const signUpVendorParams: PageSignUpVendor.Params = {
          fixedBarBottom: state.fixedBarBottom
        };
        // Persist the email, password, confirmPassword fields when switching sign-up forms.
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
      case 'requestForInformationCreate':
        return {
          tag: 'requestForInformationCreate',
          value: {
            fixedBarBottom: state.fixedBarBottom
          }
        };
      case 'requestForInformationEdit':
        return {
          tag: 'requestForInformationEdit',
          value: {
            rfiId: get(params, 'rfiId', ''),
            fixedBarBottom: state.fixedBarBottom
          }
        };
      case 'requestForInformationView':
        return {
          tag: 'requestForInformationView',
          value: {
            rfiId: get(params, 'rfiId', ''),
            userType: get(state.session, ['user', 'type']),
            fixedBarBottom: state.fixedBarBottom
          }
        };
      case 'requestForInformationList':
        return {
          tag: 'requestForInformationList',
          value: {
            userType: get(state.session, ['user', 'type'])
          }
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
      case 'guide':
        return {
          tag: 'guide',
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
        return `/sign-in/${serialize(page.value)}`;
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
        return `/profiles/${page.value.profileUserId}`;
      case 'userList':
        return '/users';
      case 'requestForInformationCreate':
        return '/requests-for-information/create';
      case 'requestForInformationEdit':
        return `/requests-for-information/${page.value.rfiId}/edit`;
      case 'requestForInformationView':
        return `/requests-for-information/${page.value.rfiId}/view`;
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
      case 'guide':
        return '/guide';
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
        return makeMetadata(`Create a ${userTypeToTitleCase(UserType.Buyer)} Account`);
      case 'signUpVendor':
        return makeMetadata(`Create a ${userTypeToTitleCase(UserType.Vendor)} Account`);
      case 'signUpProgramStaff':
        return makeMetadata(`Create a ${userTypeToTitleCase(UserType.ProgramStaff)} Account`);
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
      case 'requestForInformationCreate':
        return makeMetadata('Create a Request for Information');
      case 'requestForInformationEdit':
        return makeMetadata('Editing Request for Information');
      case 'requestForInformationView':
        return makeMetadata('Request for Information');
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
      case 'guide':
        return makeMetadata('How to Use the Procurement Concierge Program\'s Web Application');
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
