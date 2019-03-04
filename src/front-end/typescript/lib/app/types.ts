import { AppMsg, Immutable } from 'front-end/lib/framework';
import { Session } from 'front-end/lib/http/api';
import * as PageChangePassword from 'front-end/lib/pages/change-password';
import * as PageForgotPassword from 'front-end/lib/pages/forgot-password';
import * as PageLanding from 'front-end/lib/pages/landing';
import * as PageNoticeChangePassword from 'front-end/lib/pages/notice/change-password';
import * as PageNoticeForgotPassword from 'front-end/lib/pages/notice/forgot-password';
import * as PageNoticeNotFound from 'front-end/lib/pages/notice/not-found';
import * as PageNoticeResetPassword from 'front-end/lib/pages/notice/reset-password';
import * as PageProfile from 'front-end/lib/pages/profile';
import * as PageRequestForInformationList from 'front-end/lib/pages/request-for-information-list';
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
  | ADT<'signIn', null>
  | ADT<'signUpBuyer', PageSignUpBuyer.Params>
  | ADT<'signUpVendor', PageSignUpVendor.Params>
  | ADT<'signUpProgramStaff', PageSignUpProgramStaff.Params>
  | ADT<'signOut', null>
  | ADT<'changePassword', PageChangePassword.Params>
  | ADT<'resetPassword', PageResetPassword.Params>
  | ADT<'forgotPassword', null>
  | ADT<'termsAndConditions', PageTermsAndConditions.Params>
  | ADT<'profile', PageProfile.Params>
  | ADT<'userList', PageUserList.Params>
  | ADT<'requestForInformationList', PageRequestForInformationList.Params>
  | ADT<'noticeNotFound', PageNoticeNotFound.Params>
  | ADT<'noticeChangePassword', PageNoticeChangePassword.Params>
  | ADT<'noticeResetPassword', PageNoticeResetPassword.Params>
  | ADT<'noticeForgotPassword', PageNoticeForgotPassword.Params>;

export interface State {
  ready: boolean;
  isNavOpen: boolean;
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
    profile?: Immutable<PageProfile.State>;
    userList?: Immutable<PageUserList.State>;
    requestForInformationList?: Immutable<PageRequestForInformationList.State>;
    termsAndConditions?: Immutable<PageTermsAndConditions.State>;
    noticeNotFound?: Immutable<PageNoticeNotFound.State>;
    noticeChangePassword?: Immutable<PageNoticeChangePassword.State>;
    noticeResetPassword?: Immutable<PageNoticeResetPassword.State>;
    noticeForgotPassword?: Immutable<PageNoticeForgotPassword.State>;
  };
}

type InnerMsg
  = ADT<'toggleIsNavOpen', boolean | undefined >
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
  | ADT<'pageRequestForInformationList', PageRequestForInformationList.Msg>
  | ADT<'pageNoticeNotFound', PageNoticeNotFound.Msg>
  | ADT<'pageNoticeChangePassword', PageNoticeChangePassword.Msg>
  | ADT<'pageNoticeResetPassword', PageNoticeResetPassword.Msg>
  | ADT<'pageNoticeForgotPassword', PageNoticeForgotPassword.Msg>;

export type Msg = AppMsg<InnerMsg, Page, UserType>;
