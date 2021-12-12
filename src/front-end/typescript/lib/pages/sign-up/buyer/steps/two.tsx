import * as SelectMulti from 'front-end/lib/components/form-field-multi/select';
import { ComponentView, Dispatch, immutable, Immutable, Init, mapComponentDispatch, Update, updateComponentChild } from 'front-end/lib/framework';
import { IsLoading, IsValid, makeView, StepComponent, StepMsg } from 'front-end/lib/pages/sign-up/lib/steps/step';
import { compact, get } from 'lodash';
import React from 'react';
import { Col, Row } from 'reactstrap';
import AVAILABLE_CATEGORIES from 'shared/data/categories';
import AVAILABLE_INDUSTRY_SECTORS from 'shared/data/industry-sectors';
import { CreateValidationErrors } from 'shared/lib/resources/user';
import { ADT } from 'shared/lib/types';
import { ArrayValidation, getInvalidValue, validateCategories, validateIndustrySectors } from 'shared/lib/validators';

export interface State {
  industrySectors: Immutable<SelectMulti.State>;
  categories: Immutable<SelectMulti.State>;
}

type FormFieldMultiKeys = 'industrySectors' | 'categories';

export type InnerMsg = ADT<'onChangeIndustrySectors', SelectMulti.Msg> | ADT<'onChangeCategories', SelectMulti.Msg>;

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
          idNamespace: 'buyer-industry-sectors',
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
          idNamespace: 'buyer-categories',
          label: 'Area(s) of Interest',
          required: true,
          minFields: 1,
          fields: SelectMulti.DEFAULT_SELECT_MULTI_FIELDS
        }
      })
    )
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
    default:
      return [state];
  }
};

function validateSelectMulti<K extends FormFieldMultiKeys>(state: Immutable<State>, key: K, validate: (_: string[]) => ArrayValidation<string>): Immutable<State> {
  const values = SelectMulti.getValuesAsStrings(state[key]);
  const validation = validate(values);
  return state.set(key, SelectMulti.setErrors(state[key], getInvalidValue(validation, [])));
}

const isValid: IsValid<State> = (state) => {
  return !!(compact(SelectMulti.getValuesAsStrings(state.industrySectors)).length && compact(SelectMulti.getValuesAsStrings(state.categories)).length && SelectMulti.isValid(state.industrySectors) && SelectMulti.isValid(state.categories));
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
    return (
      <div>
        <IndustrySectors {...props} />
        <Categories {...props} />
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
  return state.set('industrySectors', SelectMulti.setErrors(state.industrySectors, get(errors.profile, 'industrySectors', []))).set('categories', SelectMulti.setErrors(state.categories, get(errors.profile, 'categories', [])));
}
