import { Msg, State } from 'front-end/lib/app/types';
import * as Nav from 'front-end/lib/app/view/nav';
import { ComponentView, Dispatch, mapAppDispatch } from 'front-end/lib/framework';
import * as PageLanding from 'front-end/lib/pages/landing';
import * as PageLoading from 'front-end/lib/pages/loading';
import * as PageSay from 'front-end/lib/pages/say';
import * as PageSignUp from 'front-end/lib/pages/sign-up';
import React from 'react';
import { Col, Container, Row } from 'reactstrap';

const ViewActivePage: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const json = state.toJSON();
  const activePage = json.activePage.tag;
  if (activePage === 'landing' && json.pages.landing) {
    const dispatchPage: Dispatch<PageLanding.Msg> = mapAppDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'pageLandingMsg' as 'pageLandingMsg', value }));
    return (<PageLanding.view dispatch={dispatchPage} state={json.pages.landing} />);
  } else if (activePage === 'loading' && json.pages.loading) {
    const dispatchPage: Dispatch<PageLoading.Msg> = mapAppDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'pageLoadingMsg' as 'pageLoadingMsg', value }));
    return (<PageLoading.view dispatch={dispatchPage} state={json.pages.loading} />);
  } else if (activePage === 'signUp' && json.pages.signUp) {
    const dispatchPage: Dispatch<PageSignUp.Msg> = mapAppDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'pageSignUpMsg' as 'pageSignUpMsg', value }));
    return (<PageSignUp.view dispatch={dispatchPage} state={json.pages.signUp} />);
  } else if (activePage === 'say' && json.pages.say) {
    const dispatchPage: Dispatch<PageSay.Msg> = mapAppDispatch(dispatch, value => ({ tag: 'pageSayMsg' as 'pageSayMsg', value }));
    return (<PageSay.view dispatch={dispatchPage} state={json.pages.say} />);
  } else {
    return (<div>Undefined Page: {json.activePage.tag}</div>);
  }
}

const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const dispatchNav: Dispatch<Nav.Msg> = mapAppDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'nav' as 'nav', value }));
  return (
    <div className={`page-${state.activePage.tag}`}>
      <Nav.view state={state.nav} dispatch={dispatchNav} />
      <Container className='mt-5'>
        <Row>
          <Col xs='12'>
            <ViewActivePage state={state} dispatch={dispatch} />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default view;
