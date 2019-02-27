import { Msg, State } from 'front-end/lib/app/types';
import Footer from 'front-end/lib/app/view/footer';
import Nav from 'front-end/lib/app/view/nav';
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
    const dispatchPage: Dispatch<PageLanding.Msg> = mapAppDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'pageLanding' as 'pageLanding', value }));
    return (<PageLanding.view dispatch={dispatchPage} state={json.pages.landing} />);
  } else if (activePage === 'loading' && json.pages.loading) {
    const dispatchPage: Dispatch<PageLoading.Msg> = mapAppDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'pageLoading' as 'pageLoading', value }));
    return (<PageLoading.view dispatch={dispatchPage} state={json.pages.loading} />);
  } else if (activePage === 'signUp' && json.pages.signUp) {
    const dispatchPage: Dispatch<PageSignUp.Msg> = mapAppDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'pageSignUp' as 'pageSignUp', value }));
    return (<PageSignUp.view dispatch={dispatchPage} state={json.pages.signUp} />);
  } else if (activePage === 'say' && json.pages.say) {
    const dispatchPage: Dispatch<PageSay.Msg> = mapAppDispatch(dispatch, value => ({ tag: 'pageSay' as 'pageSay', value }));
    return (<PageSay.view dispatch={dispatchPage} state={json.pages.say} />);
  } else {
    return (<div>Undefined Page: {json.activePage.tag}</div>);
  }
}

const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  return (
    <div className={`page-${state.activePage.tag}`}>
      <Nav />
      <Container className='py-5'>
        <Row>
          <Col xs='12'>
            <ViewActivePage state={state} dispatch={dispatch} />
          </Col>
        </Row>
      </Container>
      <Footer />
    </div>
  );
};

export default view;
