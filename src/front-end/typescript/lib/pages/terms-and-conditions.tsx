import { makePageMetadata, makeStartLoading, makeStopLoading, UpdateState } from 'front-end/lib';
import { isSignedIn } from 'front-end/lib/access-control';
import router from 'front-end/lib/app/router';
import { Route, SharedState } from 'front-end/lib/app/types';
import { ComponentView, emptyPageAlerts, emptyPageBreadcrumbs, GlobalComponentMsg, Immutable, noPageModal, PageComponent, PageInit, replaceRoute, replaceUrl, Update } from 'front-end/lib/framework';
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
  DiscoveryDayResponse = 'DISCOVERY_DAY_RESPONSE',
  CreateRfi = 'CREATE_RFI',
  EditRfi = 'EDIT_RFI',
  SignUpProgramStaff = 'SIGN_UP_PROGRAM_STAFF',
  UserViewAsProgramStaff = 'USER_VIEW_AS_PROGRAM_STAFF',
  CreateVi = 'CREATE_VI',
  EditVi = 'EDIT_VI',
  ViewVisAsBuyer = 'VIEW_VIS_AS_BUYER',
  UploadViApplicationTemplate = 'UPLOAD_VI_APPLICATION_TEMPLATE'
}

function warningIdToString(warningId: WarningId): string {
  switch (warningId) {
    case WarningId.RfiResponse:
      return 'You must accept the terms and conditions in order to respond to a Request for Information.';
    case WarningId.DiscoveryDayResponse:
      return 'You must accept the terms and conditions in order to register for a Discovery Day Session.';
    case WarningId.CreateRfi:
      return 'You must accept the terms and conditions in order to create a Request for Information.';
    case WarningId.EditRfi:
      return 'You must accept the terms and conditions in order to edit a Request for Information.';
    case WarningId.SignUpProgramStaff:
      return 'You must accept the terms and conditions in order to create a Program Staff account.';
    case WarningId.UserViewAsProgramStaff:
      return 'You must accept the terms and conditions in order to view user profiles.';
    case WarningId.CreateVi:
      return 'You must accept the terms and conditions in order to create an Unsolicited Proposal.';
    case WarningId.EditVi:
      return 'You must accept the terms and conditions in order to edit an Unsolicited Proposal.';
    case WarningId.ViewVisAsBuyer:
      return 'You must accept the terms and conditions in order to view Unsolicited Proposals.';
    case WarningId.UploadViApplicationTemplate:
      return 'You must accept the terms and conditions in order to upload an Unsolicited Proposal template.';
  }
}

export function parseWarningId(raw: string): WarningId | null {
  switch (raw.toUpperCase()) {
    case WarningId.RfiResponse:
      return WarningId.RfiResponse;
    case WarningId.DiscoveryDayResponse:
      return WarningId.DiscoveryDayResponse;
    case WarningId.CreateRfi:
      return WarningId.CreateRfi;
    case WarningId.EditRfi:
      return WarningId.EditRfi;
    case WarningId.SignUpProgramStaff:
      return WarningId.SignUpProgramStaff;
    case WarningId.UserViewAsProgramStaff:
      return WarningId.UserViewAsProgramStaff;
    case WarningId.CreateVi:
      return WarningId.CreateVi;
    case WarningId.EditVi:
      return WarningId.EditVi;
    case WarningId.ViewVisAsBuyer:
      return WarningId.ViewVisAsBuyer;
    case WarningId.UploadViApplicationTemplate:
      return WarningId.UploadViApplicationTemplate;
    default:
      return null;
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
}

export interface RouteParams extends Pick<State, 'redirectOnAccept' | 'redirectOnSkip'> {
  warningId?: WarningId;
}

type InnerMsg = ADT<'acceptTerms'>;

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
    const errors = result.tag === 'invalid' ? ['An error occurred while loading this page. Please refresh the page and try again.'] : [];
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
    dispatch(
      replaceRoute({
        tag: 'requestForInformationList' as 'requestForInformationList',
        value: null
      })
    );
    return initState;
  }
});

const startLoading: UpdateState<State> = makeStartLoading('loading');
const stopLoading: UpdateState<State> = makeStopLoading('loading');

function getRedirectUrl(state: Immutable<State>, skip: boolean): string {
  if (state.redirectOnAccept && !skip) {
    return state.redirectOnAccept;
  }
  if (state.redirectOnSkip && skip) {
    return state.redirectOnSkip;
  }
  return router.routeToUrl({
    tag: 'userView',
    value: {
      profileUserId: state.userId
    }
  });
}

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
              dispatch(replaceUrl(getRedirectUrl(state, false)));
              return null;
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

const viewBottomBar: ComponentView<State, Msg> = (props) => {
  const { state, dispatch } = props;
  if (state.acceptedTermsAt) {
    return (
      <FixedBar>
        <p className="text-align-right mb-0">{formatTermsAndConditionsAgreementDate(state.acceptedTermsAt)}</p>
        <Link route={{ tag: 'userView', value: { profileUserId: state.userId } }} className="mr-auto d-none d-md-flex align-items-center" color="secondary">
          <Icon name="chevron-left" color="secondary" />
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
        <Link href={getRedirectUrl(state, true)} color="secondary" className="mx-3">
          {state.warnings.length ? 'Cancel' : 'Skip'}
        </Link>
      </FixedBar>
    );
  }
};

const view: ComponentView<State, Msg> = (props) => {
  const { state } = props;
  return (
    <Container className="mb-5 flex-grow-1">
      <Row className="mb-3">
        <Col xs="12">
          <h1>Concierge Web App Terms and Conditions</h1>
        </Col>
      </Row>
      <Row>
        <Col xs="12">
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
