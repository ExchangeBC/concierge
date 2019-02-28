import { Msg, Page, State } from 'front-end/lib/app/types';
import Footer from 'front-end/lib/app/view/footer';
import Nav from 'front-end/lib/app/view/nav';
import { AppMsg, ComponentMsg, ComponentView, Dispatch, Immutable, mapAppDispatch, newUrl } from 'front-end/lib/framework';
import * as PageLanding from 'front-end/lib/pages/landing';
import * as PageLoading from 'front-end/lib/pages/loading';
import * as PageSay from 'front-end/lib/pages/say';
import * as PageSignIn from 'front-end/lib/pages/sign-in';
import * as PageSignOut from 'front-end/lib/pages/sign-out';
import * as PageSignUpBuyer from 'front-end/lib/pages/sign-up/buyer';
import * as PageSignUpProgramStaff from 'front-end/lib/pages/sign-up/program-staff';
import * as PageSignUpVendor from 'front-end/lib/pages/sign-up/vendor';
import { default as React, ReactElement } from 'react';
import { Col, Container, Row } from 'reactstrap';

interface ViewPageProps<PageState, PageMsg> {
  dispatch: Dispatch<AppMsg<Msg, Page>>;
  pageState?: Immutable<PageState>;
  View: ComponentView<PageState, ComponentMsg<PageMsg, Page>>;
  mapPageMsg(msg: ComponentMsg<PageMsg, Page>): Msg;
}

function ViewPage<PageState, PageMsg>(props: ViewPageProps<PageState, PageMsg>): ReactElement<ViewPageProps<PageState, PageMsg>> {
  const { dispatch, pageState, mapPageMsg, View } = props;
  if (pageState) {
    const dispatchPage: Dispatch<ComponentMsg<PageMsg, Page>> = mapAppDispatch(dispatch, mapPageMsg);
    return (<View dispatch={dispatchPage} state={pageState} />);
  } else {
    dispatch(newUrl({ tag: 'say' as 'say', value: { message: 'Not Found' }}));
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
    case 'loading':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.loading}
          mapPageMsg={value => ({ tag: 'pageLoading', value })}
          View={PageLoading.view} />
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
    case 'say':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.say}
          mapPageMsg={value => ({ tag: 'pageSay', value })}
          View={PageSay.view} />
      );
    // TODO remove
    default:
      return (<div>Undefined Page</div>);
  }
}

const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (!state.ready) {
    return null;
  } else {
    const toggleIsNavOpen = () => dispatch({ tag: 'toggleIsNavOpen', value: undefined });
    return (
      <div className={`page-${state.activePage.tag} d-flex flex-column`} style={{ minHeight: '100vh' }}>
        <Nav session={state.session} activePage={state.activePage} isOpen={state.isNavOpen} toggleIsOpen={toggleIsNavOpen} />
        <Container className='py-5 mb-auto'>
          <Row>
            <Col xs='12'>
              <ViewActivePage state={state} dispatch={dispatch} />
            </Col>
          </Row>
        </Container>
        <Footer />
      </div>
    );
  }
};

export default view;
