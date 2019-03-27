import { makeStartLoading, makeStopLoading, UpdateState } from 'front-end/lib';
import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentView, Immutable, Init, Update } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import * as markdown from 'front-end/lib/http/markdown';
import * as FixedBar from 'front-end/lib/views/fixed-bar';
import Icon from 'front-end/lib/views/icon';
import * as PageContainer from 'front-end/lib/views/layout/page-container';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import Markdown from 'front-end/lib/views/markdown';
import React from 'react';
import { Alert, Col, Container, Row } from 'reactstrap';
import { formatTermsAndConditionsAgreementDate } from 'shared/lib';
import { ADT } from 'shared/lib/types';

export interface State {
  loading: number;
  fixedBarBottom: number;
  errors: string[];
  warnings: string[];
  markdownSource: string;
  userId: string;
  acceptedTermsAt?: Date;
  redirectPage?: Page;
};

// TODO add redirectPage param like the sign-in page.
export interface Params extends Pick<State, 'userId' | 'redirectPage'> {
  warnings?: string[];
  fixedBarBottom?: number;
}

type InnerMsg
  = ADT<'acceptTerms'>
  | ADT<'updateFixedBarBottom', number>;

export type Msg = ComponentMsg<InnerMsg, Page>;

export const init: Init<Params, State> = async ({ userId, redirectPage, warnings = [], fixedBarBottom = 0 }) => {
  const result = await api.readOneUser(userId);
  const acceptedTermsAt = result.tag === 'valid' ? result.value.acceptedTermsAt : undefined;
  const errors = result.tag === 'invalid' ? ['An error occurred while loading this page. Please refresh the page and try again.'] : []
  return {
    loading: 0,
    fixedBarBottom,
    errors,
    warnings,
    markdownSource: await markdown.getDocument('terms_and_conditions'),
    userId,
    acceptedTermsAt,
    redirectPage
  };
};

const startLoading: UpdateState<State> = makeStartLoading('loading');
const stopLoading: UpdateState<State> = makeStopLoading('loading');

function getRedirectPage(state: Immutable<State>): Page {
  if (state.redirectPage) { return state.redirectPage; }
  return {
    tag: 'profile',
    value: {
      profileUserId: state.userId
    }
  };
};

export const update: Update<State, Msg> = (state, msg) => {
  switch (msg.tag) {
    case 'acceptTerms':
      state = startLoading(state);
      return [
        state,
        async (state, dispatch) => {
          const result = await api.updateUser({
            _id: state.userId,
            acceptedTerms: true
          });
          switch (result.tag) {
            case 'valid':
              state = state.set('warnings', []);
              dispatch({
                tag: '@newUrl',
                value: getRedirectPage(state)
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

const ConditionalAlerts: ComponentView<State, Msg> = ({ state }) => {
  const hasErrors = !!state.errors.length;
  const hasWarnings = !!state.warnings.length;
  if (hasErrors || hasWarnings) {
    return (
      <Row className='mb-3'>
        <Col xs='12'>
          <Alert color='danger'>
            {hasErrors ? state.errors.map((s, i) => (<div key={`terms-error-${i}`}>{s}</div>)) : null}
          </Alert>
          <Alert color='warn'>
            {hasWarnings ? state.warnings.map((s, i) => (<div key={`terms-warning-${i}`}>{s}</div>)) : null}
          </Alert>
        </Col>
      </Row>
    );
  } else {
    return null;
  }
};

const AcceptedAt: ComponentView<State, Msg> = props => {
  const { state, dispatch } = props;
  const fixedBarLocation = state.fixedBarBottom === 0 ? 'bottom' : undefined;
  const skipPage: Page = state.redirectPage || { tag: 'profile', value: { profileUserId: state.userId } };
  if (state.acceptedTermsAt) {
    return (
      <FixedBar.View location={fixedBarLocation}>
        <p className='text-align-right mb-0'>
          {formatTermsAndConditionsAgreementDate(state.acceptedTermsAt)}
        </p>
        <Link page={skipPage} text='Skip' className='mr-auto d-none d-md-block' buttonClassName='p-0 d-flex align-items-center' textColor='secondary'>
          <Icon name='chevron-left' color='secondary' className='mr-1' />
          My Profile
        </Link>
      </FixedBar.View>
    );
  } else {
    const isLoading = state.loading > 0;
    const isDisabled = isLoading || !isValid(state);
    const acceptTerms = () => !isDisabled && !state.acceptedTermsAt && dispatch({ tag: 'acceptTerms', value: undefined });
    // We only want the Accept/Skip buttons to appear on the bottom of the page.
    return (
      <FixedBar.View>
        <LoadingButton color={isDisabled ? 'secondary' : 'primary'} onClick={acceptTerms} loading={isLoading} disabled={isDisabled}>
          I Accept
        </LoadingButton>
        <Link page={skipPage} text='Skip' textColor='secondary' />
      </FixedBar.View>
    );
  }
};

export const view: ComponentView<State, Msg> = props => {
  const { state } = props;
  const bottomBarIsFixed = state.fixedBarBottom === 0 && !!state.acceptedTermsAt;
  return (
    <PageContainer.View marginFixedBar={bottomBarIsFixed} paddingTop fullWidth>
      <Container className='mb-5 flex-grow-1'>
        <Row className='mb-3'>
          <Col xs='12'>
            <h1>Concierge Terms & Conditions</h1>
          </Col>
        </Row>
        <ConditionalAlerts {...props} />
        <Row>
          <Col xs='12'>
            <Markdown source={state.markdownSource} />
          </Col>
        </Row>
      </Container>
      <AcceptedAt {...props} />
    </PageContainer.View>
  );
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
