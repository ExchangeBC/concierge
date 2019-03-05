import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentView, Init, Update } from 'front-end/lib/framework';
import { deleteSession } from 'front-end/lib/http/api';
import Link from 'front-end/lib/views/link';
import { get } from 'lodash';
import React from 'react';
import { Col, Row } from 'reactstrap';
import { ADT } from 'shared/lib/types';

export interface State {
  message: string;
};

export type Msg = ComponentMsg<ADT<'noop'>, Page>;

export type Params = null;

export const init: Init<Params, State> = async () => {
  const session = await deleteSession();
  if (!get(session, 'user')) {
    return { message: 'You have successfully signed out. Thank you for using the Procurement Concierge Program.' };
  } else {
    return { message: 'Signing out of the application failed.' };
  }
};

export const update: Update<State, Msg> = (state, msg) => {
  return [state];
};

export const view: ComponentView<State, Msg> = ({ state }) => {
  return (
    <div>
      <Row className='mb-3 pb-3'>
        <Col xs='12'>
          {state.message}
        </Col>
      </Row>
      <Row>
        <Col xs='12'>
          <Link href='/' text='Return to the Home Page.' buttonColor='secondary' />
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
