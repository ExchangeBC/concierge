import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentView, Init, Update } from 'front-end/lib/framework';
import Link from 'front-end/lib/views/link';
import React from 'react';
import { Col, Row } from 'reactstrap';

export interface State {
  title: string;
  body: string;
  button: {
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

export const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  return (
    <div>
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
      <Row>
        <Col xs='12'>
          <Link page={state.button.page} text={state.button.text} buttonColor='secondary' />
        </Col>
      </Row>
    </div>
  );
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
