import { Route } from 'front-end/lib/app/types';
import { RouteParams, RouteQuery, Router } from 'front-end/lib/framework';
import * as PageTermsAndConditions from 'front-end/lib/pages/terms-and-conditions';

export function pushState(route: Route) {
  if (window.history && window.history.pushState) {
    const path = router.routeToUrl(route);
    window.history.pushState({ path }, '', path);
  }
}

export function replaceState(route: Route) {
  if (window.history && window.history.replaceState) {
    const path = router.routeToUrl(route);
    window.history.replaceState({ path }, '', path);
  }
}

function getParamString(params: RouteParams, key: string): string {
  return params[key] || '';
}

function getQueryParamString(query: RouteQuery, key: string): string {
  let value = query[key];
  if (value && value instanceof Array) {
    value = value[0];
  }
  return value || '';
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
            redirectOnSuccess: getQueryParamString(query, 'redirectOnSuccess') || undefined
          }
        };
      }
    },
    {
      // Alias the buyer sign-up page.
      path: '/sign-up',
      makeRoute() {
        return {
          tag: 'signUp',
          value: null
        };
      }
    },
    {
      path: '/sign-up/buyer',
      makeRoute() {
        return {
          tag: 'signUpBuyer',
          value: null
        };
      }
    },
    {
      path: '/sign-up/vendor',
      makeRoute() {
        return {
          tag: 'signUpVendor',
          value: null
        };
      }
    },
    {
      path: '/sign-up/program-staff',
      makeRoute() {
        return {
          tag: 'signUpProgramStaff',
          value: null
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
            forgotPasswordToken: getParamString(params, 'forgotPasswordToken'),
            userId: getParamString(params, 'userId')
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
      path: '/feedback',
      makeRoute() {
        return {
          tag: 'feedback',
          value: null
        }
      }
    },
    {
      path: '/terms-and-conditions',
      makeRoute({ query }) {
        const rawWarningId = getQueryParamString(query, 'warningId');
        return {
          tag: 'termsAndConditions',
          value: {
            redirectOnAccept: getQueryParamString(query, 'redirectOnAccept') || undefined,
            redirectOnSkip: getQueryParamString(query, 'redirectOnSkip') || undefined,
            warningId: rawWarningId && PageTermsAndConditions.parseWarningId(rawWarningId) || undefined
          }
        };
      }
    },
    {
      path: '/users/:userId',
      makeRoute({ params }) {
        return {
          tag: 'userView',
          value: {
            profileUserId: getParamString(params, 'userId')
          }
        };
      }
    },
    // Alias the /users/:userId route for backward compatibility.
    {
      path: '/profiles/:userId',
      makeRoute({ params }) {
        return {
          tag: 'userView',
          value: {
            profileUserId: getParamString(params, 'userId')
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
      makeRoute({ params, query }) {
        return {
          tag: 'requestForInformationEdit',
          value: {
            rfiId: getParamString(params, 'rfiId'),
            activeTab: (() => {
              switch (getQueryParamString(query, 'activeTab')) {
                case 'details': return 'details';
                case 'discoveryDay': return 'discoveryDay';
                case 'responses': return 'responses';
                default: return undefined;
              }
            })()
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
            rfiId: getParamString(params, 'rfiId')
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
            rfiId: getParamString(params, 'rfiId'),
            preview: true
          }
        };
      }
    },
    {
      path: '/requests-for-information/:rfiId/attend-discovery-day',
      makeRoute({ params }) {
        return {
          tag: 'requestForInformationAttendDiscoveryDay',
          value: {
            rfiId: getParamString(params, 'rfiId')
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
            rfiId: getParamString(params, 'rfiId')
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
              value: getParamString(params, 'rfiId')
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
              value: getParamString(params, 'rfiId')
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
              value: getParamString(params, 'rfiId')
            }
          }
        };
      }
    },
    {
      path: '/notice/request-for-information/:rfiId/discovery-day-registration-submitted',
      makeRoute({ params }) {
        return {
          tag: 'notice',
          value: {
            noticeId: {
              tag: 'ddrSubmitted',
              value: getParamString(params, 'rfiId')
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
      path: '/notice/feedback-submitted',
      makeRoute() {
        return {
          tag: 'notice',
          value: {
            noticeId: {
              tag: 'feedbackSubmitted',
              value: undefined
            }
          }
        }
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
        const siRedirectOnSuccess = route.value.redirectOnSuccess;
        const siQueryParams: string[] = [];
        if (siRedirectOnSuccess) { siQueryParams.push(`redirectOnSuccess=${encodeURIComponent(siRedirectOnSuccess)}`); }
        const siQueryString = siQueryParams.join('&');
        return `/sign-in?${siQueryString}`;
      case 'signUp':
        return '/sign-up';
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
      case 'feedback':
        return '/feedback';
      case 'termsAndConditions':
        const tcRedirectOnAccept = route.value.redirectOnAccept;
        const tcRedirectOnSkip = route.value.redirectOnSkip;
        const tcWarningId = route.value.warningId;
        const tcQueryParams: string[] = [];
        if (tcRedirectOnAccept) { tcQueryParams.push(`redirectOnAccept=${encodeURIComponent(tcRedirectOnAccept)}`); }
        if (tcRedirectOnSkip) { tcQueryParams.push(`redirectOnSkip=${encodeURIComponent(tcRedirectOnSkip)}`); }
        if (tcWarningId) { tcQueryParams.push(`warningId=${encodeURIComponent(tcWarningId)}`); }
        const tcQueryString = tcQueryParams.join('&');
        return `/terms-and-conditions?${tcQueryString}`;
      case 'userView':
        return `/users/${route.value.profileUserId}`;
      case 'userList':
        return '/users';
      case 'requestForInformationCreate':
        return '/requests-for-information/create';
      case 'requestForInformationEdit':
        return `/requests-for-information/${route.value.rfiId}/edit${route.value.activeTab ? `?activeTab=${encodeURIComponent(route.value.activeTab)}` : ''}`;
      case 'requestForInformationView':
        return `/requests-for-information/${route.value.rfiId}/view`;
      case 'requestForInformationPreview':
        return `/requests-for-information/${route.value.rfiId}/preview`;
      case 'requestForInformationRespond':
        return `/requests-for-information/${route.value.rfiId}/respond`;
      case 'requestForInformationAttendDiscoveryDay':
        return `/requests-for-information/${route.value.rfiId}/attend-discovery-day`;
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
            case 'ddrSubmitted':
              return `/notice/request-for-information/${route.value.noticeId.value}/discovery-day-registration-submitted`;
            case 'forgotPassword':
              return '/notice/forgot-password';
            case 'notFound':
              return '/not-found';
            case 'feedbackSubmitted':
              return '/notice/feedback-submitted'
          }
        })();
    }
  }

};

export default router;
