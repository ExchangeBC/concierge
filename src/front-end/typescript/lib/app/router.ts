import { Route } from 'front-end/lib/app/types';
import { Router } from 'front-end/lib/framework';

function getQueryParamString(query: Record<string, string | string[]>, key: string): string {
  let value = query[key];
  if (value && value instanceof Array) {
    value = value[0];
  }
  return value;
}

const router: Router<Route> = {

  routes: [
    {
      path: '/',
      makeRoute() {
        return {
          tag: 'landing',
          value: null
        };
      }
    },
    {
      path: '/sign-in',
      makeRoute({ query }) {
        return {
          tag: 'signIn',
          value: {
            redirectOnSuccess: getQueryParamString(query, 'redirectOnSuccess')
          }
        };
      }
    },
    {
      // Alias the buyer sign-up page.
      path: '/sign-up',
      makeRoute() {
        return {
          tag: 'signUpBuyer',
          value: {}
        };
      }
    },
    {
      path: '/sign-up/buyer',
      makeRoute() {
        return {
          tag: 'signUpBuyer',
          value: {}
        };
      }
    },
    {
      path: '/sign-up/vendor',
      makeRoute() {
        return {
          tag: 'signUpVendor',
          value: {}
        };
      }
    },
    {
      path: '/sign-up/program-staff',
      makeRoute() {
        return {
          tag: 'signUpProgramStaff',
          value: {}
        };
      }
    },
    {
      path: '/sign-out',
      makeRoute() {
        return {
          tag: 'signOut',
          value: null
        };
      }
    },
    {
      path: '/change-password',
      makeRoute() {
        return {
          tag: 'changePassword',
          value: null
        };
      }
    },
    {
      path: '/reset-password/:forgotPasswordToken/:userId',
      makeRoute({ params }) {
        return {
          tag: 'resetPassword',
          value: {
            forgotPasswordToken: params.forgotPasswordToken,
            userId: params.userId
          }
        };
      }
    },
    {
      path: '/forgot-password',
      makeRoute() {
        return {
          tag: 'forgotPassword',
          value: null
        };
      }
    },
    {
      path: '/terms-and-conditions',
      makeRoute({ query }) {
        return {
          tag: 'termsAndConditions',
          value: {
            redirectOnAccept: getQueryParamString(query, 'redirectOnAccept') || undefined,
            redirectOnSkip: getQueryParamString(query, 'redirectOnSkip') || undefined
          }
        };
      }
    },
    {
      path: '/profiles/:userId',
      makeRoute({ params }) {
        return {
          tag: 'profile',
          value: {
            profileUserId: params.userId
          }
        };
      }
    },
    {
      path: '/users',
      makeRoute() {
        return {
          tag: 'userList',
          value: null
        };
      }
    },
    {
      path: '/about',
      makeRoute() {
        return {
          tag: 'markdown',
          value: {
            documentId: 'about'
          }
        };
      }
    },
    {
      path: '/accessibility',
      makeRoute() {
        return {
          tag: 'markdown',
          value: {
            documentId: 'accessibility'
          }
        };
      }
    },
    {
      path: '/copyright',
      makeRoute() {
        return {
          tag: 'markdown',
          value: {
            documentId: 'copyright'
          }
        };
      }
    },
    {
      path: '/disclaimer',
      makeRoute() {
        return {
          tag: 'markdown',
          value: {
            documentId: 'disclaimer'
          }
        };
      }
    },
    {
      path: '/privacy',
      makeRoute() {
        return {
          tag: 'markdown',
          value: {
            documentId: 'privacy'
          }
        };
      }
    },
    {
      path: '/guide',
      makeRoute() {
        return {
          tag: 'markdown',
          value: {
            documentId: 'guide'
          }
        };
      }
    },
    {
      path: '/requests-for-information/create',
      makeRoute() {
        return {
          tag: 'requestForInformationCreate',
          value: null
        };
      }
    },
    {
      path: '/requests-for-information/:rfiId/edit',
      makeRoute({ params }) {
        return {
          tag: 'requestForInformationEdit',
          value: {
            rfiId: params.rfiId
          }
        };
      }
    },
    {
      path: '/requests-for-information/:rfiId/view',
      makeRoute({ params }) {
        return {
          tag: 'requestForInformationView',
          value: {
            rfiId: params.rfiId
          }
        };
      }
    },
    {
      path: '/requests-for-information/:rfiId/preview',
      makeRoute({ params }) {
        return {
          tag: 'requestForInformationPreview',
          value: {
            rfiId: params.rfiId,
            preview: true
          }
        };
      }
    },
    {
      path: '/requests-for-information/:rfiId/respond',
      makeRoute({ params }) {
        return {
          tag: 'requestForInformationRespond',
          value: {
            rfiId: params.rfiId
          }
        };
      }
    },
    {
      path: '/requests-for-information',
      makeRoute() {
        return {
          tag: 'requestForInformationList',
          value: null
        };
      }
    },
    {
      path: '/notice/change-password',
      makeRoute() {
        return {
          tag: 'notice',
          value: {
            noticeId: {
              tag: 'changePassword',
              value: undefined
            }
          }
        };
      }
    },
    {
      path: '/notice/reset-password',
      makeRoute() {
        return {
          tag: 'notice',
          value: {
            noticeId: {
              tag: 'resetPassword',
              value: undefined
            }
          }
        };
      }
    },
    {
      path: '/notice/request-for-information/:rfiId/non-vendor-response',
      makeRoute({ params }) {
        return {
          tag: 'notice',
          value: {
            noticeId: {
              tag: 'rfiNonVendorResponse',
              value: params.rfiId
            }
          }
        };
      }
    },
    {
      path: '/notice/request-for-information/:rfiId/expired-rfi-response',
      makeRoute({ params }) {
        return {
          tag: 'notice',
          value: {
            noticeId: {
              tag: 'rfiExpiredResponse',
              value: params.rfiId
            }
          }
        };
      }
    },
    {
      path: '/notice/request-for-information/:rfiId/response-submitted',
      makeRoute({ params }) {
        return {
          tag: 'notice',
          value: {
            noticeId: {
              tag: 'rfiResponseSubmitted',
              value: params.rfiId
            }
          }
        };
      }
    },
    {
      path: '/notice/forgot-password',
      makeRoute() {
        return {
          tag: 'notice',
          value: {
            noticeId: {
              tag: 'forgotPassword',
              value: undefined
            }
          }
        };
      }
    },
    {
      path: '*',
      makeRoute() {
        return {
          tag: 'notice',
          value: {
            noticeId: {
              tag: 'notFound',
              value: undefined
            }
          }
        };
      }
    }
  ],

  routeToUrl(route) {
    switch (route.tag) {
      case 'landing':
        return '/';
      case 'signIn':
        return `/sign-in?redirectOnSuccess=${route.value.redirectOnSuccess}`;
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
        return `/reset-password/${route.value.forgotPasswordToken}/${route.value.userId}`;
      case 'forgotPassword':
        return '/forgot-password';
      case 'termsAndConditions':
        const tcRedirectOnAccept = route.value.redirectOnAccept;
        const tcRedirectOnSkip = route.value.redirectOnSkip;
        const tcQueryParams: string[] = [];
        if (tcRedirectOnAccept) { tcQueryParams.push(`redirectOnAccept=${tcRedirectOnAccept}`); }
        if (tcRedirectOnSkip) { tcQueryParams.push(`redirectOnSkip=${tcRedirectOnSkip}`); }
        const tcQueryString = tcQueryParams.join('&');
        return `/terms-and-conditions?${tcQueryString}`;
      case 'profile':
        return `/profiles/${route.value.profileUserId}`;
      case 'userList':
        return '/users';
      case 'requestForInformationCreate':
        return '/requests-for-information/create';
      case 'requestForInformationEdit':
        return `/requests-for-information/${route.value.rfiId}/edit`;
      case 'requestForInformationView':
        return `/requests-for-information/${route.value.rfiId}/view`;
      case 'requestForInformationPreview':
        return `/requests-for-information/${route.value.rfiId}/preview`;
      case 'requestForInformationRespond':
        return `/requests-for-information/${route.value.rfiId}/respond`;
      case 'requestForInformationList':
        return '/requests-for-information';
      case 'markdown':
        return (() => {
          switch (route.value.documentId) {
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
          }
        })();
      case 'notice':
        return (() => {
          switch (route.value.noticeId.tag) {
            case 'changePassword':
              return '/notice/change-password';
            case 'resetPassword':
              return '/notice/reset-password';
            case 'rfiNonVendorResponse':
              return `/notice/request-for-information/${route.value.noticeId.value}/non-vendor-response`;
            case 'rfiExpiredResponse':
              return `/notice/request-for-information/${route.value.noticeId.value}/expired-rfi-response`;
            case 'rfiResponseSubmitted':
              return `/notice/request-for-information/${route.value.noticeId.value}/response-submitted`;
            case 'forgotPassword':
              return '/notice/forgot-password';
            case 'notFound':
              return '/not-found';
          }
        })();
    }
  }

};

export default router;
