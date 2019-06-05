import { Dispatch, View } from 'front-end/lib/framework';
import * as FormField from 'front-end/lib/views/form-field';
import { find } from 'lodash';
import React from 'react';
import Select from 'react-select';
import { Props as SelectProps } from 'react-select/lib/Select';

export interface Option {
  value: string;
  label: string;
}

export type Value = Option;

export function setValue(state: State, value?: string): State {
  const newValue = find(state.options, { value }) || state.options[0];
  return {
    ...state,
    value: newValue
  };
}

export interface State extends FormField.State<Value> {
  options: Option[];
  unselectedLabel?: string;
}

type ExtraProps = null;

export interface Props extends Pick<FormField.Props<State, ExtraProps, Value>, 'toggleHelp' | 'disabled' | 'onChange'> {
  state: State;
}

type ChildProps = FormField.ChildProps<State, ExtraProps, Value>;

interface InitParams extends Pick<State, 'id' | 'required' | 'label' | 'help' | 'options' | 'unselectedLabel'> {
  value?: State['value'];
}

export function init(params: InitParams): State {
  let { options } = params;
  if (params.unselectedLabel) {
    options = [{ value: '', label: params.unselectedLabel }].concat(options);
  }
  return {
    ...params,
    errors: [],
    options,
    value: params.value || options[0]
  };
}

export function makeOnChange<Msg>(dispatch: Dispatch<Msg>, fn: (value: Value) => Msg): FormField.OnChange<Value> {
  return value => {
    dispatch(fn(value));
  };
}

const Child: View<ChildProps> = props => {
  const { state, disabled, className, onChange } = props;
  const selectProps: SelectProps<Value> = {
    isSearchable: true,
    defaultValue: state.options[0],
    name: state.id,
    id: state.id,
    value: state.value,
    isDisabled: disabled,
    options: state.options,
    className: `${className} form-control p-0 react-select`,
    /*styles: {
      control() {
        return {
        };
      }
    },*/
    onChange(value, action) {
      if (value) {
        if (Array.isArray(value)) {
          onChange(value[0]);
        } else {
          onChange(value as Value);
        }
      }
    }
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
