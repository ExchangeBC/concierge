import { Msg, Page, State } from 'front-end/lib/app/types';
import Footer from 'front-end/lib/app/view/footer';
import Nav from 'front-end/lib/app/view/nav';
import { AppMsg, ComponentMsg, ComponentView, Dispatch, Immutable, mapAppDispatch, newUrl } from 'front-end/lib/framework';
import * as PageLanding from 'front-end/lib/pages/landing';
import * as PageLoading from 'front-end/lib/pages/loading';
import * as PageSay from 'front-end/lib/pages/say';
import * as PageSignOut from 'front-end/lib/pages/sign-out';
import * as PageSignUp from 'front-end/lib/pages/sign-up';
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
    case 'signUp':
      return (
        <ViewPage
          dispatch={dispatch}
          pageState={state.pages.signUp}
          mapPageMsg={value => ({ tag: 'pageSignUp', value })}
          View={PageSignUp.view} />
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
  }
}

const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (!state.ready) {
    return null;
  } else {
    return (
      <div className={`page-${state.activePage.tag} d-flex flex-column`} style={{ minHeight: '100vh' }}>
        <Nav session={state.session} />
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
