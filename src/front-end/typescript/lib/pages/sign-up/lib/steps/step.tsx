import { Route } from 'front-end/lib/app/types';
import { Component, ComponentView, GlobalComponentMsg, Immutable } from 'front-end/lib/framework';
import FixedBar from 'front-end/lib/views/layout/fixed-bar';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import React from 'react';
import { Col, Row } from 'reactstrap'
import { ADT } from 'shared/lib/types';

export type MsgOrRoute<Msg, Route>
  = ADT<'msg', Msg>
  | ADT<'route', Route>;

export type IsValid<State> = (state: Immutable<State>) => boolean;

export type IsLoading<State> = (state: Immutable<State>) => boolean;

export type StepActionMsg
  = ADT<'$next'>
  | ADT<'$back'>
  | ADT<'$cancel'>
  | ADT<'$fail'>;

export type StepMsg<InnerMsg>
  = GlobalComponentMsg<InnerMsg | StepActionMsg, Route>

export interface StepComponent<Params, State, Msg> extends Component<Params, State, StepMsg<Msg>> {
  viewBottomBar: ComponentView<State, StepMsg<Msg>>;
  isValid: IsValid<State>;
  isLoading: IsLoading<State>;
}

export interface MakeViewParams<State, Msg> {
  title: string;
  stepIndicator: string;
  view: ComponentView<State, StepMsg<Msg>>
}

export function makeView<Params, State, Msg>(params: MakeViewParams<State, Msg>): ComponentView<State, StepMsg<Msg>> {
  return props => {
    return (
      <div>
        <Row>
          <Col xs='12' className='mb-4'>
            <div className='small text-secondary font-weight-bold text-uppercase'>{params.stepIndicator}</div>
            <h1>{params.title}</h1>
          </Col>
        </Row>
        <params.view {...props} />
      </div>
    );
  };
}

export interface MakeViewBottomBarParams<State, Msg> {
  isValid: IsValid<State>;
  isLoading: IsLoading<State>;
  actionLabels: {
    next: string;
    back?: string;
    cancel: string;
  };
}

export function makeViewBottomBar<State, Msg>(params: MakeViewBottomBarParams<State, Msg>): ComponentView<State, StepMsg<Msg>> {
  return ({ state, dispatch }) => {
    const isValid = params.isValid(state);
    const isLoading = params.isLoading(state);
    const isDisabled = !isValid || isLoading;
    const nextOnClick = () => !isDisabled && dispatch({ tag: '$next', value: undefined });
    const backOnClick = () => dispatch({ tag: '$back', value: undefined });
    const cancelOnClick = () => dispatch({ tag: '$cancel', value: undefined });
    const { next, back, cancel } = params.actionLabels;
    // TODO better spacing between links.
    return (
      <FixedBar>
        <LoadingButton color='primary' onClick={nextOnClick} loading={isLoading} disabled={isDisabled} className='text-nowrap'>
          {next}
        </LoadingButton>
        <Link onClick={cancelOnClick} color='secondary' disabled={isLoading} className='mx-3'>{cancel}</Link>
        {back
          ? (<Link onClick={backOnClick} color='secondary' disabled={isLoading} className='mr-md-auto'>{back}</Link>)
          : null}
      </FixedBar>
    );
  };
}
