import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentView, Init, Update } from 'front-end/lib/framework';
import * as markdown from 'front-end/lib/http/markdown';
import * as PageContainer from 'front-end/lib/views/layout/page-container';
import Markdown from 'front-end/lib/views/markdown';
import React from 'react';
import { Col, Row } from 'reactstrap';

export interface State {
  title: string;
  markdownSource: string;
};

export type Params = null;

export type Msg = ComponentMsg<null, Page>;

export function init(title: string, documentId: string): Init<Params, State> {
  return async () => ({
    title,
    markdownSource: await markdown.getDocument(documentId)
  });
};

export const update: Update<State, Msg> = (state, msg) => {
  return [state];
};

export const view: ComponentView<State, Msg> = props => {
  const { state } = props;
  return (
    <PageContainer.View>
      <Row className='mb-3'>
        <Col xs='12'>
          <h1>{state.title}</h1>
        </Col>
      </Row>
      <Row className='mb-5'>
        <Col xs='12'>
          <Markdown source={state.markdownSource} />
        </Col>
      </Row>
    </PageContainer.View>
  );
};

export function component(title: string, documentId: string): Component<Params, State, Msg> {
  return {
    init: init(title, documentId),
    update,
    view
  };
};
