import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentView, Init, Update, View } from 'front-end/lib/framework';
import * as FormFieldMulti from 'front-end/lib/views/form-field-multi';
import { cloneDeep } from 'lodash';
import { default as React, FormEventHandler } from 'react';
import { ADT } from 'shared/lib/types';

export type State = FormFieldMulti.State;

export const getValues = FormFieldMulti.getFieldValues;

export const setValues = FormFieldMulti.setFieldValues;

type InnerMsg
  = ADT<'add'>
  | ADT<'remove', number>
  | ADT<'change', { index: number, value: string }>;

export type Msg = ComponentMsg<InnerMsg, Page>;

export type Params = State;

export const init: Init<Params, State> = async params => {
  return params;
};

export const update: Update<State, Msg> = (state, msg) => {
  switch (msg.tag) {
    case 'add':
      let addFields = state.fields;
      addFields = addFields.concat(FormFieldMulti.emptyField());
      return [state.set('fields', addFields)];
    case 'remove':
      let removeFields = state.fields;
      removeFields = removeFields.filter((field, i) => i !== msg.value);
      return [state.set('fields', removeFields)];
    case 'change':
      const changeFields = cloneDeep(state.fields);
      changeFields.forEach((field, i) => {
        if (i === msg.value.index) {
          field.value = msg.value.value;
        }
      });
      return [state.set('fields', changeFields)];
    default:
      return [state];
  }
};

const Child: View<FormFieldMulti.ChildProps<HTMLSelectElement>> = props => {
  const { id, className, onChange } = props;
  return (
    <select id={id} className={className} onChange={onChange}>
    </select>
  );
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
      state={state}
      Child={Child}
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
