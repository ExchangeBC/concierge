import { Page } from 'front-end/lib/app/types';
import * as SelectMulti from 'front-end/lib/components/input/select-multi';
import { Component, ComponentMsg, ComponentView, Dispatch, immutable, Immutable, Init, mapComponentDispatch, Update } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import FormSectionHeading from 'front-end/lib/views/form-section-heading';
import * as Select from 'front-end/lib/views/input/select';
import * as ShortText from 'front-end/lib/views/input/short-text';
import { default as React } from 'react';
import { Col, Row } from 'reactstrap';
import AVAILABLE_CATEGORIES from 'shared/data/categories';
import { getString } from 'shared/lib';
import { PublicRfi } from 'shared/lib/resources/request-for-information';
import { PublicUser } from 'shared/lib/resources/user';
import { ADT, profileToName, UserType, userTypeToTitleCase } from 'shared/lib/types';

const FALLBACK_NAME = 'No Name Provided';

export interface Params {
  isEditing: boolean;
  existingRfi?: PublicRfi;
}

export type InnerMsg
  = ADT<'rfiNumber', string>
  | ADT<'title', string>
  | ADT<'publicSectorEntity', string>
  | ADT<'buyerContact', string>
  | ADT<'programStaffContact', string>
  | ADT<'categories', SelectMulti.Msg>;

export type Msg = ComponentMsg<InnerMsg, Page>;

export interface State {
  loading: number;
  isEditing: boolean;
  rfiNumber: ShortText.State;
  title: ShortText.State;
  publicSectorEntity: ShortText.State;
  buyerContact: Select.State;
  programStaffContact: Select.State;
  categories: Immutable<SelectMulti.State>;
  // closingAt: ShortText.State;
  // description: ShortText.State;
  // discoveryDay: ShortText.State;
  // attachments: ShortText.State[];
  // addenda: ShortText.State[];
};

export const init: Init<Params, State> = async ({ isEditing, existingRfi }) => {
  const result = await api.readManyUsers();
  let buyerUsers: PublicUser[] = [];
  let programStaffUsers: PublicUser[] = [];
  if (result.tag === 'valid') {
    // Sort users by name.
    const comparator = (a: PublicUser, b: PublicUser): number => {
      const aName = profileToName(a.profile) || FALLBACK_NAME;
      const bName = profileToName(b.profile) || FALLBACK_NAME;
      return aName.localeCompare(bName, 'en', { sensitivity: 'base' });
    };
    const predicate = (userType: UserType): ((user: PublicUser) => boolean) => {
      return user => user.profile.type === userType;
    };
    buyerUsers = result.value.items.filter(predicate(UserType.Buyer)).sort(comparator);
    programStaffUsers = result.value.items.filter(predicate(UserType.ProgramStaff)).sort(comparator);
  }
  const userToOption = (user: PublicUser): SelectMulti.Option => {
    return {
      value: user._id,
      label: profileToName(user.profile) || FALLBACK_NAME
    };
  };
  return {
    loading: 0,
    isEditing,
    rfiNumber: ShortText.init({
      id: 'rfi-number',
      required: true,
      type: 'text',
      label: 'Request for Information (RFI) Number',
      placeholder: 'RFI Number',
      value: getString(existingRfi, 'rfiNumber')
    }),
    title: ShortText.init({
      id: 'rfi-title',
      required: true,
      type: 'text',
      label: 'Project Title',
      placeholder: 'Project Title',
      value: getString(existingRfi, 'title')
    }),
    publicSectorEntity: ShortText.init({
      id: 'rfi-public-sector-entity',
      required: true,
      type: 'text',
      label: 'Public Sector Entity',
      placeholder: 'Public Sector Entity',
      value: getString(existingRfi, 'publicSectorEntity')
    }),
    buyerContact: Select.init({
      id: 'rfi-buyer-contact',
      value: '',
      required: true,
      label: `${userTypeToTitleCase(UserType.Buyer)} Contact`,
      unselectedLabel: `Select ${userTypeToTitleCase(UserType.Buyer)}`,
      options: buyerUsers.map(userToOption)
    }),
    programStaffContact: Select.init({
      id: 'rfi-program-staff-contact',
      value: '',
      required: true,
      label: `${userTypeToTitleCase(UserType.ProgramStaff)} Contact`,
      unselectedLabel: `Select ${userTypeToTitleCase(UserType.ProgramStaff)}`,
      options: programStaffUsers.map(userToOption)
    }),
    categories: immutable(await SelectMulti.init({
      options: AVAILABLE_CATEGORIES.toJS().map(value => ({ label: value, value })),
      unselectedLabel: 'Select Commodity Code',
      formFieldMulti: {
        idNamespace: 'rfi-categories',
        label: 'Commodity Code(s)',
        required: true,
        fields: [{
          value: '',
          errors: [],
          removable: false
        }]
      }
    }))
  };
};

export const update: Update<State, Msg> = (state, msg) => {
  switch (msg.tag) {
    default:
      return [state];
  }
};

const Details: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const disabled = !state.isEditing;
  const onChangeShortText = (tag: any) => ShortText.makeOnChange(dispatch, e => ({ tag, value: e.currentTarget.value }));
  const onChangeSelect = (tag: any) => Select.makeOnChange(dispatch, e => ({ tag, value: e.currentTarget.value }));
  const dispatchCategories: Dispatch<SelectMulti.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, value => ({ tag: 'categories' as 'categories', value }));
  return (
    <div>
      <Row>
        <Col xs='12'>
          <FormSectionHeading text='Details' />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='4'>
          <ShortText.view
            state={state.rfiNumber}
            disabled={disabled}
            onChange={onChangeShortText('rfiNumber')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='10'>
          <ShortText.view
            state={state.title}
            disabled={disabled}
            onChange={onChangeShortText('title')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='4'>
          <Select.view
            state={state.buyerContact}
            disabled={disabled}
            onChange={onChangeSelect('buyerContact')} />
        </Col>
        <Col xs='12' md='6'>
          <ShortText.view
            state={state.publicSectorEntity}
            disabled={disabled}
            onChange={onChangeShortText('publicSectorEntity')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='4'>
          <Select.view
            state={state.programStaffContact}
            disabled={disabled}
            onChange={onChangeSelect('programStaffContact')} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='6'>
          <SelectMulti.view
            state={state.categories}
            dispatch={dispatchCategories}
            disabled={disabled} />
        </Col>
      </Row>
    </div>
  );
};

export const view: ComponentView<State, Msg> = props => {
  return (
    <div>
      <Details {...props} />
    </div>
  );
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
