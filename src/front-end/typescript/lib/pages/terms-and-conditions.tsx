import { makePageMetadata, makeStartLoading, makeStopLoading, UpdateState } from 'front-end/lib';
import { isSignedIn } from 'front-end/lib/access-control';
import router from 'front-end/lib/app/router';
import { Route, SharedState } from 'front-end/lib/app/types';
import { ComponentView, emptyPageAlerts, emptyPageBreadcrumbs, GlobalComponentMsg, Immutable, newUrl, noPageModal, PageComponent, PageInit, replaceRoute, Update } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import * as markdown from 'front-end/lib/http/markdown';
import Icon from 'front-end/lib/views/icon';
import FixedBar from 'front-end/lib/views/layout/fixed-bar';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import Markdown from 'front-end/lib/views/markdown';
import React from 'react';
import { Col, Container, Row } from 'reactstrap';
import { formatTermsAndConditionsAgreementDate } from 'shared/lib';
import { ADT } from 'shared/lib/types';

export enum WarningId {
  RfiResponse = 'RFI_RESPONSE',
  DiscoveryDayResponse = 'DISCOVERY_DAY_RESPONSE'
}

function warningIdToString(warningId: WarningId): string {
  switch (warningId) {
    case WarningId.RfiResponse:
      return 'You must accept the terms and conditions in order to respond to a Request for Information.';
    case WarningId.DiscoveryDayResponse:
      return 'You must accept the terms and conditions in order to register for a Discovery Session.';
  }
}

export function parseWarningId(raw: string): WarningId | null {
  switch (raw.toUpperCase()) {
    case 'RFI_RESPONSE':
      return WarningId.RfiResponse;
    case 'DISCOVERY_DAY_RESPONSE':
      return WarningId.DiscoveryDayResponse;
    default:
      return null
  }
}

export interface State {
  loading: number;
  errors: string[];
  warnings: string[];
  markdownSource: string;
  userId: string;
  acceptedTermsAt?: Date;
  redirectOnAccept?: string;
  redirectOnSkip?: string;
};

export interface RouteParams extends Pick<State, 'redirectOnAccept' | 'redirectOnSkip'> {
  warningId?: WarningId;
}

type InnerMsg
  = ADT<'acceptTerms'>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

const initState: State = {
  loading: 0,
  errors: [],
  warnings: [],
  markdownSource: '',
  userId: ''
};

const init: PageInit<RouteParams, SharedState, State, Msg> = isSignedIn({

  async success({ routeParams, shared }) {
    const { redirectOnAccept, redirectOnSkip, warningId } = routeParams;
    const userId = shared.sessionUser.id;
    const result = await api.readOneUser(userId);
    const acceptedTermsAt = result.tag === 'valid' ? result.value.acceptedTermsAt : undefined;
    const errors = result.tag === 'invalid' ? ['An error occurred while loading this page. Please refresh the page and try again.'] : []
    return {
      ...initState,
      errors,
      warnings: warningId ? [warningIdToString(warningId)] : [],
      markdownSource: await markdown.getDocument('terms_and_conditions'),
      userId,
      acceptedTermsAt,
      redirectOnAccept,
      redirectOnSkip
    };
  },

  async fail({ dispatch }) {
    dispatch(replaceRoute({
      tag: 'requestForInformationList' as 'requestForInformationList',
      value: null
    }));
    return initState;
  }

});

const startLoading: UpdateState<State> = makeStartLoading('loading');
const stopLoading: UpdateState<State> = makeStopLoading('loading');

function getRedirectUrl(state: Immutable<State>, skip: boolean): string {
  if (state.redirectOnAccept && !skip) { return state.redirectOnAccept; }
  if (state.redirectOnSkip && skip) { return state.redirectOnSkip; }
  return router.routeToUrl({
    tag: 'userView',
    value: {
      profileUserId: state.userId
    }
  });
};

const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'acceptTerms':
      state = startLoading(state);
      return [
        state,
        async (state, dispatch) => {
          const result = await api.updateUser({
            id: state.userId,
            acceptedTerms: true
          });
          switch (result.tag) {
            case 'valid':
              state = state.set('warnings', []);
              dispatch(newUrl(getRedirectUrl(state, false)));
              return state;
            case 'invalid':
              return stopLoading(state).set('errors', result.value.acceptedTerms || []);
          }
        }
      ];
    default:
      return [state];
  }
};

function isValid(state: State): boolean {
  return !state.errors.length;
}

const viewBottomBar: ComponentView<State, Msg> = props => {
  const { state, dispatch } = props;
  if (state.acceptedTermsAt) {
    return (
      <FixedBar>
        <p className='text-align-right mb-0'>
          {formatTermsAndConditionsAgreementDate(state.acceptedTermsAt)}
        </p>
        <Link route={{ tag: 'userView', value: { profileUserId: state.userId } }} className='mr-auto d-none d-md-flex align-items-center' color='secondary'>
          <Icon name='chevron-left' color='secondary' />
          My Profile
        </Link>
      </FixedBar>
    );
  } else {
    const isLoading = state.loading > 0;
    const isDisabled = isLoading || !isValid(state);
    const acceptTerms = () => !isDisabled && !state.acceptedTermsAt && dispatch({ tag: 'acceptTerms', value: undefined });
    // We only want the Accept/Skip buttons to appear on the bottom of the page.
    return (
      <FixedBar>
        <LoadingButton color={isDisabled ? 'secondary' : 'primary'} onClick={acceptTerms} loading={isLoading} disabled={isDisabled}>
          I Accept
        </LoadingButton>
        <Link href={getRedirectUrl(state, true)} color='secondary' className='mx-3'>
          {state.warnings.length ? 'Cancel' : 'Skip'}
        </Link>
      </FixedBar>
    );
  }
};

const view: ComponentView<State, Msg> = props => {
  const { state } = props;
  return (
    <Container className='mb-5 flex-grow-1'>
      <Row className='mb-3'>
        <Col xs='12'>
          <h1>Concierge Web App Terms and Conditions</h1>
        </Col>
      </Row>
      <Row>
        <Col xs='12'>
          <Markdown source={state.markdownSource} />
        </Col>
      </Row>
    </Container>
  );
};

export const component: PageComponent<RouteParams, SharedState, State, Msg> = {
  init,
  update,
  view,
  viewBottomBar,
  getAlerts(state) {
    return {
      ...emptyPageAlerts(),
      warnings: state.warnings,
      errors: state.errors
    };
  },
  getMetadata() {
    return makePageMetadata('Terms and Conditions');
  },
  getBreadcrumbs: emptyPageBreadcrumbs,
  getModal: noPageModal
};
