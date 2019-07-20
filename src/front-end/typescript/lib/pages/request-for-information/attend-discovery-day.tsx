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
import { PublicDiscoveryDay, PublicRfi } from 'shared/lib/resources/request-for-information';
import { PublicUser } from 'shared/lib/resources/user';
import { ADT, profileToName, UserType } from 'shared/lib/types';
import { invalid, valid, ValidOrInvalid } from 'shared/lib/validators';

export interface RouteParams {
  rfiId: string;
}

export type InnerMsg
  = ADT<'attendees', Attendees.Msg>
  | ADT<'startEditing'>
  | ADT<'cancelEditing'>
  | ADT<'cancelRegistration'>
  | ADT<'submitCreate'>
  | ADT<'submitEdit'>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

interface ValidState {
  isEditing: boolean;
  submitLoading: number;
  cancelRegistrationLoading: number;
  rfi: PublicRfi;
  discoveryDay: PublicDiscoveryDay;
  vendor: PublicUser;
  ddr?: DdrResource.PublicDiscoveryDayResponse;
  attendees: Immutable<Attendees.State>;
};

type InvalidState = null;

export type State = ValidOrInvalid<Immutable<ValidState>, InvalidState>;

async function resetAttendees(discoveryDay: PublicDiscoveryDay, vendor: PublicUser, ddr?: DdrResource.PublicDiscoveryDayResponse): Promise<Immutable<Attendees.State>> {
  return immutable(await Attendees.init({
    occurringAt: discoveryDay.occurringAt,
    groups: [{
      attendees: ddr
        ? ddr.attendees
        : [{
            name: profileToName(vendor.profile) || '',
            email: vendor.email,
            remote: false
          }]
    }]
  }));
}

async function resetState(state: Immutable<State>, ddr?: DdrResource.PublicDiscoveryDayResponse): Promise<Immutable<State>> {
  if (state.tag === 'invalid') { return state; }
  return state
    .setIn(['value', 'isEditing'], !ddr)
    .setIn(['value', 'ddr'], ddr)
    .setIn(['value', 'attendees'], await resetAttendees(state.value.discoveryDay, state.value.vendor, ddr));
}

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
    if (!rfi.latestVersion.discoveryDay) { return fail(notFoundRoute); }
    const discoveryDay = rfi.latestVersion.discoveryDay;
    const ddrResult = await api.readOneDdr(sessionUser.id, rfi._id);
    const ddr = ddrResult.tag === 'valid' ? ddrResult.value : undefined;
    return valid(immutable({
      isEditing: !ddr,
      submitLoading: 0,
      vendor: userResult.value,
      rfi,
      discoveryDay,
      ddr,
      attendees: await resetAttendees(discoveryDay, userResult.value, ddr)
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
const startCancelRegistrationLoading: UpdateState<ValidState> = makeStartLoading('cancelRegistrationLoading');
const stopCancelRegistrationLoading: UpdateState<ValidState> = makeStopLoading('cancelRegistrationLoading');

const update: Update<State, Msg> = ({ state, msg }) => {
  if (state.tag === 'invalid') { return [state]; }
  switch (msg.tag) {

    case 'attendees':
      return updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'attendees', value }),
        childStatePath: ['value', 'attendees'],
        childUpdate: Attendees.update,
        childMsg: msg.value
      });

    case 'startEditing':
      return [state.setIn(['value', 'isEditing'], true)];

    case 'cancelEditing':
    return [
      state.setIn(['value', 'isEditing'], false),
      async state => {
        if (state.tag === 'invalid') { return state; }
        return await resetState(state, state.value.ddr);
      }
    ];

    case 'cancelRegistration':
      return [
        state.set('value', startCancelRegistrationLoading(state.value)),
        async state => {
          if (state.tag === 'invalid') { return state; }
          state = state.set('value', stopCancelRegistrationLoading(state.value));
          const result = await api.deleteDdr(state.value.vendor._id, state.value.rfi._id);
          switch (result.tag) {
            case 'valid':
              return await resetState(state, undefined);
            case 'invalid':
              return state;
          }
        }
      ];

    case 'submitCreate':
      return [
        state.set('value', startSubmitLoading(state.value)),
        async state => {
          if (state.tag === 'invalid') { return state; }
          state = state.set('value', stopSubmitLoading(state.value));
          const result = await api.createDdr({
            rfiId: state.value.rfi._id,
            vendorId: state.value.vendor._id,
            attendees: state.value.attendees.groups[0].attendees
          });
          switch (result.tag) {
            case 'valid':
              return await resetState(state, result.value);
            case 'invalid':
              return state
                .setIn(['value', 'attendees'], Attendees.setErrors(state.value.attendees, [result.value.attendees || []]));
          }
        }
      ];

    case 'submitEdit':
      return [
        state.set('value', startSubmitLoading(state.value)),
        async state => {
          if (state.tag === 'invalid') { return state; }
          state = state.set('value', stopSubmitLoading(state.value));
          const result = await api.updateDdr(state.value.vendor._id, state.value.rfi._id, state.value.attendees.groups[0].attendees);
          switch (result.tag) {
            case 'valid':
              return await resetState(state, result.value);
            case 'invalid':
            return state
              .setIn(['value', 'attendees'], Attendees.setErrors(state.value.attendees, [result.value.attendees || []]));
          }
        }
      ];

    default:
      return [state];
  }
};

const viewBottomBar: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (state.tag === 'invalid') { return null; }
  const { rfi, ddr, isEditing, submitLoading, cancelRegistrationLoading } = state.value;
  const isSubmitLoading = submitLoading > 0;
  const isCancelRegistrationLoading = cancelRegistrationLoading > 0;
  const isLoading = isSubmitLoading || isCancelRegistrationLoading;
  const isDisabled = isLoading || !Attendees.isValid(state.value.attendees);
  const submitCreate = () => !isDisabled && dispatch({ tag: 'submitCreate', value: undefined });
  const submitEdit = () => !isDisabled && dispatch({ tag: 'submitEdit', value: undefined });
  const startEditing = () => dispatch({ tag: 'startEditing', value: undefined });
  const cancelEditing = () => dispatch({ tag: 'cancelEditing', value: undefined });
  const cancelRegistration = () => dispatch({ tag: 'cancelRegistration', value: undefined });
  if (!ddr) {
    return (
      <FixedBar>
        <LoadingButton color='primary' onClick={submitCreate} loading={isSubmitLoading} disabled={isDisabled} className='text-nowrap'>
          Submit Registration
        </LoadingButton>
        <Link route={{ tag: 'requestForInformationView', value: { rfiId: rfi._id }}} color='secondary' className='text-nowrap mx-3'>
          Cancel
        </Link>
      </FixedBar>
    );
  } else {
    if (isEditing) {
      return (
        <FixedBar>
          <LoadingButton color='primary' onClick={submitEdit} loading={isSubmitLoading} disabled={isDisabled} className='text-nowrap'>
            Submit Changes
          </LoadingButton>
          <Link onClick={cancelEditing} color='secondary' className='text-nowrap mx-3'>
            Cancel
          </Link>
        </FixedBar>
      );
    } else {
      return (
        <FixedBar>
          <Link button color='primary' onClick={startEditing} disabled={isLoading} className='text-nowrap'>
            Edit Registration
          </Link>
          <LoadingButton color='danger' onClick={cancelRegistration} loading={isCancelRegistrationLoading} disabled={isLoading} className='text-nowrap mx-3'>
            Cancel Registration
          </LoadingButton>
          <Link route={{ tag: 'requestForInformationView', value: { rfiId: rfi._id }}} color='secondary' className='text-nowrap'>
            Cancel
          </Link>
        </FixedBar>
      );
    }
  }
};

const view: ComponentView<State, Msg> = props => {
  const { state, dispatch } = props;
  if (state.tag === 'invalid') { return null; }
  const { attendees, rfi, isEditing } = state.value;
  const version = rfi.latestVersion;
  const dispatchAttendees: Dispatch<Attendees.Msg> = mapComponentDispatch(dispatch, value => ({ tag: 'attendees' as const, value }));
  return (
    <div>
      <Row className='mb-5'>
        <Col xs='12' className='d-flex flex-column'>
          <h1>Discovery Day Registration</h1>
          <h3>{version.rfiNumber}: {version.title}</h3>
        </Col>
      </Row>
      <Row>
        <Col xs='12'>
          <h2>Session Information</h2>
        </Col>
      </Row>
      <DiscoveryDayInfo discoveryDay={state.value.discoveryDay} />
      <Row className='mt-5 pb-3'>
        <Col xs='12' className='d-flex flex-column'>
          <h2>Attendee(s)</h2>
          <p>
            Please complete the following form to register one of more of your company's representatives to this RFI's Discovery Day session. If you are not personally attending, please clear your name and email from the list of attendees, and add the information of your colleagues that will be.
          </p>
          <p className='mt-2'>
            In-person and/or remote attendance information will be emailed to all attendees individually based on the information you provide.
          </p>
        </Col>
      </Row>
      <Row>
        <Col xs='12'>
          <Attendees.view state={attendees} dispatch={dispatchAttendees} disabled={!isEditing} />
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
