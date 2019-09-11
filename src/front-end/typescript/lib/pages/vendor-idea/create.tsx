import { makePageMetadata } from 'front-end/lib';
import { Route, SharedState } from 'front-end/lib/app/types';
import { ComponentView, Dispatch, emptyPageAlerts, emptyPageBreadcrumbs, GlobalComponentMsg, immutable, Immutable, mapComponentDispatch, noPageModal, PageComponent, PageInit, Update, updateComponentChild } from 'front-end/lib/framework';
import * as IntakeForm from 'front-end/lib/pages/vendor-idea/components/intake-form';
import React from 'react';
import { ADT } from 'shared/lib/types';

export type RouteParams = null;

type InnerMsg
  = ADT<'intakeForm', IntakeForm.Msg>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

export interface State {
  intakeForm: Immutable<IntakeForm.State>;
};

const init: PageInit<RouteParams, SharedState, State, Msg> = async ({ routeParams, shared }) => {
  return { intakeForm: immutable(await IntakeForm.init({ isEditing: true })) };
};

const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'intakeForm':
      return updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'intakeForm', value }),
        childStatePath: ['intakeForm'],
        childUpdate: IntakeForm.update,
        childMsg: msg.value
      });
    default:
      return [state];
  }
};

const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const dispatchIntakeForm: Dispatch<IntakeForm.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'intakeForm' as const, value }));
  return (<IntakeForm.view state={state.intakeForm} dispatch={dispatchIntakeForm} />);
};

export const component: PageComponent<RouteParams, SharedState, State, Msg> = {
  init,
  update,
  view,
  getAlerts: emptyPageAlerts,
  getMetadata(state) {
    return makePageMetadata('Create a VII Application');
  },
  getBreadcrumbs: emptyPageBreadcrumbs,
  getModal: noPageModal
};
