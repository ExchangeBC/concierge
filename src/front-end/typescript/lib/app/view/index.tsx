import { LIVE_SITE_DOMAIN } from 'front-end/config';
import { Msg, Route, SharedState, State } from 'front-end/lib/app/types';
import Footer from 'front-end/lib/app/view/footer';
import Nav from 'front-end/lib/app/view/nav';
import { AppMsg, ComponentView, Dispatch, GlobalComponentMsg, Immutable, mapAppDispatch, newRoute, PageComponent, View } from 'front-end/lib/framework';
import * as PageChangePassword from 'front-end/lib/pages/change-password';
import * as PageForgotPassword from 'front-end/lib/pages/forgot-password';
import * as PageLanding from 'front-end/lib/pages/landing';
import * as PageMarkdown from 'front-end/lib/pages/markdown';
import * as PageNotice from 'front-end/lib/pages/notice';
import * as PageProfile from 'front-end/lib/pages/profile';
import * as PageRequestForInformationCreate from 'front-end/lib/pages/request-for-information/create';
import * as PageRequestForInformationEdit from 'front-end/lib/pages/request-for-information/edit';
import * as PageRequestForInformationList from 'front-end/lib/pages/request-for-information/list';
import * as PageRequestForInformationPreview from 'front-end/lib/pages/request-for-information/preview';
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
import PageContainer from 'front-end/lib/views/layout/page-container';
import { default as React, ReactElement } from 'react';

interface ViewPageProps<PageState, PageMsg> {
  dispatch: Dispatch<AppMsg<Msg, Route>>;
  pageState?: Immutable<PageState>;
  component: PageComponent<never, SharedState, PageState, GlobalComponentMsg<PageMsg, Route>>;
  mapPageMsg(msg: GlobalComponentMsg<PageMsg, Route>): Msg;
}

function ViewPage<PageState, PageMsg>(props: ViewPageProps<PageState, PageMsg>): ReactElement<ViewPageProps<PageState, PageMsg>> {
  const { dispatch, pageState, mapPageMsg, component } = props;
  const { viewBottomBar, containerOptions = {} } = component;
  if (pageState) {
    const dispatchPage: Dispatch<GlobalComponentMsg<PageMsg, Route>> = mapAppDispatch(dispatch, mapPageMsg);
    const viewProps = {
      dispatch: dispatchPage,
      state: pageState
    };
    const bottomBar = viewBottomBar ? viewBottomBar(viewProps) : null;
    return (
      <div className='flex-grow-1'>
        <PageContainer {...containerOptions}>
          <component.view dispatch={dispatchPage} state={pageState} />
        </PageContainer>
        {bottomBar}
      </div>
    );
  } else {
    dispatch(newRoute({
      tag: 'notice' as 'notice',
      value: {
        noticeId: {
          tag: 'notFound' as 'notFound',
          value: undefined
        }
      }
    }));
    return (<div></div>);
  }
}

const ViewActiveRoute: ComponentView<State, Msg> = ({ state, dispatch }) => {
  switch (state.activeRoute.tag) {

    case 'landing':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.landing}
          mapPageMsg={value => ({ tag: 'pageLanding', value })}
          component={PageLanding.component} />
      );

    case 'signIn':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.signIn}
          mapPageMsg={value => ({ tag: 'pageSignIn', value })}
          component={PageSignIn.component} />
      );

    case 'signUpBuyer':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.signUpBuyer}
          mapPageMsg={value => ({ tag: 'pageSignUpBuyer', value })}
          component={PageSignUpBuyer.component} />
      );

    case 'signUpVendor':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.signUpVendor}
          mapPageMsg={value => ({ tag: 'pageSignUpVendor', value })}
          component={PageSignUpVendor.component} />
      );

    case 'signUpProgramStaff':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.signUpProgramStaff}
          mapPageMsg={value => ({ tag: 'pageSignUpProgramStaff', value })}
          component={PageSignUpProgramStaff.component} />
      );

    case 'signOut':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.signOut}
          mapPageMsg={value => ({ tag: 'pageSignOut', value })}
          component={PageSignOut.component} />
      );

    case 'changePassword':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.changePassword}
          mapPageMsg={value => ({ tag: 'pageChangePassword', value })}
          component={PageChangePassword.component} />
      );

    case 'resetPassword':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.resetPassword}
          mapPageMsg={value => ({ tag: 'pageResetPassword', value })}
          component={PageResetPassword.component} />
      );

    case 'forgotPassword':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.forgotPassword}
          mapPageMsg={value => ({ tag: 'pageForgotPassword', value })}
          component={PageForgotPassword.component} />
      );

    case 'termsAndConditions':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.termsAndConditions}
          mapPageMsg={value => ({ tag: 'pageTermsAndConditions', value })}
          component={PageTermsAndConditions.component} />
      );

    case 'profile':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.profile}
          mapPageMsg={value => ({ tag: 'pageProfile', value })}
          component={PageProfile.component} />
      );

    case 'userList':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.userList}
          mapPageMsg={value => ({ tag: 'pageUserList', value })}
          component={PageUserList.component} />
      );

    case 'requestForInformationCreate':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.requestForInformationCreate}
          mapPageMsg={value => ({ tag: 'pageRequestForInformationCreate', value })}
          component={PageRequestForInformationCreate.component} />
      );

    case 'requestForInformationEdit':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.requestForInformationEdit}
          mapPageMsg={value => ({ tag: 'pageRequestForInformationEdit', value })}
          component={PageRequestForInformationEdit.component} />
      );

    case 'requestForInformationView':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.requestForInformationView}
          mapPageMsg={value => ({ tag: 'pageRequestForInformationView', value })}
          component={PageRequestForInformationView.component} />
      );

    case 'requestForInformationPreview':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.requestForInformationPreview}
          mapPageMsg={value => ({ tag: 'pageRequestForInformationPreview', value })}
          component={PageRequestForInformationPreview.component} />
      );

    case 'requestForInformationRespond':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.requestForInformationRespond}
          mapPageMsg={value => ({ tag: 'pageRequestForInformationRespond', value })}
          component={PageRequestForInformationRespond.component} />
      );

    case 'requestForInformationList':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.requestForInformationList}
          mapPageMsg={value => ({ tag: 'pageRequestForInformationList', value })}
          component={PageRequestForInformationList.component} />
      );

    case 'markdown':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.markdown}
          mapPageMsg={value => ({ tag: 'pageMarkdown', value })}
          component={PageMarkdown.component} />
      );

    case 'notice':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.notice}
          mapPageMsg={value => ({ tag: 'pageNotice', value })}
          component={PageNotice.component} />
      );
  }
}

const TestEnvironmentBanner: View<{}> = () => (
  <a href={`https://${LIVE_SITE_DOMAIN}`} className='bg-danger text-white text-center p-2'>
    You are in a test environment. Click here to go to the live site.
  </a>
);

function isLiveSite(): boolean {
  return window.location.origin.indexOf(LIVE_SITE_DOMAIN) !== -1;
}

const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (!state.ready) {
    return null;
  } else {
    const toggleIsNavOpen = (value?: boolean) => dispatch({ tag: 'toggleIsNavOpen', value });
    return (
      <div className={`route-${state.activeRoute.tag} ${state.inTransition ? 'in-transition' : ''} d-flex flex-column`} style={{ minHeight: '100vh' }}>
        {isLiveSite() ? null : <TestEnvironmentBanner />}
        <Nav session={state.shared.session} activeRoute={state.activeRoute} isOpen={state.isNavOpen} toggleIsOpen={toggleIsNavOpen} />
        <ViewActiveRoute state={state} dispatch={dispatch} />
        <Footer />
      </div>
    );
  }
};

export default view;
