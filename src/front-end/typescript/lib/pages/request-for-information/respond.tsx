import { makeStartLoading, makeStopLoading, UpdateState } from 'front-end/lib';
import AppRouter from 'front-end/lib/app/router';
import { Page } from 'front-end/lib/app/types';
import * as FileMulti from 'front-end/lib/components/input/file-multi';
import { Component, ComponentMsg, ComponentView, Dispatch, Immutable, immutable, Init, mapComponentDispatch, newUrl, replaceUrl, Update, updateComponentChild, View } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import { uploadFiles } from 'front-end/lib/pages/request-for-information/lib';
import * as FixedBar from 'front-end/lib/views/fixed-bar';
import * as PageContainer from 'front-end/lib/views/layout/page-container';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import { default as React } from 'react';
import { Col, Container, Row } from 'reactstrap';
import { PublicRfi, rfiToRfiStatus } from 'shared/lib/resources/request-for-information';
import { PublicUser } from 'shared/lib/resources/user';
import { ADT, Omit, RfiStatus, UserType } from 'shared/lib/types';
import { invalid, valid, ValidOrInvalid } from 'shared/lib/validators';

export interface Params {
  rfiId: string;
  fixedBarBottom?: number;
}

export type InnerMsg
  = ADT<'handleInitError'>
  | ADT<'onChangeAttachments', FileMulti.Msg>
  | ADT<'submit'>
  | ADT<'updateFixedBarBottom', number>;

export type Msg = ComponentMsg<InnerMsg, Page>;

type InitError
  = ADT<'notSignedIn', PublicRfi>
  | ADT<'notVendor', PublicRfi>
  | ADT<'notAcceptedTerms', [PublicRfi, PublicUser]>
  | ADT<'expiredRfi', PublicRfi>
  | ADT<'invalidRfi'>;

interface ValidState {
  rfi: PublicRfi;
  user: PublicUser;
  attachments: Immutable<FileMulti.State>;
}

export interface State {
  fixedBarBottom: number;
  loading: number;
  init: ValidOrInvalid<ValidState, InitError>;
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
      const rfiStatus = rfiToRfiStatus(rfi);
      if (rfiStatus === RfiStatus.Expired) {
        return {
          ...baseState,
          init: invalid({
            tag: 'expiredRfi' as 'expiredRfi',
            value: rfi
          })
        };
      }
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
        init: valid({
          rfi,
          user,
          attachments: immutable(await FileMulti.init({
            formFieldMulti: {
              idNamespace: 'rfi-categories',
              label: 'Attachments',
              labelClassName: 'h3 mb-4',
              required: false,
              fields: []
            }
          }))
        })
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
            case 'expiredRfi':
              dispatch(replaceUrl({
                tag: 'noticeRfiExpiredRfiResponse' as 'noticeRfiExpiredRfiResponse',
                value: { rfiId: error.value._id }
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
    case 'onChangeAttachments':
      if (state.init.tag === 'invalid') { return [state]; }
      state = updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'onChangeAttachments', value }),
        childStatePath: ['init', 'value', 'attachments'],
        childUpdate: FileMulti.update,
        childMsg: msg.value
      })[0];
      return [state];
    case 'submit':
      if (state.init.tag === 'invalid') { return [state]; }
      return [
        startLoading(state),
        async (state, dispatch) => {
          if (state.init.tag === 'invalid') { return state; }
          const { rfi, attachments } = state.init.value;
          const fail = (state: Immutable<State>, errors: string[][]) => {
            return stopLoading(state)
              .setIn(['init', 'value', 'attachments'], FileMulti.setErrors(attachments, errors));
          };
          const uploadedFiles = await uploadFiles(FileMulti.getValues(attachments));
          if (uploadedFiles.tag === 'invalid') { return fail(state, uploadedFiles.value); }
          const result = await api.createRfiResponse({
            rfiId: rfi._id,
            attachments: uploadedFiles.value
          });
          if (result.tag === 'invalid') { return fail(state, result.value.attachments || []); }
          dispatch(newUrl({
            tag: 'noticeRfiResponseSubmitted' as 'noticeRfiResponseSubmitted',
            value: {
              rfiId: rfi._id
            }
          }));
          return stopLoading(state);
        }
      ];
    case 'updateFixedBarBottom':
      return [state.set('fixedBarBottom', msg.value)];
    default:
      return [state];
  }
};

function atLeastOneAttachmentAdded(attachments: FileMulti.State): boolean {
  return !!attachments.formFieldMulti.fields.length;
}

function isValid(state: ValidState): boolean {
  return atLeastOneAttachmentAdded(state.attachments) && FileMulti.isValid(state.attachments);
}

interface AttachmentsProps {
  attachments: Immutable<FileMulti.State>;
  dispatch: Dispatch<Msg>;
}

const Attachments: View<AttachmentsProps> = ({ attachments, dispatch }) => {
  const dispatchAttachments: Dispatch<FileMulti.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'onChangeAttachments' as 'onChangeAttachments', value }));
  return (
    <Row>
      <Col xs='12' md='6'>
        <FileMulti.view
          state={attachments}
          dispatch={dispatchAttachments} />
      </Col>
    </Row>
  );
};

interface ButtonsProps {
  dispatch: Dispatch<Msg>;
  rfi: PublicRfi;
  isLoading: boolean;
  isValid: boolean;
  bottomBarIsFixed: boolean;
}

const Buttons: View<ButtonsProps> = ({ bottomBarIsFixed, isLoading, isValid, rfi, dispatch }) => {
  const isDisabled = isLoading || !isValid;
  const submit = () => !isDisabled && dispatch({ tag: 'submit', value: undefined });
  return (
    <FixedBar.View location={bottomBarIsFixed ? 'bottom' : undefined}>
      <LoadingButton color='primary' onClick={submit} loading={isLoading} disabled={isDisabled} className='text-nowrap'>
        Submit Response
      </LoadingButton>
      <Link page={viewRfiPage(rfi)} textColor='secondary' className='text-nowrap'>
        Cancel
      </Link>
    </FixedBar.View>
  );
};

export const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
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
  const validState = state.init.value;
  const { rfi, attachments } = validState;
  if (!rfi.latestVersion) { return null; }
  const version = rfi.latestVersion;
  const bottomBarIsFixed = state.fixedBarBottom === 0;
  return (
    <PageContainer.View marginFixedBar={bottomBarIsFixed} paddingTop fullWidth>
      <Container className='mb-5 flex-grow-1'>
        <Row className='mb-5'>
          <Col xs='12' className='d-flex flex-column'>
            <h1>Respond to RFI Number: {version.rfiNumber}</h1>
            <h2>{version.title}</h2>
            <p>
              Please submit your response to this Request for Information by following the instructions defined
              in its <a href={AppRouter.pageToUrl(viewRfiPage(rfi))}>description</a>.
            </p>
          </Col>
        </Row>
        <Attachments attachments={attachments} dispatch={dispatch} />
        {!atLeastOneAttachmentAdded(attachments)
          ? (<Row><Col xs='12'>Please add at least one attachment.</Col></Row>)
          : null}
      </Container>
      <Buttons
        dispatch={dispatch}
        rfi={rfi}
        isLoading={state.loading > 0}
        isValid={isValid(validState)}
        bottomBarIsFixed={bottomBarIsFixed} />
    </PageContainer.View>
  );
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
