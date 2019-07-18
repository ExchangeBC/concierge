import { makePageMetadata, makeStartLoading, makeStopLoading, UpdateState } from 'front-end/lib';
import { isUserType } from 'front-end/lib/access-control';
import router from 'front-end/lib/app/router';
import { Route, SharedState } from 'front-end/lib/app/types';
import { ComponentView, Dispatch, emptyPageAlerts, GlobalComponentMsg, Immutable, immutable, mapComponentDispatch, newRoute, PageComponent, PageInit, replaceRoute, Update, updateComponentChild } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import * as Attendees from 'front-end/lib/pages/request-for-information/components/attendees';
import DiscoveryDayInfo from 'front-end/lib/pages/request-for-information/views/discovery-day-info';
import { WarningId } from 'front-end/lib/pages/terms-and-conditions';
import FixedBar from 'front-end/lib/views/layout/fixed-bar';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import React from 'react';
import { Col, Row } from 'reactstrap';
import * as DdrResource from 'shared/lib/resources/discovery-day-response';
import { PublicRfi } from 'shared/lib/resources/request-for-information';
import { PublicSessionUser } from 'shared/lib/resources/session';
import { ADT, profileToName, UserType } from 'shared/lib/types';
import { invalid, valid, ValidOrInvalid } from 'shared/lib/validators';

export interface RouteParams {
  rfiId: string;
}

export type InnerMsg
  = ADT<'attendees', Attendees.Msg>
  | ADT<'submit'>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

interface ValidState {
  submitLoading: number;
  sessionUser: PublicSessionUser;
  rfi: PublicRfi;
  ddr?: DdrResource.PublicDiscoveryDayResponse;
  attendees: Immutable<Attendees.State>;
};

type InvalidState = null;

export type State = ValidOrInvalid<Immutable<ValidState>, InvalidState>;

const init: PageInit<RouteParams, SharedState, State, Msg> = isUserType({

  userTypes: [UserType.Vendor],

  async success({ routeParams, shared, dispatch }) {
    const { rfiId } = routeParams;
    const { sessionUser } = shared;
    const notFoundRoute: Route = {
      tag: 'notice',
      value: {
        noticeId: { tag: 'notFound', value: undefined }
      }
    };
    const termsAndConditionsRoute: Route = {
      tag: 'termsAndConditions' as const,
      value: {
        warningId: WarningId.DiscoveryDayResponse,
        redirectOnAccept: router.routeToUrl({
          tag: 'requestForInformationAttendDiscoveryDay' as const,
          value: { rfiId }
        }),
        redirectOnSkip: router.routeToUrl({
          tag: 'requestForInformationView' as const,
          value: { rfiId }
        })
      }
    };
    const fail = (route: Route) => {
      dispatch(replaceRoute(route));
      return invalid(null);
    };
    const userResult = await api.readOneUser(sessionUser.id);
    if (userResult.tag === 'invalid' || !userResult.value.acceptedTermsAt) {
      return fail(termsAndConditionsRoute);
    }
    const rfiResult = await api.readOneRfi(rfiId);
    if (rfiResult.tag === 'invalid') { return fail(notFoundRoute); }
    const rfi = rfiResult.value;
    const ddrResult = await api.readOneDdr(sessionUser.id, rfi._id);
    return valid(immutable({
      submitLoading: 0,
      sessionUser,
      rfi,
      ddr: ddrResult.tag === 'valid' ? ddrResult.value : undefined,
      attendees: immutable(await Attendees.init({
        groups: [{
          vendor: userResult.value,
          attendees: ddrResult.tag === 'valid'
            ? ddrResult.value.attendees.map(a => ({ ...a, errors: [] }))
            : [{
              name: profileToName(userResult.value.profile) || '',
              email: userResult.value.email,
              remote: false,
              errors: []
            }]
        }]
      }))
    }));
  },

  async fail({ routeParams, dispatch }) {
    dispatch(newRoute({
      tag: 'requestForInformationView',
      value: {
        rfiId: routeParams.rfiId
      }
    }));
    return invalid(null);
  }

});

const startSubmitLoading: UpdateState<ValidState> = makeStartLoading('submitLoading');
const stopSubmitLoading: UpdateState<ValidState> = makeStopLoading('submitLoading');

const update: Update<State, Msg> = ({ state, msg }) => {
  if (state.tag === 'invalid') { return [state]; }
  switch (msg.tag) {
    case 'attendees':
      return updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'attendees', value }),
        childStatePath: ['attendees'],
        childUpdate: Attendees.update,
        childMsg: msg.value
      });
    case 'submit':
      return [state.set('value', stopSubmitLoading(startSubmitLoading(state.value)))];
    default:
      return [state];
  }
};

const viewBottomBar: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (state.tag === 'invalid') { return null; }
  const { rfi, submitLoading } = state.value;
  const isLoading = submitLoading > 0;
  const isDisabled = isLoading;
  const submit = () => !isDisabled && dispatch({ tag: 'submit', value: undefined });
  return (
    <FixedBar>
      <LoadingButton color='primary' onClick={submit} loading={isLoading} disabled={isDisabled} className='text-nowrap'>
        Submit Response
      </LoadingButton>
      <Link route={{ tag: 'requestForInformationView', value: { rfiId: rfi._id }}} color='secondary' className='text-nowrap mx-3'>
        Cancel
      </Link>
    </FixedBar>
  );
};

const view: ComponentView<State, Msg> = props => {
  const { state, dispatch } = props;
  if (state.tag === 'invalid') { return null; }
  const rfi = state.value.rfi;
  const version = rfi.latestVersion;
  const dispatchAttendees: Dispatch<Attendees.Msg> = mapComponentDispatch(dispatch, value => ({ tag: 'attendees' as const, value }));
  return (
    <div>
      <Row className='mb-5'>
        <Col xs='12' className='d-flex flex-column'>
          <h1>Discovery Day Registration</h1>
          <h3>{version.rfiNumber}: {version.title}</h3>
          <p className='mt-2'>
            Please complete the following form to register one of more of your company's representatives to this RFI's Discovery Day session.
          </p>
        </Col>
      </Row>
      <Row>
        <Col xs='12'>
          <h2>Session Information</h2>
        </Col>
      </Row>
      <DiscoveryDayInfo discoveryDay={version.discoveryDay} />
      <Row className='mt-5 pb-3'>
        <Col xs='12'>
          <h2>Attendee(s)</h2>
        </Col>
      </Row>
      <Row>
        <Col xs='12'>
          <Attendees.view state={state.value.attendees} dispatch={dispatchAttendees} />
        </Col>
      </Row>
    </div>
  );
};

export const component: PageComponent<RouteParams, SharedState, State, Msg> = {
  init,
  update,
  view,
  viewBottomBar,
  getAlerts: emptyPageAlerts,
  getMetadata(state) {
    const title = `Attend Discovery Day${state.tag === 'valid' ? ' — ' + state.value.rfi.latestVersion.rfiNumber : ''}`;
    return makePageMetadata(title);
  },
  getBreadcrumbs(state) {
    if (state.tag === 'invalid') { return []; }
    return [
      {
        text: 'RFIs',
        onClickMsg: newRoute({
          tag: 'requestForInformationList',
          value: null
        })
      },
      {
        text: state.value.rfi.latestVersion.rfiNumber,
        onClickMsg: newRoute({
          tag: 'requestForInformationView',
          value: {
            rfiId: state.value.rfi._id
          }
        })
      },
      {
        text: 'Attend Discovery Day'
      }
    ];
  },
  getModal(state) {
    return null;
  }
};
