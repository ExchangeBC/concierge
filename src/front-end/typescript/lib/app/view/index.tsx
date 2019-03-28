import { Msg, Page, State } from 'front-end/lib/app/types';
import Footer from 'front-end/lib/app/view/footer';
import Nav from 'front-end/lib/app/view/nav';
import { AppMsg, ComponentMsg, ComponentView, Dispatch, Immutable, mapAppDispatch, newUrl } from 'front-end/lib/framework';
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
import { default as React, ReactElement } from 'react';
import { UserType } from 'shared/lib/types';

interface ViewPageProps<PageState, PageMsg> {
  dispatch: Dispatch<AppMsg<Msg, Page, UserType>>;
  pageState?: Immutable<PageState>;
  View: ComponentView<PageState, ComponentMsg<PageMsg, Page>>;
  mapPageMsg(msg: ComponentMsg<PageMsg, Page>): Msg;
}

function ViewPage<PageState, PageMsg>(props: ViewPageProps<PageState, PageMsg>): ReactElement<ViewPageProps<PageState, PageMsg>> {
  const { dispatch, pageState, mapPageMsg, View } = props;
  if (pageState !== undefined) {
    const dispatchPage: Dispatch<ComponentMsg<PageMsg, Page>> = mapAppDispatch(dispatch, mapPageMsg);
    return (<View dispatch={dispatchPage} state={pageState} />);
  } else {
    dispatch(newUrl({ tag: 'noticeNotFound' as 'noticeNotFound', value: null }));
    return (<div></div>);
  }
}

const ViewActivePage: ComponentView<State, Msg> = ({ state, dispatch }) => {
  switch (state.activePage.tag) {

    case 'landing':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.landing}
          mapPageMsg={value => ({ tag: 'pageLanding', value })}
          View={PageLanding.view} />
      );

    case 'signIn':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.signIn}
          mapPageMsg={value => ({ tag: 'pageSignIn', value })}
          View={PageSignIn.view} />
      );

    case 'signUpBuyer':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.signUpBuyer}
          mapPageMsg={value => ({ tag: 'pageSignUpBuyer', value })}
          View={PageSignUpBuyer.view} />
      );

    case 'signUpVendor':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.signUpVendor}
          mapPageMsg={value => ({ tag: 'pageSignUpVendor', value })}
          View={PageSignUpVendor.view} />
      );

    case 'signUpProgramStaff':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.signUpProgramStaff}
          mapPageMsg={value => ({ tag: 'pageSignUpProgramStaff', value })}
          View={PageSignUpProgramStaff.view} />
      );

    case 'signOut':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.signOut}
          mapPageMsg={value => ({ tag: 'pageSignOut', value })}
          View={PageSignOut.view} />
      );

    case 'changePassword':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.changePassword}
          mapPageMsg={value => ({ tag: 'pageChangePassword', value })}
          View={PageChangePassword.view} />
      );

    case 'resetPassword':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.resetPassword}
          mapPageMsg={value => ({ tag: 'pageResetPassword', value })}
          View={PageResetPassword.view} />
      );

    case 'forgotPassword':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.forgotPassword}
          mapPageMsg={value => ({ tag: 'pageForgotPassword', value })}
          View={PageForgotPassword.view} />
      );

    case 'termsAndConditions':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.termsAndConditions}
          mapPageMsg={value => ({ tag: 'pageTermsAndConditions', value })}
          View={PageTermsAndConditions.view} />
      );

    case 'profile':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.profile}
          mapPageMsg={value => ({ tag: 'pageProfile', value })}
          View={PageProfile.view} />
      );

    case 'userList':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.userList}
          mapPageMsg={value => ({ tag: 'pageUserList', value })}
          View={PageUserList.view} />
      );

    case 'requestForInformationCreate':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.requestForInformationCreate}
          mapPageMsg={value => ({ tag: 'pageRequestForInformationCreate', value })}
          View={PageRequestForInformationCreate.view} />
      );

    case 'requestForInformationEdit':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.requestForInformationEdit}
          mapPageMsg={value => ({ tag: 'pageRequestForInformationEdit', value })}
          View={PageRequestForInformationEdit.view} />
      );

    case 'requestForInformationView':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.requestForInformationView}
          mapPageMsg={value => ({ tag: 'pageRequestForInformationView', value })}
          View={PageRequestForInformationView.view} />
      );

    case 'requestForInformationRespond':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.requestForInformationRespond}
          mapPageMsg={value => ({ tag: 'pageRequestForInformationRespond', value })}
          View={PageRequestForInformationRespond.view} />
      );

    case 'requestForInformationList':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.requestForInformationList}
          mapPageMsg={value => ({ tag: 'pageRequestForInformationList', value })}
          View={PageRequestForInformationList.view} />
      );

    case 'about':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.about}
          mapPageMsg={value => ({ tag: 'pageAbout', value })}
          View={PageAbout.view} />
      );

    case 'accessibility':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.accessibility}
          mapPageMsg={value => ({ tag: 'pageAccessibility', value })}
          View={PageAccessibility.view} />
      );

    case 'copyright':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.copyright}
          mapPageMsg={value => ({ tag: 'pageCopyright', value })}
          View={PageCopyright.view} />
      );

    case 'disclaimer':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.disclaimer}
          mapPageMsg={value => ({ tag: 'pageDisclaimer', value })}
          View={PageDisclaimer.view} />
      );

    case 'privacy':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.privacy}
          mapPageMsg={value => ({ tag: 'pagePrivacy', value })}
          View={PagePrivacy.view} />
      );

    case 'guide':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.guide}
          mapPageMsg={value => ({ tag: 'pageGuide', value })}
          View={PageGuide.view} />
      );

    case 'noticeNotFound':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.noticeNotFound}
          mapPageMsg={value => ({ tag: 'pageNoticeNotFound', value })}
          View={PageNoticeNotFound.view} />
      );

    case 'noticeChangePassword':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.noticeChangePassword}
          mapPageMsg={value => ({ tag: 'pageNoticeChangePassword', value })}
          View={PageNoticeChangePassword.view} />
      );

    case 'noticeResetPassword':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.noticeResetPassword}
          mapPageMsg={value => ({ tag: 'pageNoticeResetPassword', value })}
          View={PageNoticeResetPassword.view} />
      );

    case 'noticeRfiNonVendorResponse':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.noticeRfiNonVendorResponse}
          mapPageMsg={value => ({ tag: 'pageNoticeRfiNonVendorResponse', value })}
          View={PageNoticeRfiNonVendorResponse.view} />
      );

    case 'noticeRfiResponseSubmitted':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.noticeRfiResponseSubmitted}
          mapPageMsg={value => ({ tag: 'pageNoticeRfiResponseSubmitted', value })}
          View={PageNoticeRfiResponseSubmitted.view} />
      );

    case 'noticeForgotPassword':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.noticeForgotPassword}
          mapPageMsg={value => ({ tag: 'pageNoticeForgotPassword', value })}
          View={PageNoticeForgotPassword.view} />
      );
  }
}

const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (!state.ready) {
    return null;
  } else {
    const toggleIsNavOpen = (value?: boolean) => dispatch({ tag: 'toggleIsNavOpen', value });
    return (
      <div className={`page-${state.activePage.tag} ${state.inTransition ? 'in-transition' : ''} d-flex flex-column`} style={{ minHeight: '100vh' }}>
        <Nav session={state.session} activePage={state.activePage} isOpen={state.isNavOpen} toggleIsOpen={toggleIsNavOpen} />
        <ViewActivePage state={state} dispatch={dispatch} />
        <Footer />
      </div>
    );
  }
};

export default view;
