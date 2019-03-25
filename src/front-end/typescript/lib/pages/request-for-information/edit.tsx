import { Page } from 'front-end/lib/app/types';
import * as FileMulti from 'front-end/lib/components/input/file-multi';
import { Component, ComponentMsg, ComponentView, Dispatch, Immutable, immutable, Init, mapComponentDispatch, Update, updateComponentChild } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import * as RfiForm from 'front-end/lib/pages/request-for-information/components/form';
import * as RfiStatus from 'front-end/lib/pages/request-for-information/views/status';
import * as FixedBar from 'front-end/lib/views/fixed-bar';
import * as PageContainer from 'front-end/lib/views/layout/page-container';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import { default as React } from 'react';
import { Alert, Button, Col, Container, Row } from 'reactstrap';
import { formatDateAndTime } from 'shared/lib';
import * as RfiResource from 'shared/lib/resources/request-for-information';
import { ADT } from 'shared/lib/types';
import { ArrayValidation, invalid, valid, validateArrayAsync, ValidOrInvalid } from 'shared/lib/validators';

const ERROR_MESSAGE = 'The Request for Information you are looking for is not available.';

export interface Params {
  rfiId: string;
  fixedBarBottom?: number;
}

export type InnerMsg
  = ADT<'rfiForm', RfiForm.Msg>
  | ADT<'startEditing'>
  | ADT<'cancelEditing'>
  | ADT<'preview'>
  | ADT<'publish'>
  | ADT<'updateFixedBarBottom', number>;

export type Msg = ComponentMsg<InnerMsg, Page>;

export interface ValidState {
  rfi: RfiResource.PublicRfi;
  rfiForm: Immutable<RfiForm.State>;
};

export interface State {
  fixedBarBottom: number;
  previewLoading: number;
  publishLoading: number;
  valid?: ValidState;
};

async function resetRfiForm(existingRfi: RfiResource.PublicRfi): Promise<Immutable<RfiForm.State>> {
  return immutable(await RfiForm.init({
    isEditing: false,
    existingRfi
  }));
}

export const init: Init<Params, State> = async ({ rfiId, fixedBarBottom = 0 }) => {
  const result = await api.readOneRfi(rfiId);
  switch (result.tag) {
    case 'valid':
      return {
        fixedBarBottom,
        previewLoading: 0,
        publishLoading: 0,
        valid: {
          rfi: result.value,
          rfiForm: await resetRfiForm(result.value)
        }
      };
    case 'invalid':
      return {
        fixedBarBottom,
        previewLoading: 0,
        publishLoading: 0
      };
  }
};

/*function startPreviewLoading(state: Immutable<State>): Immutable<State> {
  return state.set('previewLoading', state.previewLoading + 1);
}

function stopPreviewLoading(state: Immutable<State>): Immutable<State> {
  return state.set('previewLoading', state.previewLoading - 1);
}*/

function startPublishLoading(state: Immutable<State>): Immutable<State> {
  return state.set('publishLoading', state.publishLoading + 1);
}

function stopPublishLoading(state: Immutable<State>): Immutable<State> {
  return state.set('publishLoading', state.publishLoading - 1);
}

function setIsEditing(state: Immutable<State>, value: boolean): Immutable<State> {
  if (!state.valid) { return state; }
  return state.setIn(['valid', 'rfiForm', 'isEditing'], value);
}

function getIsEditing(state: Immutable<State>): boolean {
  if (!state.valid) { return false; }
  return state.getIn(['valid', 'rfiForm', 'isEditing']);
}

/**
 * Uploads a set of files to the back-end and returns
 * a promise of their `_id`s.
 */

async function uploadFiles(files: FileMulti.Value[]): Promise<ArrayValidation<string[]>> {
  return validateArrayAsync(files, async file => {
    switch (file.tag) {
      case 'existing':
        return valid(file.value._id);
      case 'new':
        const result = await api.createFile(file.value);
        return result.tag === 'valid' ? valid(result.value._id) : result;
    }
  });
}

async function getRequestBody(state: ValidState): Promise<ValidOrInvalid<api.CreateRfiRequestBody, RfiResource.CreateValidationErrors>> {
  const values = RfiForm.getValues(state.rfiForm);
  const uploadedFiles = await uploadFiles(values.attachments);
  switch (uploadedFiles.tag) {
    case 'valid':
      return valid({
        rfiNumber: values.rfiNumber,
        title: values.title,
        publicSectorEntity: values.publicSectorEntity,
        description: values.description,
        discoveryDay: values.discoveryDay,
        closingDate: values.closingDate,
        closingTime: values.closingTime,
        buyerContact: values.buyerContact,
        programStaffContact: values.programStaffContact,
        categories: values.categories,
        attachments: uploadedFiles.value,
        addenda: values.addenda
      });
    case 'invalid':
      return invalid({
        attachments: uploadedFiles.value
      });
  }
}

export const update: Update<State, Msg> = (state, msg) => {
  if (!state.valid) { return [state]; }
  const valid = state.valid;
  switch (msg.tag) {
    case 'rfiForm':
      state = updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'rfiForm', value }),
        childStatePath: ['valid', 'rfiForm'],
        childUpdate: RfiForm.update,
        childMsg: msg.value
      })[0];
      return [state];
    case 'startEditing':
      return [setIsEditing(state, true)];
    case 'cancelEditing':
      return [
        setIsEditing(state, false),
        async () => {
          if (!state.valid) { return state; }
          return state.setIn(['valid', 'rfiForm'], await resetRfiForm(state.valid.rfi));
        }
      ];
    case 'preview':
      return [state];
    case 'publish':
      state = startPublishLoading(state);
      return [
        state,
        async dispatch => {
          const fail = (state: Immutable<State>, errors: RfiResource.UpdateValidationErrors) => {
            state = stopPublishLoading(state);
            state = setIsEditing(state, false);
            return state.setIn(['valid', 'rfiForm'], RfiForm.setErrors(valid.rfiForm, errors));
          };
          const requestBody = await getRequestBody(valid);
          switch (requestBody.tag) {
            case 'valid':
              const result = await api.updateRfi(valid.rfi._id, requestBody.value);
              switch (result.tag) {
                case 'valid':
                  state = stopPublishLoading(state)
                    .setIn(['valid', 'rfi'], result.value)
                    .setIn(['valid', 'rfiForm'], await resetRfiForm(result.value));
                  break;
                case 'invalid':
                  state = fail(state, result.value);
                  break;
              }
              break;
            case 'invalid':
              state = fail(state, requestBody.value);
              break;
          }
          return state;
        }
      ];
    case 'updateFixedBarBottom':
      return [state.set('fixedBarBottom', msg.value)];
    default:
      return [state];
  }
};

export const Buttons: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (!state.valid) { return null; }
  const bottomBarIsFixed = state.fixedBarBottom === 0;
  const publish = () => dispatch({ tag: 'publish', value: undefined });
  const preview = () => dispatch({ tag: 'preview', value: undefined });
  const startEditing = () => dispatch({ tag: 'startEditing', value: undefined });
  const cancelEditing = () => dispatch({ tag: 'cancelEditing', value: undefined });
  const isEditing = getIsEditing(state);
  const isPreviewLoading = state.previewLoading > 0;
  const isPublishLoading = state.publishLoading > 0;
  const isLoading = isPreviewLoading || isPublishLoading;
  const isDisabled = isLoading || !RfiForm.isValid(state.valid.rfiForm);
  if (isEditing) {
    return (
      <FixedBar.View location={bottomBarIsFixed ? 'bottom' : undefined}>
        <LoadingButton color={isDisabled ? 'secondary' : 'primary'} onClick={publish} loading={isPublishLoading} disabled={isDisabled}>
          Publish Changes
        </LoadingButton>
        <LoadingButton color='secondary' onClick={preview} loading={isPreviewLoading} disabled={isDisabled} className='mx-3'>
          Preview
        </LoadingButton>
        <Link onClick={cancelEditing} text='Cancel' textColor='secondary' disabled={isLoading} buttonClassName='px-0' />
      </FixedBar.View>
    );
  } else {
    return (
      <FixedBar.View location={bottomBarIsFixed ? 'bottom' : undefined}>
        <Button color={isLoading ? 'secondary' : 'primary'} onClick={startEditing} disabled={isLoading}>
          Edit RFI
        </Button>
        <LoadingButton color='secondary' onClick={preview} loading={isPreviewLoading} disabled={isDisabled} className='mx-3'>
          Preview
        </LoadingButton>
      </FixedBar.View>
    );
  }
};

export const view: ComponentView<State, Msg> = props => {
  const { state, dispatch } = props;
  if (!state.valid || !state.valid.rfi.latestVersion) {
    return (
      <PageContainer.View paddingY>
        <Row>
          <Col xs='12'>
            <Alert color='danger'>
              <div>
                {ERROR_MESSAGE}
              </div>
            </Alert>
          </Col>
        </Row>
      </PageContainer.View>
    );
  }
  const dispatchRfiForm: Dispatch<RfiForm.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'rfiForm' as 'rfiForm', value }));
  const bottomBarIsFixed = state.fixedBarBottom === 0;
  const rfi = state.valid.rfi;
  const version = state.valid.rfi.latestVersion;
  const publishedDateString = formatDateAndTime(rfi.publishedAt);
  const updatedDateString = formatDateAndTime(version.createdAt);
  return (
    <PageContainer.View marginFixedBar={bottomBarIsFixed} paddingTop fullWidth>
      <Container className='mb-5 flex-grow-1'>
        <Row>
          <Col xs='12' md='10'>
            <h1 className='d-flex align-items-center flex-wrap'>
              RFI Number: {version.rfiNumber}
              <RfiStatus.Badge
                status={RfiStatus.rfiToStatus(rfi)}
                className='ml-3 text-uppercase'
                style={{ fontSize: '1.4rem' }} />
            </h1>
          </Col>
        </Row>
        <Row>
          <Col xs='12' md='10'>
            <h2>{version.title}</h2>
          </Col>
        </Row>
        <Row className='mb-4'>
          <Col xs='12'>
            <p className='text-secondary small'>
              <span className='d-block d-md-inline mb-3 mb-md-0'>
                Published: {publishedDateString}
              </span>
              <span className='px-3 d-none d-md-inline'>|</span>
              <span className='d-block d-md-inline'>
                Last Updated: {updatedDateString}
              </span>
            </p>
          </Col>
        </Row>
        <RfiForm.view state={state.valid.rfiForm} dispatch={dispatchRfiForm} />
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
