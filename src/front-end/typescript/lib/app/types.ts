import { AppMsg, Immutable } from 'front-end/lib/framework';
import { Session } from 'front-end/lib/http/api';
import * as PageChangePassword from 'front-end/lib/pages/change-password';
import * as PageForgotPassword from 'front-end/lib/pages/forgot-password';
import * as PageLanding from 'front-end/lib/pages/landing';
import * as PageAbout from 'front-end/lib/pages/markdown/about';
import * as PageAccessibility from 'front-end/lib/pages/markdown/accessibility';
import * as PageCopyright from 'front-end/lib/pages/markdown/copyright';
import * as PageDisclaimer from 'front-end/lib/pages/markdown/disclaimer';
import * as PageGuide from 'front-end/lib/pages/markdown/guide';
import * as PagePrivacy from 'front-end/lib/pages/markdown/privacy';
import * as PageNoticeChangePassword from 'front-end/lib/pages/notice/change-password';
import * as PageNoticeForgotPassword from 'front-end/lib/pages/notice/forgot-password';
import * as PageNoticeNotFound from 'front-end/lib/pages/notice/not-found';
import * as PageNoticeRfiNonVendorResponse from 'front-end/lib/pages/notice/request-for-information/non-vendor-response';
import * as PageNoticeRfiResponseSubmitted from 'front-end/lib/pages/notice/request-for-information/response-submitted';
import * as PageNoticeResetPassword from 'front-end/lib/pages/notice/reset-password';
import * as PageProfile from 'front-end/lib/pages/profile';
import * as PageRequestForInformationCreate from 'front-end/lib/pages/request-for-information/create';
import * as PageRequestForInformationEdit from 'front-end/lib/pages/request-for-information/edit';
import * as PageRequestForInformationList from 'front-end/lib/pages/request-for-information/list';
import * as PageRequestForInformationRespond from 'front-end/lib/pages/request-for-information/respond';
import * as PageRequestForInformationView from 'front-end/lib/pages/request-for-information/view';
import * as PageResetPassword from 'front-end/lib/pages/reset-password';
import * as PageSignIn from 'front-end/lib/pages/sign-in';
import * as PageSignOut from 'front-end/lib/pages/sign-out';
import * as PageSignUpBuyer from 'front-end/lib/pages/sign-up/buyer';
import * as PageSignUpProgramStaff from 'front-end/lib/pages/sign-up/program-staff';
import * as PageSignUpVendor from 'front-end/lib/pages/sign-up/vendor';
import * as PageTermsAndConditions from 'front-end/lib/pages/terms-and-conditions';
import * as PageUserList from 'front-end/lib/pages/user-list';
import { UserType } from 'shared/lib/types';
import { ADT } from 'shared/lib/types';

export type Page
  = ADT<'landing', PageLanding.Params>
  | ADT<'signIn', PageSignIn.Params>
  | ADT<'signUpBuyer', PageSignUpBuyer.Params>
  | ADT<'signUpVendor', PageSignUpVendor.Params>
  | ADT<'signUpProgramStaff', PageSignUpProgramStaff.Params>
  | ADT<'signOut', PageSignOut.Params>
  | ADT<'changePassword', PageChangePassword.Params>
  | ADT<'resetPassword', PageResetPassword.Params>
  | ADT<'forgotPassword', PageForgotPassword.Params>
  | ADT<'termsAndConditions', PageTermsAndConditions.Params>
  | ADT<'profile', PageProfile.Params>
  | ADT<'userList', PageUserList.Params>
  | ADT<'requestForInformationCreate', PageRequestForInformationCreate.Params>
  | ADT<'requestForInformationEdit', PageRequestForInformationEdit.Params>
  | ADT<'requestForInformationView', PageRequestForInformationView.Params>
  | ADT<'requestForInformationRespond', PageRequestForInformationRespond.Params>
  | ADT<'requestForInformationList', PageRequestForInformationList.Params>
  | ADT<'about', PageAbout.Params>
  | ADT<'accessibility', PageAccessibility.Params>
  | ADT<'copyright', PageCopyright.Params>
  | ADT<'disclaimer', PageDisclaimer.Params>
  | ADT<'privacy', PagePrivacy.Params>
  | ADT<'guide', PageGuide.Params>
  | ADT<'noticeNotFound', PageNoticeNotFound.Params>
  | ADT<'noticeChangePassword', PageNoticeChangePassword.Params>
  | ADT<'noticeResetPassword', PageNoticeResetPassword.Params>
  | ADT<'noticeRfiNonVendorResponse', PageNoticeRfiNonVendorResponse.Params>
  | ADT<'noticeRfiResponseSubmitted', PageNoticeRfiResponseSubmitted.Params>
  | ADT<'noticeForgotPassword', PageNoticeForgotPassword.Params>;

export interface State {
  ready: boolean;
  isNavOpen: boolean;
  inTransition: boolean;
  fixedBarBottom: number;
  session?: Session;
  activePage: Page;
  pages: {
    landing?: Immutable<PageLanding.State>;
    signIn?: Immutable<PageSignIn.State>;
    signUpBuyer?: Immutable<PageSignUpBuyer.State>;
    signUpVendor?: Immutable<PageSignUpVendor.State>;
    signUpProgramStaff?: Immutable<PageSignUpProgramStaff.State>;
    signOut?: Immutable<PageSignOut.State>;
    changePassword?: Immutable<PageChangePassword.State>;
    resetPassword?: Immutable<PageResetPassword.State>;
    forgotPassword?: Immutable<PageForgotPassword.State>;
    termsAndConditions?: Immutable<PageTermsAndConditions.State>;
    profile?: Immutable<PageProfile.State>;
    userList?: Immutable<PageUserList.State>;
    requestForInformationCreate?: Immutable<PageRequestForInformationCreate.State>;
    requestForInformationEdit?: Immutable<PageRequestForInformationEdit.State>;
    requestForInformationView?: Immutable<PageRequestForInformationView.State>;
    requestForInformationRespond?: Immutable<PageRequestForInformationRespond.State>;
    requestForInformationList?: Immutable<PageRequestForInformationList.State>;
    about?: Immutable<PageAbout.State>;
    accessibility?: Immutable<PageAccessibility.State>;
    copyright?: Immutable<PageCopyright.State>;
    disclaimer?: Immutable<PageDisclaimer.State>;
    privacy?: Immutable<PagePrivacy.State>;
    guide?: Immutable<PageGuide.State>;
    noticeNotFound?: Immutable<PageNoticeNotFound.State>;
    noticeChangePassword?: Immutable<PageNoticeChangePassword.State>;
    noticeResetPassword?: Immutable<PageNoticeResetPassword.State>;
    noticeRfiNonVendorResponse?: Immutable<PageNoticeRfiNonVendorResponse.State>;
    noticeRfiResponseSubmitted?: Immutable<PageNoticeRfiResponseSubmitted.State>;
    noticeForgotPassword?: Immutable<PageNoticeForgotPassword.State>;
  };
}

type InnerMsg
  = ADT<'toggleIsNavOpen', boolean | undefined >
  | ADT<'updateFixedBarBottom', number>
  | ADT<'pageLanding', PageLanding.Msg>
  | ADT<'pageSignIn', PageSignIn.Msg>
  | ADT<'pageSignUpBuyer', PageSignUpBuyer.Msg>
  | ADT<'pageSignUpVendor', PageSignUpVendor.Msg>
  | ADT<'pageSignUpProgramStaff', PageSignUpProgramStaff.Msg>
  | ADT<'pageSignOut', PageSignOut.Msg>
  | ADT<'pageChangePassword', PageChangePassword.Msg>
  | ADT<'pageResetPassword', PageResetPassword.Msg>
  | ADT<'pageForgotPassword', PageForgotPassword.Msg>
  | ADT<'pageTermsAndConditions', PageTermsAndConditions.Msg>
  | ADT<'pageProfile', PageProfile.Msg>
  | ADT<'pageUserList', PageUserList.Msg>
  | ADT<'pageRequestForInformationCreate', PageRequestForInformationCreate.Msg>
  | ADT<'pageRequestForInformationEdit', PageRequestForInformationEdit.Msg>
  | ADT<'pageRequestForInformationView', PageRequestForInformationView.Msg>
  | ADT<'pageRequestForInformationRespond', PageRequestForInformationRespond.Msg>
  | ADT<'pageRequestForInformationList', PageRequestForInformationList.Msg>
  | ADT<'pageAbout', PageAbout.Msg>
  | ADT<'pageAccessibility', PageAccessibility.Msg>
  | ADT<'pageCopyright', PageCopyright.Msg>
  | ADT<'pageDisclaimer', PageDisclaimer.Msg>
  | ADT<'pagePrivacy', PagePrivacy.Msg>
  | ADT<'pageGuide', PageGuide.Msg>
  | ADT<'pageNoticeNotFound', PageNoticeNotFound.Msg>
  | ADT<'pageNoticeChangePassword', PageNoticeChangePassword.Msg>
  | ADT<'pageNoticeResetPassword', PageNoticeResetPassword.Msg>
  | ADT<'pageNoticeRfiNonVendorResponse', PageNoticeRfiNonVendorResponse.Msg>
  | ADT<'pageNoticeRfiResponseSubmitted', PageNoticeRfiResponseSubmitted.Msg>
  | ADT<'pageNoticeForgotPassword', PageNoticeForgotPassword.Msg>;

export type Msg = AppMsg<InnerMsg, Page, UserType>;
