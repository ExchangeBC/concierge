import { Route } from 'front-end/lib/app/types';
import { Component, ComponentView, GlobalComponentMsg, Immutable } from 'front-end/lib/framework';
import React from 'react';
import { Col, Row } from 'reactstrap';
import { ADT } from 'shared/lib/types';

export type MsgOrRoute<Msg, Route> = ADT<'msg', Msg> | ADT<'route', Route>;

export type IsValid<State> = (state: Immutable<State>) => boolean;

export type IsLoading<State> = (state: Immutable<State>) => boolean;

export type StepMsg<InnerMsg> = GlobalComponentMsg<InnerMsg, Route>;

export interface StepComponent<Params, State, Msg> extends Component<Params, State, StepMsg<Msg>> {
  isValid: IsValid<State>;
  isLoading: IsLoading<State>;
  actionLabels: {
    next: string;
    back?: string;
    cancel: string;
  };
}

export interface MakeViewParams<State, Msg> {
  title: string;
  stepIndicator: string;
  view: ComponentView<State, StepMsg<Msg>>;
}

export function makeView<Params, State, Msg>(params: MakeViewParams<State, Msg>): ComponentView<State, StepMsg<Msg>> {
  return (props) => {
    return (
      <div>
        <Row>
          <Col xs="12" className="mb-4">
            <div className="small text-secondary font-weight-bold text-uppercase">{params.stepIndicator}</div>
            <h1>{params.title}</h1>
          </Col>
        </Row>
        <params.view {...props} />
      </div>
    );
  };
}
