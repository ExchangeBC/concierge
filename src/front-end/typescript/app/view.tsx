import React from 'react';
import { ComponentView, Dispatch, mapDispatch, newUrl } from '../lib/framework';
import * as PageLanding from '../pages/landing';
import * as PageLoading from '../pages/loading';
import * as PageLoadingTwo from '../pages/loading-two';
import * as PageSay from '../pages/say';
import { Msg, State } from './types';

const ViewActivePage: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const json = state.toJSON();
  const activePage = json.activePage.tag;
  if (activePage === 'landing' && json.pages.landing) {
    const dispatchPage: Dispatch<PageLanding.Msg> = mapDispatch(dispatch as Dispatch<Msg>, data => ({ tag: 'pageLandingMsg' as 'pageLandingMsg', data }));
    return (<PageLanding.view dispatch={dispatchPage} state={json.pages.landing} />);
  } else if (activePage === 'loading' && json.pages.loading) {
    const dispatchPage: Dispatch<PageLoading.Msg> = mapDispatch(dispatch as Dispatch<Msg>, data => ({ tag: 'pageLoadingMsg' as 'pageLoadingMsg', data }));
    return (<PageLoading.view dispatch={dispatchPage} state={json.pages.loading} />);
  } else if (activePage === 'loadingTwo' && json.pages.loadingTwo) {
    const dispatchPage: Dispatch<PageLoadingTwo.Msg> = mapDispatch(dispatch, data => ({ tag: 'pageLoadingTwoMsg' as 'pageLoadingTwoMsg', data }));
    return (<PageLoadingTwo.view dispatch={dispatchPage} state={json.pages.loadingTwo} />);
  } else if (activePage === 'say' && json.pages.say) {
    const dispatchPage: Dispatch<PageSay.Msg> = mapDispatch(dispatch, data => ({ tag: 'pageSayMsg' as 'pageSayMsg', data }));
    return (<PageSay.view dispatch={dispatchPage} state={json.pages.say} />);
  } else {
    return (<div>Undefined Page: {json.activePage.tag}</div>);
  }
}

const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  return (
    <div>
      <h1>Demo App With Routing</h1>
      <button onClick={() => dispatch(newUrl({ tag: 'say' as 'say', data: { message: 'hi' }}))}>
        {`Say "hi"`}
      </button>
      <button onClick={() => dispatch(newUrl({ tag: 'say' as 'say', data: { message: 'hello' }}))}>
        {`Say "hello"`}
      </button>
      <button onClick={() => dispatch(newUrl({ tag: 'loading' as 'loading', data: null }))}>
        Loading
      </button>
      <button onClick={() => dispatch(newUrl({ tag: 'loadingTwo' as 'loadingTwo', data: null }))}>
        Loading Two
      </button>
      <hr />
      <ViewActivePage state={state} dispatch={dispatch} />
    </div>
  );
};

export default view;
