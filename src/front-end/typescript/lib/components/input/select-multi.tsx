import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentView, immutable, Immutable, Init, Update, View } from 'front-end/lib/framework';
import * as FormFieldMulti from 'front-end/lib/views/form-field-multi';
import { Option } from 'front-end/lib/views/input/select';
import { cloneDeep } from 'lodash';
import { default as React, FormEventHandler } from 'react';
import { ADT, Omit } from 'shared/lib/types';

export interface State {
  options: Option[];
  unselectedLabel?: string;
  formFieldMulti: Immutable<FormFieldMulti.State>;
}

export function getValues(state: Immutable<State>): string[] {
  return FormFieldMulti.getFieldValues(state.formFieldMulti);
};

export function setValues(state: Immutable<State>, values: string[]): Immutable<State> {
  return state.set(
    'formFieldMulti',
    FormFieldMulti.setFieldValues(state.formFieldMulti, values)
  );
};

export function setErrors(state: Immutable<State>, errors: string[][]): Immutable<State> {
  return state.set(
    'formFieldMulti',
    FormFieldMulti.setFieldErrors(state.formFieldMulti, errors)
  );
};

export function isValid(state: Immutable<State>): boolean {
  return FormFieldMulti.isValid(state.formFieldMulti);
};

type InnerMsg
  = ADT<'add'>
  | ADT<'remove', number>
  | ADT<'change', { index: number, value: string }>;

export type Msg = ComponentMsg<InnerMsg, Page>;

export interface Params extends Omit<State, 'formFieldMulti'> {
  formFieldMulti: FormFieldMulti.State;
}

export const init: Init<Params, State> = async params => {
  let options = params.options;
  if (params.unselectedLabel) {
    options = [{ value: '', label: params.unselectedLabel }].concat(params.options);
  }
  return {
    options,
    unselectedLabel: params.unselectedLabel,
    formFieldMulti: immutable(params.formFieldMulti)
  };
};

export const update: Update<State, Msg> = (state, msg) => {
  switch (msg.tag) {
    case 'add':
      let addFields = state.formFieldMulti.fields;
      addFields = addFields.concat(FormFieldMulti.emptyField());
      return [state.setIn(['formFieldMulti', 'fields'], addFields)];
    case 'remove':
      let removeFields = state.formFieldMulti.fields;
      removeFields = removeFields.filter((field, i) => i !== msg.value);
      return [state.setIn(['formFieldMulti', 'fields'], removeFields)];
    case 'change':
      const changeFields = cloneDeep(state.formFieldMulti.fields);
      changeFields.forEach((field, i) => {
        if (i === msg.value.index) {
          field.value = msg.value.value;
        }
      });
      return [state.setIn(['formFieldMulti', 'fields'], changeFields)];
    default:
      return [state];
  }
};

function makeChild(state: State): View<FormFieldMulti.ChildProps<HTMLSelectElement>> {
  return props => {
    const { id, className, state: field, onChange } = props;
    const children = state.options.map((o, i) => {
      return (<option key={`select-multi-option-${o.value}-${i}`} value={o.value}>{o.label}</option>);
    });
    return (
      <select
        id={id}
        name={id}
        value={field.value}
        className={className}
        onChange={onChange}>
        {children}
      </select>
    );
  }
};

export const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const onChange = (index: number): FormEventHandler<HTMLSelectElement> => event => {
    dispatch({
      tag: 'change',
      value: {
        index,
        value: event.currentTarget.value
      }
    });
  };

  const onAdd = () => dispatch({ tag: 'add', value: undefined });
  const onRemove = (index: number) => dispatch({ tag: 'remove', value: index });
  return (
    <FormFieldMulti.view
      state={state.formFieldMulti}
      Child={makeChild(state)}
      onChange={onChange}
      onAdd={onAdd}
      onRemove={onRemove} />
  );
}

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
