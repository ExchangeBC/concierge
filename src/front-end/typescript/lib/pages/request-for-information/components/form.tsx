import * as FileMulti from 'front-end/lib/components/form-field-multi/file';
import { Component, ComponentView, ComponentViewProps, Dispatch, immutable, Immutable, Init, mapComponentDispatch, Update, updateComponentChild, View } from 'front-end/lib/framework';
import * as DetailsForm from 'front-end/lib/pages/request-for-information/components/details-form';
import * as DiscoveryDayForm from 'front-end/lib/pages/request-for-information/components/discovery-day-form';
import { default as React } from 'react';
import { Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import { PublicRfi } from 'shared/lib/resources/request-for-information';
import * as RfiResource from 'shared/lib/resources/request-for-information';
import { ADT, Omit } from 'shared/lib/types';

export interface Params {
  formType: 'create' | 'edit',
  existingRfi?: PublicRfi;
}

export type Msg
  = ADT<'setActiveTab', TabId>
  | ADT<'details', DetailsForm.Msg>
  | ADT<'discoveryDay', DiscoveryDayForm.Msg>;

export type TabId = 'details' | 'discoveryDay';

function tabIdToName(id: TabId): string {
  switch (id) {
    case 'details':
      return DetailsForm.TAB_NAME
    case 'discoveryDay':
      return DiscoveryDayForm.TAB_NAME
  }
}

export function makeErrorMessage(state: State): string {
  return `Please fix the errors below, and try submitting the form again. If you don't see any errors below, you may need to review the information in the "${tabIdToName(state.activeTab)}" tab, and resolve any issues there. If you are still unable to save this RFI, please contact this web app's software engineer.`;
}

export interface State {
  activeTab: TabId;
  details: Immutable<DetailsForm.State>;
  discoveryDay: Immutable<DiscoveryDayForm.State>;
};

export interface Values extends Omit<RfiResource.CreateRequestBody, 'attachments'> {
  attachments: FileMulti.Value[];
}

export function getValues(state: State, includeDeletedAddenda = false): Values {
  return {
    ...DetailsForm.getValues(state.details, includeDeletedAddenda),
    discoveryDay: DiscoveryDayForm.getValues(state.discoveryDay)
  };
}

export const init: Init<Params, State> = async ({ formType, existingRfi }) => {
  const isEditing = formType === 'create';
  const existingDiscoveryDay = existingRfi && existingRfi.latestVersion.discoveryDay;
  return {
    activeTab: 'details',
    details: immutable(await DetailsForm.init({
      isEditing,
      existingRfi
    })),
    discoveryDay: immutable(await DiscoveryDayForm.init({
      isEditing,
      showToggle: formType === 'create' || !existingDiscoveryDay,
      existingDiscoveryDay
    }))
  };
};

export const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'setActiveTab':
      return [state.set('activeTab', msg.value)];
    case 'details':
      return updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'details', value }),
        childStatePath: ['details'],
        childUpdate: DetailsForm.update,
        childMsg: msg.value
      });
    case 'discoveryDay':
      return updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'discoveryDay', value }),
        childStatePath: ['discoveryDay'],
        childUpdate: DiscoveryDayForm.update,
        childMsg: msg.value
      });
  }
};

export function setErrors(state: Immutable<State>, errors: RfiResource.CreateValidationErrors): Immutable<State> {
  return state
    .set('details', DetailsForm.setErrors(state.details, errors))
    .set('discoveryDay', DiscoveryDayForm.setErrors(state.discoveryDay, errors.discoveryDay || {}));
}

export function isValid(state: State): boolean {
  return DetailsForm.isValid(state.details) && DiscoveryDayForm.isValid(state.discoveryDay);
}

interface TabLinkProps extends ComponentViewProps<State, Msg> {
  id: TabId;
}

const TabLink: View<TabLinkProps> = ({ id, state, dispatch }) => {
  const isActive = id === state.activeTab;
  return (
    <NavItem>
      <NavLink className={isActive ? 'active' : ''} onClick={() => !isActive && dispatch({ tag: 'setActiveTab', value: id })}>
        {tabIdToName(id)}
      </NavLink>
    </NavItem>
  );
};

export const view: ComponentView<State, Msg> = props => {
  const { state, dispatch } = props;
  const dispatchDetails: Dispatch<DetailsForm.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'details' as const, value }));
  const dispatchDiscoveryDay: Dispatch<DiscoveryDayForm.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'discoveryDay' as const, value }));
  return (
    <div>
      <Nav tabs>
        <TabLink id='details' {...props} />
        <TabLink id='discoveryDay' {...props} />
      </Nav>
      <TabContent activeTab={state.activeTab}>
        <TabPane tabId='details'>
          <DetailsForm.view state={state.details} dispatch={dispatchDetails} />
        </TabPane>
        <TabPane tabId='discoveryDay'>
          <DiscoveryDayForm.view state={state.discoveryDay} dispatch={dispatchDiscoveryDay} />
        </TabPane>
      </TabContent>
    </div>
  );
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
