import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentView, Init, Update } from 'front-end/lib/framework';
import * as PageContainer from 'front-end/lib/views/layout/page-container';
import Link from 'front-end/lib/views/link';
import React from 'react';
import { Col, Row } from 'reactstrap';

export interface State {
  title: string;
  body: string;
  button?: {
    text: string;
    page: Page;
  }
}

export type Params = State;

export type Msg = ComponentMsg<null, Page>;

export const init: Init<Params, State> = async params => {
  return params;
};

export const update: Update<State, Msg> = (state, msg) => {
  return [state];
};

const ConditionalButton: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (state.button) {
    return (
      <Row>
        <Col xs='12'>
          <Link page={state.button.page} text={state.button.text} buttonColor='secondary' />
        </Col>
      </Row>
    );
  } else {
    return null;
  }
};

export const view: ComponentView<State, Msg> = props => {
  const { state } = props;
  return (
    <PageContainer.View paddingY>
      <Row className='mb-3'>
        <Col xs='12'>
          <h1>{state.title}</h1>
        </Col>
      </Row>
      <Row className='mb-3 pb-3'>
        <Col xs='12'>
          <p>{state.body}</p>
        </Col>
      </Row>
      <ConditionalButton {...props} />
    </PageContainer.View>
  );
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
