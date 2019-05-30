import { Route } from 'front-end/lib/app/types';
import { Component, ComponentViewProps, GlobalComponentMsg, immutable, Immutable, Init, Update, View } from 'front-end/lib/framework';
import * as FormFieldMulti from 'front-end/lib/views/form-field-multi';
import { Option } from 'front-end/lib/views/input/select';
import { cloneDeep } from 'lodash';
import { default as React, FormEventHandler } from 'react';
import { ADT, Omit } from 'shared/lib/types';

export { Option } from 'front-end/lib/views/input/select';

export interface State {
  options: Option[];
  unselectedLabel?: string;
  formFieldMulti: Immutable<FormFieldMulti.State<string>>;
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

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

export interface Params extends Omit<State, 'formFieldMulti'> {
  formFieldMulti: FormFieldMulti.State<string>;
}

type ExtraChildProps = Pick<State, 'options'>;

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

export const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'add':
      let addFields = state.formFieldMulti.fields;
      addFields = addFields.concat(FormFieldMulti.makeField(''));
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

const Child: View<FormFieldMulti.ChildProps<HTMLSelectElement, string, ExtraChildProps>> = props => {
  const { id, className, field, onChange, extraProps, disabled = false } = props;
  const children = extraProps.options.map((o: Option, i: number) => {
    return (<option key={`select-multi-option-${o.value}-${i}`} value={o.value}>{o.label}</option>);
  });
  return (
    <FormFieldMulti.DefaultChild childProps={props}>
      <select
        id={id}
        name={id}
        value={field.value}
        disabled={disabled}
        className={className}
        onChange={onChange}>
        {children}
      </select>
    </FormFieldMulti.DefaultChild>
  );
};

const AddButton: View<FormFieldMulti.AddButtonProps<void>> = FormFieldMulti.makeDefaultAddButton();

interface Props extends ComponentViewProps<State, Msg> {
  disabled?: boolean;
  labelClassName?: string;
  labelWrapperClassName?: string;
}

export const view: View<Props> = ({ state, dispatch, disabled = false, labelClassName, labelWrapperClassName }) => {
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
  const onRemove = (index: number) => () => dispatch({ tag: 'remove', value: index });
  const formFieldProps: FormFieldMulti.Props<HTMLSelectElement, string, void, ExtraChildProps> = {
    state: state.formFieldMulti,
    disabled,
    AddButton,
    addButtonProps: { onAdd },
    Child,
    onChange,
    onRemove,
    extraChildProps: {
      options: state.options
    },
    labelClassName,
    labelWrapperClassName
  };
  return (
    <FormFieldMulti.view {...formFieldProps} />
  );
}

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
