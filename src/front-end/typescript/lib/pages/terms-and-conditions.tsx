import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentView, Immutable, Init, Update } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import * as markdown from 'front-end/lib/http/markdown';
import FixedBar from 'front-end/lib/views/fixed-bar';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import Markdown from 'front-end/lib/views/markdown';
import React from 'react';
import { Alert, Col, Row } from 'reactstrap';
import { formatTermsAndConditionsAgreementDate } from 'shared/lib';
import { ADT } from 'shared/lib/types';

export interface State {
  loading: number;
  fixedBarBottom: number;
  errors: string[];
  markdownSource: string;
  userId: string;
  acceptedTermsAt?: Date;
};

export interface Params {
  userId: string;
  fixedBarBottom?: number;
}

type InnerMsg
  = ADT<'acceptTerms'>
  | ADT<'updateFixedBarBottom', number>;

export type Msg = ComponentMsg<InnerMsg, Page>;

export const init: Init<Params, State> = async ({ userId, fixedBarBottom = 0 }) => {
  const result = await api.readOneUser(userId);
  const acceptedTermsAt = result.tag === 'valid' ? result.value.acceptedTermsAt : undefined;
  const errors = result.tag === 'invalid' ? ['An error occurred while loading this page. Please refresh the page and try again.'] : []
  return {
    loading: 0,
    fixedBarBottom,
    errors,
    markdownSource: await markdown.getDocument('terms_and_conditions'),
    userId,
    acceptedTermsAt
  };
};

function startLoading(state: Immutable<State>): Immutable<State> {
  return state.set('loading', state.loading + 1);
}

function stopLoading(state: Immutable<State>): Immutable<State> {
  return state.set('loading', Math.max(state.loading - 1, 0));
}

export const update: Update<State, Msg> = (state, msg) => {
  switch (msg.tag) {
    case 'acceptTerms':
      state = startLoading(state);
      return [
        state,
        async dispatch => {
          const result = await api.updateUser({
            _id: state.userId,
            acceptedTerms: true
          });
          switch (result.tag) {
            case 'valid':
              dispatch({
                tag: '@newUrl',
                value: {
                  tag: 'profile',
                  value: {
                    profileUserId: state.userId
                  }
                }
              });
              return state;
            case 'invalid':
              return stopLoading(state).set('errors', result.value.acceptedTerms || []);
          }
        }
      ];
    case 'updateFixedBarBottom':
      return [state.set('fixedBarBottom', msg.value)];
    default:
      return [state];
  }
};

function isValid(state: State): boolean {
  return !state.errors.length;
}

const ConditionalErrors: ComponentView<State, Msg> = ({ state }) => {
  if (state.errors.length) {
    return (
      <Row className='mb-3'>
        <Col xs='12'>
          <Alert color='danger'>
            {state.errors.map((e, i) => (<div key={`sign-in-error-${i}`}>{e}</div>))}
          </Alert>
        </Col>
      </Row>
    );
  } else {
    return (<div></div>);
  }
};

const AcceptedAt: ComponentView<State, Msg> = props => {
  const { state, dispatch } = props;
  if (state.acceptedTermsAt) {
    return (
      <FixedBar location='bottom' distance={state.fixedBarBottom}>
        <p className='text-align-right mb-0'>
          {formatTermsAndConditionsAgreementDate(state.acceptedTermsAt)}
        </p>
      </FixedBar>
    );
  } else {
    const isLoading = state.loading > 0;
    const isDisabled = isLoading || !isValid(state);
    const acceptTerms = () => !isDisabled && !state.acceptedTermsAt && dispatch({ tag: 'acceptTerms', value: undefined });
    return (
      <FixedBar location='bottom' distance={state.fixedBarBottom}>
        <LoadingButton color={isDisabled ? 'secondary' : 'primary'} onClick={acceptTerms} loading={isLoading} disabled={isDisabled}>
          I Agree
        </LoadingButton>
        <Link page={{ tag: 'profile', value: { profileUserId: state.userId } }} text='Skip' textColor='secondary' />
      </FixedBar>
    );
  }
};

export const view: ComponentView<State, Msg> = props => {
  const { state } = props;
  return (
    <div>
      <Row className='mb-3'>
        <Col xs='12'>
          <h1>Concierge Terms & Conditions</h1>
        </Col>
      </Row>
      <ConditionalErrors {...props} />
      <Row className='mb-5'>
        <Col xs='12'>
          <Markdown source={state.markdownSource} />
        </Col>
      </Row>
      <AcceptedAt {...props} />
    </div>
  );
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
