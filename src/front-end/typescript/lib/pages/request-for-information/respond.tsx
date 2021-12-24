import { makePageMetadata, makeStartLoading, makeStopLoading, UpdateState } from 'front-end/lib';
import router from 'front-end/lib/app/router';
import { Route, SharedState } from 'front-end/lib/app/types';
import * as FileMulti from 'front-end/lib/components/form-field-multi/file';
import { ComponentView, Dispatch, emptyPageAlerts, GlobalComponentMsg, Immutable, immutable, mapComponentDispatch, newRoute, PageComponent, PageInit, replaceRoute, Update, updateComponentChild, View } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import { WarningId } from 'front-end/lib/pages/terms-and-conditions';
import FixedBar from 'front-end/lib/views/layout/fixed-bar';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import { default as React } from 'react';
import { Col, Row } from 'reactstrap';
import { PublicRfi, rfiToRfiStatus } from 'shared/lib/resources/request-for-information';
import { PublicUser } from 'shared/lib/resources/user';
import { ADT, Omit, RfiStatus, UserType } from 'shared/lib/types';
import { invalid, valid, ValidOrInvalid } from 'shared/lib/validators';

export interface RouteParams {
  rfiId: string;
}

export type InnerMsg = ADT<'handlePageInitError'> | ADT<'onChangeAttachments', FileMulti.Msg> | ADT<'hideSubmitConfirmationPrompt'> | ADT<'submit'>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

type PageInitError = ADT<'notSignedIn', PublicRfi> | ADT<'notVendor', PublicRfi> | ADT<'notAcceptedTerms', PublicRfi> | ADT<'expiredRfi', PublicRfi> | ADT<'invalidRfi'>;

interface ValidState {
  rfi: PublicRfi;
  user: PublicUser;
  attachments: Immutable<FileMulti.State>;
}

export interface State {
  loading: number;
  promptSubmitConfirmation: boolean;
  init: ValidOrInvalid<ValidState, PageInitError>;
  handledPageInitError: boolean;
}

const init: PageInit<RouteParams, SharedState, State, Msg> = async ({ routeParams }) => {
  const { rfiId } = routeParams;
  const rfiResult = await api.readOneRfi(rfiId);
  const baseState: Omit<State, 'init'> = {
    loading: 0,
    handledPageInitError: false,
    promptSubmitConfirmation: false
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
            tag: 'expiredRfi' as const,
            value: rfi
          })
        };
      }
      const sessionResult = await api.getSession();
      if (sessionResult.tag === 'invalid' || !sessionResult.value.user) {
        return {
          ...baseState,
          init: invalid({
            tag: 'notSignedIn' as const,
            value: rfi
          })
        };
      }
      const userResult = await api.readOneUser(sessionResult.value.user.id);
      if (userResult.tag === 'invalid' || userResult.value.profile.type !== UserType.Vendor) {
        return {
          ...baseState,
          init: invalid({
            tag: 'notVendor' as const,
            value: rfi
          })
        };
      }
      const user = userResult.value;
      if (!userResult.value.acceptedTermsAt) {
        return {
          ...baseState,
          init: invalid({
            tag: 'notAcceptedTerms' as const,
            value: rfi
          })
        };
      }
      return {
        ...baseState,
        init: valid({
          rfi,
          user,
          attachments: immutable(
            await FileMulti.init({
              formFieldMulti: {
                idNamespace: 'rfi-categories',
                label: 'Attachments',
                required: false,
                fields: []
              }
            })
          )
        })
      };
    case 'invalid':
      return {
        ...baseState,
        init: invalid({
          tag: 'invalidRfi' as const,
          value: undefined
        })
      };
  }
};

const startLoading: UpdateState<State> = makeStartLoading('loading');
const stopLoading: UpdateState<State> = makeStopLoading('loading');

const respondToRfiRoute = (rfi: PublicRfi): Route => ({
  tag: 'requestForInformationRespond',
  value: {
    rfiId: rfi._id
  }
});

const respondToRfiUrl = (rfi: PublicRfi): string => router.routeToUrl(respondToRfiRoute(rfi));

const viewRfiRoute = (rfi: PublicRfi): Route => ({
  tag: 'requestForInformationView',
  value: {
    rfiId: rfi._id
  }
});

const viewRfiUrl = (rfi: PublicRfi): string => router.routeToUrl(viewRfiRoute(rfi));

const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'handlePageInitError':
      // TODO move to init function now that it has the
      // dispatch function param
      return [
        state.set('handledPageInitError', true),
        async (state, dispatch) => {
          if (state.init.tag === 'valid') {
            return null;
          }
          // Handle cases where the user should not be able to respond to this RFI.
          const error = state.init.value;
          switch (error.tag) {
            case 'notSignedIn':
              dispatch(
                replaceRoute({
                  tag: 'signIn' as const,
                  value: {
                    redirectOnSuccess: respondToRfiUrl(error.value)
                  }
                })
              );
              return null;
            case 'notVendor':
              dispatch(
                replaceRoute({
                  tag: 'notice' as const,
                  value: {
                    noticeId: {
                      tag: 'rfiNonVendorResponse' as const,
                      value: error.value._id
                    }
                  }
                })
              );
              return null;
            case 'notAcceptedTerms':
              const rfi = error.value;
              dispatch(
                replaceRoute({
                  tag: 'termsAndConditions' as const,
                  value: {
                    warningId: WarningId.RfiResponse,
                    redirectOnAccept: respondToRfiUrl(rfi),
                    redirectOnSkip: viewRfiUrl(rfi)
                  }
                })
              );
              return null;
            case 'expiredRfi':
              dispatch(
                replaceRoute({
                  tag: 'notice' as const,
                  value: {
                    noticeId: {
                      tag: 'rfiExpiredResponse' as const,
                      value: error.value._id
                    }
                  }
                })
              );
              return null;
            case 'invalidRfi':
              dispatch(
                replaceRoute({
                  tag: 'notice' as const,
                  value: {
                    noticeId: {
                      tag: 'notFound' as const,
                      value: undefined
                    }
                  }
                })
              );
              return null;
          }
        }
      ];
    case 'onChangeAttachments':
      if (state.init.tag === 'invalid') {
        return [state];
      }
      state = updateComponentChild({
        state,
        mapChildMsg: (value) => ({ tag: 'onChangeAttachments', value }),
        childStatePath: ['init', 'value', 'attachments'],
        childUpdate: FileMulti.update,
        childMsg: msg.value
      })[0];
      return [state];
    case 'hideSubmitConfirmationPrompt':
      return [state.set('promptSubmitConfirmation', false)];
    case 'submit':
      if (state.init.tag === 'invalid') {
        return [state];
      }
      if (!state.promptSubmitConfirmation) {
        return [state.set('promptSubmitConfirmation', true)];
      } else {
        state = state.set('promptSubmitConfirmation', false);
      }
      return [
        startLoading(state),
        async (state, dispatch) => {
          if (state.init.tag === 'invalid') {
            return null;
          }
          const { rfi, attachments } = state.init.value;
          const fail = (state: Immutable<State>, errors: string[][]) => {
            return stopLoading(state).setIn(['init', 'value', 'attachments'], FileMulti.setErrors(attachments, errors));
          };
          const uploadedFiles = await api.uploadFiles(FileMulti.getValues(attachments), {
            tag: 'userType',
            value: [UserType.ProgramStaff, UserType.Buyer]
          });
          if (uploadedFiles.tag === 'invalid') {
            return fail(state, uploadedFiles.value);
          }
          const result = await api.createRfiResponse({
            rfiId: rfi._id,
            attachments: uploadedFiles.value
          });
          if (result.tag === 'invalid') {
            return fail(state, result.value.attachments || []);
          }
          dispatch(
            newRoute({
              tag: 'notice' as const,
              value: {
                noticeId: {
                  tag: 'rfiResponseSubmitted' as const,
                  value: rfi._id
                }
              }
            })
          );
          return null;
        }
      ];
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
  const dispatchAttachments: Dispatch<FileMulti.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, (value) => ({ tag: 'onChangeAttachments' as const, value }));
  return (
    <Row>
      <Col xs="12" md="6">
        <FileMulti.view state={attachments} dispatch={dispatchAttachments} labelClassName="h3" labelWrapperClassName="mb-4" />
      </Col>
    </Row>
  );
};

const viewBottomBar: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (state.init.tag === 'invalid') {
    return null;
  }
  const validState = state.init.value;
  const { rfi } = validState;
  const isLoading = state.loading > 0;
  const isDisabled = isLoading || !isValid(validState);
  const submit = () => !isDisabled && dispatch({ tag: 'submit', value: undefined });
  return (
    <FixedBar>
      <LoadingButton color="primary" onClick={submit} loading={isLoading} disabled={isDisabled} className="text-nowrap">
        Submit Response
      </LoadingButton>
      <Link route={viewRfiRoute(rfi)} color="secondary" className="text-nowrap mx-3">
        Cancel
      </Link>
    </FixedBar>
  );
};

const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  // Handle cases where the user should not be able to respond to this RFI.
  if (state.init.tag === 'invalid') {
    if (!state.handledPageInitError) {
      dispatch({ tag: 'handlePageInitError', value: undefined });
    }
    return null;
  }
  // If the user is in the correct state, render the response form.
  const validState = state.init.value;
  const { rfi, attachments } = validState;
  const version = rfi.latestVersion;
  return (
    <div>
      <Row className="mb-5">
        <Col xs="12" className="d-flex flex-column">
          <h1>Respond to RFI Number: {version.rfiNumber}</h1>
          <h3>{version.title}</h3>
          <p className="mt-2">
            Please submit your response to this Request for Information by following the instructions defined under the "Responses" heading in its <a href={router.routeToUrl(viewRfiRoute(rfi))}>description</a>. In addition to the required documents, you can also include an (optional) cover letter summarising your response and describing the attachments you will be uploading.
          </p>
          <p>While you will not be able to edit your response after you have submitted it, you can return to this page to upload additional attachments as needed before the RFI closes.</p>
        </Col>
      </Row>
      <Attachments attachments={attachments} dispatch={dispatch} />
      {!atLeastOneAttachmentAdded(attachments) ? (
        <Row>
          <Col xs="12">Please add at least one attachment.</Col>
        </Row>
      ) : null}
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
    return makePageMetadata(`Respond — ${state.init.tag === 'valid' ? state.init.value.rfi.latestVersion.rfiNumber : 'RFI'}`);
  },
  getBreadcrumbs(state) {
    if (state.init.tag === 'invalid') {
      return [];
    }
    return [
      {
        text: 'RFIs',
        onClickMsg: newRoute({
          tag: 'requestForInformationList',
          value: null
        })
      },
      {
        text: state.init.value.rfi.latestVersion.rfiNumber,
        onClickMsg: newRoute({
          tag: 'requestForInformationView',
          value: {
            rfiId: state.init.value.rfi._id
          }
        })
      },
      {
        text: 'Respond to RFI'
      }
    ];
  },
  getModal(state) {
    if (!state.promptSubmitConfirmation) {
      return null;
    }
    return {
      title: 'Submit Response to RFI?',
      body: 'You will not be able to edit your response once it has been submitted. However, you can return to this page to upload additional attachments as needed before the RFI closes.',
      onCloseMsg: { tag: 'hideSubmitConfirmationPrompt', value: undefined },
      actions: [
        {
          text: 'Submit Response',
          color: 'primary',
          button: true,
          msg: { tag: 'submit', value: undefined }
        },
        {
          text: 'Cancel',
          color: 'secondary',
          msg: { tag: 'hideSubmitConfirmationPrompt', value: undefined }
        }
      ]
    };
  }
};
