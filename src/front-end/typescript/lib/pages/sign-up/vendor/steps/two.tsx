import * as SelectMulti from 'front-end/lib/components/form-field-multi/select';
import { ComponentView, Dispatch, immutable, Immutable, Init, mapComponentDispatch, Update, updateComponentChild } from 'front-end/lib/framework';
import { IsLoading, IsValid, makeView, StepComponent, StepMsg } from 'front-end/lib/pages/sign-up/lib/steps/step';
import * as Select from 'front-end/lib/views/form-field/select';
import { compact, get } from 'lodash';
import React from 'react';
import { Col, Row } from 'reactstrap';
import AVAILABLE_CATEGORIES from 'shared/data/categories';
import AVAILABLE_INDUSTRY_SECTORS from 'shared/data/industry-sectors';
import AVAILABLE_SIGN_UP_REASONS from 'shared/data/sign-up-reasons';
import { CreateValidationErrors } from 'shared/lib/resources/user';
import { ADT } from 'shared/lib/types';
import { ArrayValidation, getInvalidValue, mapValid, validateCategories, validateIndustrySectors, validateSignUpReason, Validation } from 'shared/lib/validators';

export interface State {
  industrySectors: Immutable<SelectMulti.State>;
  categories: Immutable<SelectMulti.State>;
  signUpReason: Select.State;
}

type FormFieldMultiKeys = 'industrySectors' | 'categories';

type FormFieldKeys = 'signUpReason';

export type InnerMsg = ADT<'onChangeIndustrySectors', SelectMulti.Msg> | ADT<'onChangeCategories', SelectMulti.Msg> | ADT<'onChangeSignUpReason', Select.Value>;

export type Msg = StepMsg<InnerMsg>;

export type Params = null;

const init: Init<Params, State> = async () => {
  return {
    industrySectors: immutable(
      await SelectMulti.init({
        options: AVAILABLE_INDUSTRY_SECTORS.toJS().map((value) => ({ label: value, value })),
        placeholder: 'Select Industry Sector',
        isCreatable: true,
        autoFocus: true,
        formFieldMulti: {
          idNamespace: 'vendor-industry-sectors',
          label: 'Industry Sector(s)',
          required: true,
          minFields: 1,
          fields: SelectMulti.DEFAULT_SELECT_MULTI_FIELDS
        }
      })
    ),
    categories: immutable(
      await SelectMulti.init({
        options: AVAILABLE_CATEGORIES.toJS().map((value) => ({ label: value, value })),
        placeholder: 'Select an Area of Interest',
        isCreatable: true,
        formFieldMulti: {
          idNamespace: 'vendor-categories',
          label: 'Area(s) of Interest',
          required: true,
          minFields: 1,
          fields: SelectMulti.DEFAULT_SELECT_MULTI_FIELDS
        }
      })
    ),
    signUpReason: Select.init({
      id: 'vendor-profile-sign-up-reason',
      required: false,
      isCreatable: true,
      label: 'How did you hear about the Procurement Concierge Program?',
      placeholder: 'Select',
      options: {
        tag: 'options',
        value: AVAILABLE_SIGN_UP_REASONS.toJS().map((value) => ({ label: value, value }))
      }
    })
  };
};

const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'onChangeIndustrySectors':
      state = updateComponentChild({
        state,
        mapChildMsg: (value) => ({ tag: 'onChangeIndustrySectors', value }),
        childStatePath: ['industrySectors'],
        childUpdate: SelectMulti.update,
        childMsg: msg.value
      })[0];
      return [validateSelectMulti(state, 'industrySectors', validateIndustrySectors)];
    case 'onChangeCategories':
      state = updateComponentChild({
        state,
        mapChildMsg: (value) => ({ tag: 'onChangeCategories', value }),
        childStatePath: ['categories'],
        childUpdate: SelectMulti.update,
        childMsg: msg.value
      })[0];
      return [validateSelectMulti(state, 'categories', validateCategories)];
    case 'onChangeSignUpReason':
      return [validateValue(updateValue(state, 'signUpReason', msg.value), 'signUpReason', validateOption(validateSignUpReason))];
    default:
      return [state];
  }
};

function validateSelectMulti<K extends FormFieldMultiKeys>(state: Immutable<State>, key: K, validate: (_: string[]) => ArrayValidation<string>): Immutable<State> {
  const values = SelectMulti.getValuesAsStrings(state[key]);
  const validation = validate(values);
  return state.set(key, SelectMulti.setErrors(state[key], getInvalidValue(validation, [])));
}

function validateOption(validate: (_: string) => Validation<unknown>): (option: Select.Value) => Validation<Select.Value> {
  return (option) => {
    const raw = option ? option.value : '';
    return mapValid(validate(raw), () => option);
  };
}

function updateValue<K extends FormFieldKeys>(state: Immutable<State>, key: K, value: State[K]['value']): Immutable<State> {
  return state.setIn([key, 'value'], value);
}

function validateValue<K extends FormFieldKeys>(state: Immutable<State>, key: K, validate: (value: State[K]['value']) => Validation<State[K]['value']>): Immutable<State> {
  const validation = validate(state.getIn([key, 'value']));
  return state.setIn([key, 'errors'], getInvalidValue(validation, []));
}

const isValid: IsValid<State> = (state) => {
  return !!(compact(SelectMulti.getValuesAsStrings(state.industrySectors)).length && compact(SelectMulti.getValuesAsStrings(state.categories)).length && SelectMulti.isValid(state.industrySectors) && SelectMulti.isValid(state.categories) && !state.signUpReason.errors.length);
};

const isLoading: IsLoading<State> = (state) => false;

const IndustrySectors: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const dispatchIndustrySectors: Dispatch<SelectMulti.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, (value) => ({ tag: 'onChangeIndustrySectors' as const, value }));
  return (
    <Row className="mt-3">
      <Col xs="12" md="7" lg="6">
        <SelectMulti.view state={state.industrySectors} dispatch={dispatchIndustrySectors} labelClassName="h3" labelWrapperClassName="mb-3" />
      </Col>
    </Row>
  );
};

const Categories: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const dispatchCategories: Dispatch<SelectMulti.Msg> = mapComponentDispatch(dispatch as Dispatch<Msg>, (value) => ({ tag: 'onChangeCategories' as const, value }));
  return (
    <Row className="mt-3">
      <Col xs="12" md="7" lg="6">
        <SelectMulti.view state={state.categories} dispatch={dispatchCategories} labelClassName="h3" labelWrapperClassName="mb-3" />
      </Col>
    </Row>
  );
};

const view: ComponentView<State, Msg> = makeView({
  title: 'Other Information',
  stepIndicator: 'Step 4 of 4',
  view(props) {
    const { state, dispatch } = props;
    const onChangeSelect = (tag: any) => Select.makeOnChange(dispatch, (value) => ({ tag, value }));
    return (
      <div>
        <IndustrySectors {...props} />
        <Categories {...props} />
        <Row className="mt-3">
          <Col xs="12" md="7" lg="6">
            <Select.view state={state.signUpReason} onChange={onChangeSelect('onChangeSignUpReason')} />
          </Col>
        </Row>
      </div>
    );
  }
});

export const component: StepComponent<Params, State, InnerMsg> = {
  init,
  update,
  view,
  isValid,
  isLoading,
  actionLabels: {
    next: 'Create Account',
    cancel: 'Cancel',
    back: 'Go Back'
  }
};

export default component;

export function setErrors(state: Immutable<State>, errors: CreateValidationErrors): Immutable<State> {
  return state
    .set('industrySectors', SelectMulti.setErrors(state.industrySectors, get(errors.profile, 'industrySectors', [])))
    .set('categories', SelectMulti.setErrors(state.categories, get(errors.profile, 'categories', [])))
    .setIn(['signUpReason', 'errors'], get(errors.profile, 'signUpReason', []));
}
