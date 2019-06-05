import { Dispatch, View } from 'front-end/lib/framework';
import * as FormField from 'front-end/lib/views/form-field/lib';
import { default as Select, Option, Props as SelectProps, Value } from 'front-end/lib/views/form-field/lib/select';
import { find } from 'lodash';
import React from 'react';

export { Option, Value } from 'front-end/lib/views/form-field/lib/select';

export function setValue(state: State, value?: string): State {
  const newValue = find(state.options, { value }) || undefined;
  return {
    ...state,
    value: newValue
  };
}

export interface State extends FormField.State<Value> {
  options: Option[];
  placeholder: string;
}

type ExtraProps = null;

export interface Props extends Pick<FormField.Props<State, ExtraProps, Value>, 'toggleHelp' | 'disabled' | 'onChange'> {
  state: State;
}

type ChildProps = FormField.ChildProps<State, ExtraProps, Value>;

interface InitParams extends Pick<State, 'id' | 'required' | 'label' | 'help' | 'options' | 'placeholder'> {
  value?: State['value'];
}

export function init(params: InitParams): State {
  return {
    ...params,
    errors: [],
    value: params.value
  };
}

export function makeOnChange<Msg>(dispatch: Dispatch<Msg>, fn: (value: Value) => Msg): FormField.OnChange<Value> {
  return value => {
    dispatch(fn(value));
  };
}

const Child: View<ChildProps> = props => {
  const { state, disabled, className, onChange } = props;
  const selectProps: SelectProps = {
    name: state.id,
    id: state.id,
    placeholder: state.placeholder,
    value: state.value,
    disabled,
    options: state.options,
    className,
    onChange
  };
  return (<Select {...selectProps} />);
};

export const view: View<Props> = ({ state, onChange, toggleHelp, disabled }) => {
  return (
    <FormField.view
      Child={Child}
      state={state}
      onChange={onChange}
      toggleHelp={toggleHelp}
      extraProps={null}
      disabled={disabled} />
  );
};
