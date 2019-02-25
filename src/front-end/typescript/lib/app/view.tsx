import { Msg, State } from 'front-end/lib/app/types';
import { ComponentView, Dispatch, mapDispatch, newUrl } from 'front-end/lib/framework';
import * as PageLanding from 'front-end/lib/pages/landing';
import * as PageLoading from 'front-end/lib/pages/loading';
import * as PageSay from 'front-end/lib/pages/say';
import React from 'react';
import { Col, Container, Row } from 'reactstrap';

const ViewActivePage: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const json = state.toJSON();
  const activePage = json.activePage.tag;
  if (activePage === 'landing' && json.pages.landing) {
    const dispatchPage: Dispatch<PageLanding.Msg> = mapDispatch(dispatch as Dispatch<Msg>, data => ({ tag: 'pageLandingMsg' as 'pageLandingMsg', data }));
    return (<PageLanding.view dispatch={dispatchPage} state={json.pages.landing} />);
  } else if (activePage === 'loading' && json.pages.loading) {
    const dispatchPage: Dispatch<PageLoading.Msg> = mapDispatch(dispatch as Dispatch<Msg>, data => ({ tag: 'pageLoadingMsg' as 'pageLoadingMsg', data }));
    return (<PageLoading.view dispatch={dispatchPage} state={json.pages.loading} />);
  } else if (activePage === 'say' && json.pages.say) {
    const dispatchPage: Dispatch<PageSay.Msg> = mapDispatch(dispatch, data => ({ tag: 'pageSayMsg' as 'pageSayMsg', data }));
    return (<PageSay.view dispatch={dispatchPage} state={json.pages.say} />);
  } else {
    return (<div>Undefined Page: {json.activePage.tag}</div>);
  }
}

const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  return (
    <Container>
      <Row>
        <Col xs='auto'>
          <h1>Concierge</h1>
        </Col>
      </Row>
      <Row>
        <Col xs='auto'>
          <button onClick={() => dispatch(newUrl({ tag: 'say' as 'say', data: { message: 'hi' }}))}>
            {`Say "hi"`}
          </button>
          <button onClick={() => dispatch(newUrl({ tag: 'say' as 'say', data: { message: 'hello' }}))}>
            {`Say "hello"`}
          </button>
          <button onClick={() => dispatch(newUrl({ tag: 'loading' as 'loading', data: null }))}>
            Loading
          </button>
        </Col>
      </Row>
      <Row>
        <Col xs='12'>
          <ViewActivePage state={state} dispatch={dispatch} />
        </Col>
      </Row>
    </Container>
  );
};

export default view;
