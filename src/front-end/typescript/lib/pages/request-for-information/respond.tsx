import { makeStartLoading, makeStopLoading, UpdateState } from 'front-end/lib';
import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentView, Init, replaceUrl, Update } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import * as FixedBar from 'front-end/lib/views/fixed-bar';
import FormSectionHeading from 'front-end/lib/views/form-section-heading';
import * as PageContainer from 'front-end/lib/views/layout/page-container';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import { default as React } from 'react';
import { Col, Container, Row } from 'reactstrap';
import { PublicRfi } from 'shared/lib/resources/request-for-information';
import { PublicUser } from 'shared/lib/resources/user';
import { ADT, Omit, UserType } from 'shared/lib/types';
import { invalid, valid, ValidOrInvalid } from 'shared/lib/validators';

export interface Params {
  rfiId: string;
  fixedBarBottom?: number;
}

export type InnerMsg
  = ADT<'handleInitError'>
  | ADT<'submit'>
  | ADT<'updateFixedBarBottom', number>;

export type Msg = ComponentMsg<InnerMsg, Page>;

type InitError
  = ADT<'notSignedIn', PublicRfi>
  | ADT<'notVendor', PublicRfi>
  | ADT<'notAcceptedTerms', [PublicRfi, PublicUser]>
  | ADT<'invalidRfi'>;

export interface State {
  fixedBarBottom: number;
  loading: number;
  init: ValidOrInvalid<{ rfi: PublicRfi, user: PublicUser }, InitError>;
  handledInitError: boolean;
};

export const init: Init<Params, State> = async ({ rfiId, fixedBarBottom = 0 }) => {
  const rfiResult = await api.readOneRfi(rfiId);
  const baseState: Omit<State, 'init'> = {
    fixedBarBottom,
    loading: 0,
    handledInitError: false
  };
  switch (rfiResult.tag) {
    case 'valid':
      const rfi = rfiResult.value;
      // TODO once front-end session/auth definitions have been refactored,
      // this code can be refactored too.
      const sessionResult = await api.getSession();
      if (sessionResult.tag === 'invalid' || !sessionResult.value.user) {
        return {
          ...baseState,
          init: invalid({
            tag: 'notSignedIn' as 'notSignedIn',
            value: rfi
          })
        };
      }
      const userResult = await api.readOneUser(sessionResult.value.user.id);
      if (userResult.tag === 'invalid' || userResult.value.profile.type !== UserType.Vendor) {
        return {
          ...baseState,
          init: invalid({
            tag: 'notVendor' as 'notVendor',
            value: rfi
          })
        };
      }
      const user = userResult.value;
      if (!userResult.value.acceptedTermsAt) {
        return {
          ...baseState,
          init: invalid({
            tag: 'notAcceptedTerms' as 'notAcceptedTerms',
            value: [rfi, user] as [PublicRfi, PublicUser]
          })
        };
      }
      return {
        ...baseState,
        init: valid({ rfi, user })
      };
    case 'invalid':
      return {
        ...baseState,
        init: invalid({
          tag: 'invalidRfi' as 'invalidRfi',
          value: undefined
        })
      };
  }
};

const startLoading: UpdateState<State> = makeStartLoading('loading');
const stopLoading: UpdateState<State> = makeStopLoading('loading');

const respondToRfiPage = (rfi: PublicRfi): Page => ({
  tag: 'requestForInformationRespond',
  value: {
    rfiId: rfi._id
  }
});

const viewRfiPage = (rfi: PublicRfi): Page => ({
  tag: 'requestForInformationView',
  value: {
    rfiId: rfi._id
  }
});

export const update: Update<State, Msg> = (state, msg) => {
  switch (msg.tag) {
    case 'handleInitError':
      return [
        state.set('handledInitError', true),
        async (state, dispatch) => {
          if (state.init.tag === 'valid') { return state; }
          // Handle cases where the user should not be able to respond to this RFI.
          const error = state.init.value;
          switch (error.tag) {
            case 'notSignedIn':
              dispatch(replaceUrl({
                tag: 'signIn' as 'signIn',
                value: {
                  redirectOnSuccess: respondToRfiPage(error.value)
                }
              }));
              return state;
            case 'notVendor':
              dispatch(replaceUrl({
                tag: 'noticeRfiNonVendorResponse' as 'noticeRfiNonVendorResponse',
                value: { rfiId: error.value._id }
              }));
              return state;
            case 'notAcceptedTerms':
              const [rfi, user] = error.value;
              dispatch(replaceUrl({
                tag: 'termsAndConditions' as 'termsAndConditions',
                value: {
                  userId: user._id,
                  warnings: ['You must accept the terms and conditions in order to respond to a Request for Information.'],
                  redirectOnAccept: respondToRfiPage(rfi),
                  redirectOnSkip: viewRfiPage(rfi)
                }
              }));
              return state;
            case 'invalidRfi':
              dispatch(replaceUrl({
                tag: 'noticeNotFound' as 'noticeNotFound',
                value: null
              }));
              return state;
          }
        }
      ];
    case 'submit':
      if (state.init.tag === 'invalid') { return [state]; }
      return [
        startLoading(state),
        async (state, dispatch) => {
          return stopLoading(state);
        }
      ];
    case 'updateFixedBarBottom':
      return [state.set('fixedBarBottom', msg.value)];
    default:
      return [state];
  }
};

const Attachments: ComponentView<State, Msg> = ({ state }) => {
  return (
    <div>
      <FormSectionHeading text='Attachments' />
      <Row>
        <Col xs='12'>
        </Col>
      </Row>
    </div>
  );
}

const Buttons: ComponentView<State, Msg> = props => {
  const { state, dispatch } = props;
  const bottomBarIsFixed = state.fixedBarBottom === 0;
  const submit = () => dispatch({ tag: 'submit', value: undefined });
  const isLoading = state.loading > 0;
  const isDisabled = isLoading;
  return (
    <FixedBar.View location={bottomBarIsFixed ? 'bottom' : undefined}>
      <LoadingButton color='primary' onClick={submit} loading={isLoading} disabled={isDisabled} className='text-nowrap'>
        Submit Response
      </LoadingButton>
      <Link buttonColor={isLoading ? 'secondary' : 'primary'} disabled={isLoading} className='text-nowrap'>
        Respond to RFI
      </Link>
    </FixedBar.View>
  );
};

export const view: ComponentView<State, Msg> = props => {
  const { state, dispatch } = props;
  // Handle cases where the user should not be able to respond to this RFI.
  if (state.init.tag === 'invalid') {
    if (!state.handledInitError) {
      dispatch({ tag: 'handleInitError', value: undefined });
    }
    // Return a blank page.
    return (
      <PageContainer.View paddingY>
        <Row>
          <Col xs='12'></Col>
        </Row>
      </PageContainer.View>
    );
  }
  // If the user is in the correct state, render the response form.
  const { rfi } = state.init.value;
  if (!rfi.latestVersion) { return null; }
  const version = rfi.latestVersion;
  const bottomBarIsFixed = state.fixedBarBottom === 0;
  return (
    <PageContainer.View marginFixedBar={bottomBarIsFixed} paddingTop fullWidth>
      <Container className='mb-5 flex-grow-1'>
        <Row className='mb-5'>
          <Col xs='12' className='d-flex flex-column text-center align-items-center'>
            <h1>Response to RFI Number: {version.rfiNumber}</h1>
            <h2>{version.title}</h2>
            <p>
              Please submit your response to this RFI by following the instructions defined
              in its
              <Link page={viewRfiPage(rfi)} textColor='primary' buttonClassName='p-0'>description</Link>.
            </p>
          </Col>
        </Row>
        <Attachments {...props} />
      </Container>
      <Buttons {...props} />
    </PageContainer.View>
  );
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
