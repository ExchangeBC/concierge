import { AppMsg, Immutable, PageModal } from 'front-end/lib/framework';
import * as PageChangePassword from 'front-end/lib/pages/change-password';
import * as PageFeedback from 'front-end/lib/pages/feedback';
import * as PageForgotPassword from 'front-end/lib/pages/forgot-password';
import * as PageLanding from 'front-end/lib/pages/landing';
import * as PageMarkdown from 'front-end/lib/pages/markdown';
import * as PageNotice from 'front-end/lib/pages/notice';
import * as PageRequestForInformationAttendDiscoveryDay from 'front-end/lib/pages/request-for-information/attend-discovery-day';
import * as PageRequestForInformationCreate from 'front-end/lib/pages/request-for-information/create';
import * as PageRequestForInformationEdit from 'front-end/lib/pages/request-for-information/edit';
import * as PageRequestForInformationList from 'front-end/lib/pages/request-for-information/list';
import * as PageRequestForInformationPreview from 'front-end/lib/pages/request-for-information/preview';
import * as PageRequestForInformationRespond from 'front-end/lib/pages/request-for-information/respond';
import * as PageRequestForInformationView from 'front-end/lib/pages/request-for-information/view';
import * as PageResetPassword from 'front-end/lib/pages/reset-password';
import * as PageSignIn from 'front-end/lib/pages/sign-in';
import * as PageSignOut from 'front-end/lib/pages/sign-out';
import * as PageSignUp from 'front-end/lib/pages/sign-up';
import * as PageSignUpBuyer from 'front-end/lib/pages/sign-up/buyer';
import * as PageSignUpProgramStaff from 'front-end/lib/pages/sign-up/program-staff';
import * as PageSignUpVendor from 'front-end/lib/pages/sign-up/vendor';
import * as PageTermsAndConditions from 'front-end/lib/pages/terms-and-conditions';
import * as PageUserList from 'front-end/lib/pages/user/list';
import * as PageUserView from 'front-end/lib/pages/user/view';
import * as PageViCreate from 'front-end/lib/pages/vendor-idea/create';
import * as PageViEdit from 'front-end/lib/pages/vendor-idea/edit';
import * as PageViList from 'front-end/lib/pages/vendor-idea/list';
import * as PageViView from 'front-end/lib/pages/vendor-idea/view';
import { PublicSession } from 'shared/lib/resources/session';
import { ADT } from 'shared/lib/types';

export type Session = PublicSession;

export type Route =
  | ADT<'landing', PageLanding.RouteParams>
  | ADT<'signIn', PageSignIn.RouteParams>
  | ADT<'signUp', PageSignUp.RouteParams>
  | ADT<'signUpBuyer', PageSignUpBuyer.RouteParams>
  | ADT<'signUpVendor', PageSignUpVendor.RouteParams>
  | ADT<'signUpProgramStaff', PageSignUpProgramStaff.RouteParams>
  | ADT<'signOut', PageSignOut.RouteParams>
  | ADT<'changePassword', PageChangePassword.RouteParams>
  | ADT<'resetPassword', PageResetPassword.RouteParams>
  | ADT<'forgotPassword', PageForgotPassword.RouteParams>
  | ADT<'termsAndConditions', PageTermsAndConditions.RouteParams>
  | ADT<'userView', PageUserView.RouteParams>
  | ADT<'userList', PageUserList.RouteParams>
  | ADT<'requestForInformationCreate', PageRequestForInformationCreate.RouteParams>
  | ADT<'requestForInformationEdit', PageRequestForInformationEdit.RouteParams>
  | ADT<'requestForInformationView', PageRequestForInformationView.RouteParams>
  | ADT<'requestForInformationPreview', PageRequestForInformationPreview.RouteParams>
  | ADT<'requestForInformationRespond', PageRequestForInformationRespond.RouteParams>
  | ADT<'requestForInformationAttendDiscoveryDay', PageRequestForInformationAttendDiscoveryDay.RouteParams>
  | ADT<'requestForInformationList', PageRequestForInformationList.RouteParams>
  | ADT<'viCreate', PageViCreate.RouteParams>
  | ADT<'viEdit', PageViEdit.RouteParams>
  | ADT<'viView', PageViView.RouteParams>
  | ADT<'viList', PageViList.RouteParams>
  | ADT<'markdown', PageMarkdown.RouteParams>
  | ADT<'notice', PageNotice.RouteParams>
  | ADT<'feedback', PageFeedback.RouteParams>;

export interface SharedState {
  session?: Session;
}

export interface State {
  ready: boolean;
  isNavOpen: boolean;
  transitionLoading: number;
  shared: SharedState;
  activeRoute: Route;
  modal: {
    open: boolean;
    content: PageModal<Msg>;
  };
  pages: {
    landing?: Immutable<PageLanding.State>;
    signIn?: Immutable<PageSignIn.State>;
    signUp?: Immutable<PageSignUp.State>;
    signUpBuyer?: Immutable<PageSignUpBuyer.State>;
    signUpVendor?: Immutable<PageSignUpVendor.State>;
    signUpProgramStaff?: Immutable<PageSignUpProgramStaff.State>;
    signOut?: Immutable<PageSignOut.State>;
    changePassword?: Immutable<PageChangePassword.State>;
    resetPassword?: Immutable<PageResetPassword.State>;
    forgotPassword?: Immutable<PageForgotPassword.State>;
    termsAndConditions?: Immutable<PageTermsAndConditions.State>;
    userView?: Immutable<PageUserView.State>;
    userList?: Immutable<PageUserList.State>;
    requestForInformationCreate?: Immutable<PageRequestForInformationCreate.State>;
    requestForInformationEdit?: Immutable<PageRequestForInformationEdit.State>;
    requestForInformationView?: Immutable<PageRequestForInformationView.State>;
    requestForInformationPreview?: Immutable<PageRequestForInformationPreview.State>;
    requestForInformationRespond?: Immutable<PageRequestForInformationRespond.State>;
    requestForInformationAttendDiscoveryDay?: Immutable<PageRequestForInformationAttendDiscoveryDay.State>;
    requestForInformationList?: Immutable<PageRequestForInformationList.State>;
    viCreate?: Immutable<PageViCreate.State>;
    viEdit?: Immutable<PageViEdit.State>;
    viView?: Immutable<PageViView.State>;
    viList?: Immutable<PageViList.State>;
    markdown?: Immutable<PageMarkdown.State>;
    notice?: Immutable<PageNotice.State>;
    feedback?: Immutable<PageFeedback.State>;
  };
}

type InnerMsg =
  | ADT<'noop'>
  | ADT<'toggleIsNavOpen', boolean | undefined>
  | ADT<'closeModal', undefined>
  | ADT<'pageLanding', PageLanding.Msg>
  | ADT<'pageSignIn', PageSignIn.Msg>
  | ADT<'pageSignUp', PageSignUp.Msg>
  | ADT<'pageSignUpBuyer', PageSignUpBuyer.Msg>
  | ADT<'pageSignUpVendor', PageSignUpVendor.Msg>
  | ADT<'pageSignUpProgramStaff', PageSignUpProgramStaff.Msg>
  | ADT<'pageSignOut', PageSignOut.Msg>
  | ADT<'pageChangePassword', PageChangePassword.Msg>
  | ADT<'pageResetPassword', PageResetPassword.Msg>
  | ADT<'pageForgotPassword', PageForgotPassword.Msg>
  | ADT<'pageTermsAndConditions', PageTermsAndConditions.Msg>
  | ADT<'pageUserView', PageUserView.Msg>
  | ADT<'pageUserList', PageUserList.Msg>
  | ADT<'pageRequestForInformationCreate', PageRequestForInformationCreate.Msg>
  | ADT<'pageRequestForInformationEdit', PageRequestForInformationEdit.Msg>
  | ADT<'pageRequestForInformationView', PageRequestForInformationView.Msg>
  | ADT<'pageRequestForInformationPreview', PageRequestForInformationPreview.Msg>
  | ADT<'pageRequestForInformationRespond', PageRequestForInformationRespond.Msg>
  | ADT<'pageRequestForInformationAttendDiscoveryDay', PageRequestForInformationAttendDiscoveryDay.Msg>
  | ADT<'pageRequestForInformationList', PageRequestForInformationList.Msg>
  | ADT<'pageViCreate', PageViCreate.Msg>
  | ADT<'pageViEdit', PageViEdit.Msg>
  | ADT<'pageViView', PageViView.Msg>
  | ADT<'pageViList', PageViList.Msg>
  | ADT<'pageMarkdown', PageMarkdown.Msg>
  | ADT<'pageNotice', PageNotice.Msg>
  | ADT<'pageFeedback', PageFeedback.Msg>;

export type Msg = AppMsg<InnerMsg, Route>;
