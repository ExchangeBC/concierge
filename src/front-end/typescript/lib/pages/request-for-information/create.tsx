import { Page } from 'front-end/lib/app/types';
import * as FileMulti from 'front-end/lib/components/input/file-multi';
import { Component, ComponentMsg, ComponentView, Dispatch, Immutable, immutable, Init, mapComponentDispatch, Update, updateComponentChild } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import * as RfiForm from 'front-end/lib/pages/request-for-information/components/form';
import * as FixedBar from 'front-end/lib/views/fixed-bar';
import * as PageContainer from 'front-end/lib/views/layout/page-container';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import { noop } from 'lodash';
import { default as React } from 'react';
import { Col, Container, Row } from 'reactstrap';
import * as RfiResource from 'shared/lib/resources/request-for-information';
import { ADT } from 'shared/lib/types';
import { ArrayValidation, invalid, valid, validateArrayAsync, ValidOrInvalid } from 'shared/lib/validators';

export interface Params {
  fixedBarBottom?: number;
}

export type InnerMsg
  = ADT<'rfiForm', RfiForm.Msg>
  | ADT<'publish'>
  | ADT<'updateFixedBarBottom', number>;

export type Msg = ComponentMsg<InnerMsg, Page>;

export interface State {
  loading: number;
  fixedBarBottom: number;
  rfiForm: Immutable<RfiForm.State>
};

export const init: Init<Params, State> = async ({ fixedBarBottom = 0 }) => {
  return {
    loading: 0,
    fixedBarBottom,
    rfiForm: immutable(await RfiForm.init({
      isEditing: true
    }))
  };
};

function startLoading(state: Immutable<State>): Immutable<State> {
  return state.set('loading', state.loading + 1);
}

function stopLoading(state: Immutable<State>): Immutable<State> {
  return state.set('loading', Math.max(state.loading - 1, 0));
}

/**
 * Uploads a set of files to the back-end and returns
 * a promise of their `_id`s.
 */

async function uploadFiles(files: FileMulti.Value[]): Promise<ArrayValidation<string[]>> {
  return validateArrayAsync(files, async file => {
    const result = await api.createFile(file);
    switch (result.tag) {
      case 'valid':
        return valid(result.value._id);
      case 'invalid':
        return result;
    }
  });
}

async function getRequestBody(state: State): Promise<ValidOrInvalid<api.CreateRfiRequestBody, RfiResource.CreateValidationErrors>> {
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
        closingAt: values.closingAt,
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
  switch (msg.tag) {
    case 'rfiForm':
      state = updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'rfiForm', value }),
        childStatePath: ['rfiForm'],
        childUpdate: RfiForm.update,
        childMsg: msg.value
      })[0];
      return [state];
    case 'publish':
      state = startLoading(state);
      return [
        state,
        async dispatch => {
          const requestBody = await getRequestBody(state);
          switch (requestBody.tag) {
            case 'valid':
              const result = await api.createRfi(requestBody.value);
              switch (result.tag) {
                case 'valid':
                  dispatch({
                    tag: '@newUrl',
                    value: {
                      tag: 'requestForInformationList',
                      value: null
                    }
                  });
                  return state;
                case 'invalid':
                  // TODO persist errors.
                  return stopLoading(state);
              }
            case 'invalid':
              // TODO persist errors.
              return stopLoading(state);
          }
        }
      ];
    case 'updateFixedBarBottom':
      return [state.set('fixedBarBottom', msg.value)];
    default:
      return [state];
  }
};

export const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const dispatchRfiForm: Dispatch<RfiForm.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'rfiForm' as 'rfiForm', value }));
  const bottomBarIsFixed = state.fixedBarBottom === 0;
  const cancelPage: Page = { tag: 'requestForInformationList', value: null };
  const publish = () => dispatch({ tag: 'publish', value: undefined });
  const isLoading = state.loading > 0;
  const isDisabled = isLoading || !RfiForm.isValid(state.rfiForm);
  return (
    <PageContainer.View marginFixedBar={bottomBarIsFixed} paddingTop fullWidth>
      <Container className='mb-5 flex-grow-1'>
        <Row>
          <Col xs='12' md='10'>
            <h1>Create a Request for Information (RFI)</h1>
          </Col>
        </Row>
        <Row className='mb-4'>
          <Col xs='12' md='10'>
            <p>Use this form to create a Request for Information (RFI) for a program or business area. Please ensure that all information is complete and accurate before publishing.</p>
          </Col>
        </Row>
        <RfiForm.view state={state.rfiForm} dispatch={dispatchRfiForm} />
      </Container>
      <FixedBar.View location={bottomBarIsFixed ? 'bottom' : undefined}>
        <LoadingButton color={isDisabled ? 'secondary' : 'primary'} onClick={publish} loading={isLoading} disabled={isDisabled}>
          Publish
        </LoadingButton>
        <LoadingButton color='secondary'  onClick={noop} loading={isLoading} disabled={isDisabled} className='mx-3'>
          Preview
        </LoadingButton>
        <Link page={cancelPage} text='Cancel' textColor='secondary' disabled={isLoading} buttonClassName='px-0' />
      </FixedBar.View>
    </PageContainer.View>
  );
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
