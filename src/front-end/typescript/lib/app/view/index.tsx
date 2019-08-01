import { LIVE_SITE_DOMAIN } from 'front-end/config';
import { Msg, Route, State } from 'front-end/lib/app/types';
import Footer from 'front-end/lib/app/view/footer';
import Nav from 'front-end/lib/app/view/nav';
import ViewPage from 'front-end/lib/app/view/page';
import { AppMsg, ComponentView, Dispatch, View } from 'front-end/lib/framework';
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
import Icon from 'front-end/lib/views/icon';
import Link from 'front-end/lib/views/link';
import { default as React } from 'react';
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';

interface ViewModalProps {
  modal: State['modal'];
  dispatch: Dispatch<AppMsg<Msg, Route>>;
}

const ViewModal: View<ViewModalProps> = ({ dispatch, modal }) => {
  const { open, content } = modal;
  const closeModal = () => dispatch({ tag: 'closeModal', value: undefined });
  // TODO custom X icon
  return (
    <Modal isOpen={open} toggle={closeModal}>
      <ModalHeader className='align-items-center' toggle={closeModal} close={(<Icon name='times' color='secondary' onClick={closeModal} style={{ cursor: 'pointer' }}/>)}>{content.title}</ModalHeader>
      <ModalBody>{content.body}</ModalBody>
      <ModalFooter className='p-0' style={{ overflowX: 'auto', justifyContent: 'normal' }}>
        <div className='p-3 d-flex flex-md-row-reverse justify-content-start align-items-center text-nowrap flex-grow-1'>
          {content.actions.map(({ button, text, color, msg }, i) => {
            const props = {
              key: `modal-action-${i}`,
              color,
              onClick: () => dispatch(msg),
              className: i === 0 ? 'mx-0' : 'ml-3 mr-0 ml-md-0 mr-md-3'
            };
            if (button) {
              return (<Link button {...props}>{text}</Link>);
            } else {
              return (<Link {...props}>{text}</Link>);
            }
          })}
        </div>
      </ModalFooter>
    </Modal>
  );
};

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

    case 'signUp':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.signUp}
          mapPageMsg={value => ({ tag: 'pageSignUp', value })}
          component={PageSignUp.component} />
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

    case 'feedback':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.feedback}
          mapPageMsg={value => ({ tag: 'pageFeedback', value })}
          component={PageFeedback.component} />
      )

    case 'termsAndConditions':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.termsAndConditions}
          mapPageMsg={value => ({ tag: 'pageTermsAndConditions', value })}
          component={PageTermsAndConditions.component} />
      );

    case 'userView':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.userView}
          mapPageMsg={value => ({ tag: 'pageUserView', value })}
          component={PageUserView.component} />
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

    case 'requestForInformationAttendDiscoveryDay':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.requestForInformationAttendDiscoveryDay}
          mapPageMsg={value => ({ tag: 'pageRequestForInformationAttendDiscoveryDay', value })}
          component={PageRequestForInformationAttendDiscoveryDay.component} />
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
      <div className={`route-${state.activeRoute.tag} ${state.transitionLoading > 0 ? 'in-transition' : ''} app d-flex flex-column`} style={{ minHeight: '100vh' }}>
        {isLiveSite() ? null : <TestEnvironmentBanner />}
        <Nav session={state.shared.session} activeRoute={state.activeRoute} isOpen={state.isNavOpen} toggleIsOpen={toggleIsNavOpen} />
        <ViewActiveRoute state={state} dispatch={dispatch} />
        <Footer />
        <ViewModal dispatch={dispatch} modal={state.modal} />
      </div>
    );
  }
};

export default view;
