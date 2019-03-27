import { makeStartLoading, makeStopLoading, UpdateState } from 'front-end/lib';
import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentView, Dispatch, Immutable, immutable, Init, mapComponentDispatch, Update, updateComponentChild } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import * as RfiForm from 'front-end/lib/pages/request-for-information/components/form';
import { makeRequestBody, publishedDateToString, updatedDateToString } from 'front-end/lib/pages/request-for-information/lib';
import StatusBadge from 'front-end/lib/pages/request-for-information/views/status-badge';
import * as FixedBar from 'front-end/lib/views/fixed-bar';
import * as PageContainer from 'front-end/lib/views/layout/page-container';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import { default as React } from 'react';
import { Alert, Button, Col, Container, Row } from 'reactstrap';
import { getString } from 'shared/lib';
import * as RfiResource from 'shared/lib/resources/request-for-information';
import { ADT } from 'shared/lib/types';

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

/*const startPreviewLoading: UpdateState<State> = makeStartLoading('previewLoading');
const stopPreviewLoading: UpdateState<State>  = makeStopLoading('previewLoading');*/
const startPublishLoading: UpdateState<State> = makeStartLoading('publishLoading');
const stopPublishLoading: UpdateState<State>  = makeStopLoading('publishLoading');

function setIsEditing(state: Immutable<State>, value: boolean): Immutable<State> {
  if (!state.valid) { return state; }
  return state.setIn(['valid', 'rfiForm', 'isEditing'], value);
}

function getIsEditing(state: Immutable<State>): boolean {
  if (!state.valid) { return false; }
  return state.getIn(['valid', 'rfiForm', 'isEditing']);
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
        async (state, dispatch) => {
          const fail = (state: Immutable<State>, errors: RfiResource.UpdateValidationErrors) => {
            state = stopPublishLoading(state);
            state = setIsEditing(state, false);
            return state.setIn(['valid', 'rfiForm'], RfiForm.setErrors(valid.rfiForm, errors));
          };
          const requestBody = await makeRequestBody(valid.rfiForm);
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
  const viewPage: Page = { tag: 'requestForInformationView', value: { rfiId: getString(state.valid, ['rfi', '_id']) }};
  const isEditing = getIsEditing(state);
  const isPreviewLoading = state.previewLoading > 0;
  const isPublishLoading = state.publishLoading > 0;
  const isLoading = isPreviewLoading || isPublishLoading;
  const isDisabled = isLoading || !RfiForm.isValid(state.valid.rfiForm);
  if (isEditing) {
    return (
      <FixedBar.View location={bottomBarIsFixed ? 'bottom' : undefined}>
        <LoadingButton color='primary' onClick={publish} loading={isPublishLoading} disabled={isDisabled} className='text-nowrap'>
          Publish Changes
        </LoadingButton>
        <LoadingButton color='info' onClick={preview} loading={isPreviewLoading} disabled={isDisabled} className='mx-3 text-nowrap'>
          Preview Changes
        </LoadingButton>
        <Link onClick={cancelEditing} text='Cancel' textColor='secondary' disabled={isLoading} buttonClassName='px-0' />
      </FixedBar.View>
    );
  } else {
    return (
      <FixedBar.View location={bottomBarIsFixed ? 'bottom' : undefined}>
        <Button color='primary' onClick={startEditing} disabled={isLoading} className='text-nowrap'>
          Edit RFI
        </Button>
        <Link page={viewPage} text='View RFI' buttonColor='info' disabled={isLoading} className='ml-3 ml-md-0 mr-md-3 text-nowrap' />
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
  return (
    <PageContainer.View marginFixedBar={bottomBarIsFixed} paddingTop fullWidth>
      <Container className='mb-5 flex-grow-1'>
        <Row>
          <Col xs='12' md='10'>
            <h1 className='d-flex flex-column-reverse flex-md-row align-items-start align-items-md-center flex-wrap'>
              RFI Number: {version.rfiNumber}
              <StatusBadge
                rfi={rfi}
                className='d-block d-md-inline mb-2 mb-md-0 ml-md-3'
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
              <span className='d-block d-md-inline'>
                {publishedDateToString(rfi.createdAt)}
              </span>
              <span className='px-3 d-none d-md-inline'>|</span>
              <span className='d-block d-md-inline'>
                {updatedDateToString(version.createdAt)}
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
