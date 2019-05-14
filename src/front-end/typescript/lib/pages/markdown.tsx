import { makePageMetadata } from 'front-end/lib';
import { Route, SharedState } from 'front-end/lib/app/types';
import { ComponentView, emptyPageAlerts, GlobalComponentMsg, PageComponent, PageInit, Update } from 'front-end/lib/framework';
import * as markdown from 'front-end/lib/http/markdown';
import Markdown from 'front-end/lib/views/markdown';
import React from 'react';
import { Col, Row } from 'reactstrap';

type DocumentId
  = 'about'
  | 'accessibility'
  | 'copyright'
  | 'disclaimer'
  | 'privacy'
  | 'guide';

function documentIdToTitle(documentId: DocumentId): string {
  switch (documentId) {
    case 'about':
      return 'About';
    case 'accessibility':
      return 'Accessibility';
    case 'copyright':
      return 'Copyright';
    case 'disclaimer':
      return 'Disclaimer';
    case 'privacy':
      return 'Privacy';
    case 'guide':
      return 'How to Use the Procurement Concierge Program\'s Web Application';
  }
}

export interface State {
  title: string;
  markdownSource: string;
};

export interface RouteParams {
  documentId: DocumentId;
};

export type Msg = GlobalComponentMsg<null, Route>;

const init: PageInit<RouteParams, SharedState, State, Msg> = async ({ routeParams }) => {
  const { documentId } = routeParams;
  return {
    title: documentIdToTitle(documentId),
    markdownSource: await markdown.getDocument(documentId)
  };
};

const update: Update<State, Msg> = ({ state, msg }) => {
  return [state];
};

const view: ComponentView<State, Msg> = props => {
  const { state } = props;
  return (
    <div>
      <Row className='mb-3'>
        <Col xs='12'>
          <h1>{state.title}</h1>
        </Col>
      </Row>
      <Row className='mb-5'>
        <Col xs='12'>
          <Markdown source={state.markdownSource} escapeHtml={false} />
        </Col>
      </Row>
    </div>
  );
};

export const component: PageComponent<RouteParams, SharedState, State, Msg> = {
  init,
  update,
  view,
  getAlerts: emptyPageAlerts,
  getMetadata({ title }) {
    return makePageMetadata(title);
  }
};
