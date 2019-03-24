import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentView, Dispatch, Immutable, immutable, Init, mapComponentDispatch, Update, updateComponentChild } from 'front-end/lib/framework';
import * as RfiForm from 'front-end/lib/pages/request-for-information/components/form';
import * as FixedBar from 'front-end/lib/views/fixed-bar';
import * as PageContainer from 'front-end/lib/views/layout/page-container';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import { noop } from 'lodash';
import { default as React } from 'react';
import { Col, Container, Row } from 'reactstrap';
import { ADT } from 'shared/lib/types';

export interface Params {
  fixedBarBottom?: number;
}

export type InnerMsg
  = ADT<'rfiForm', RfiForm.Msg>
  | ADT<'updateFixedBarBottom', number>;

export type Msg = ComponentMsg<InnerMsg, Page>;

export interface State {
  fixedBarBottom: number;
  rfiForm: Immutable<RfiForm.State>
};

export const init: Init<Params, State> = async ({ fixedBarBottom = 0 }) => {
  return {
    fixedBarBottom,
    rfiForm: immutable(await RfiForm.init({
      isEditing: true
    }))
  };
};

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
  const isLoading = false;
  const isDisabled = true;
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
        <LoadingButton color={isDisabled ? 'secondary' : 'primary'} onClick={noop} loading={isLoading} disabled={isDisabled}>
          Publish RFI
        </LoadingButton>
        <LoadingButton color='secondary'  onClick={noop} loading={isLoading} disabled={isDisabled} className='mx-3'>
          Preview RFI
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
