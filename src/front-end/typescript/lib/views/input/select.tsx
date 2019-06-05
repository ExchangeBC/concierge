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

export type Value = Option | undefined;

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

// TODO create a separate view that abstracts react-select usage.
const Child: View<ChildProps> = props => {
  const { state, disabled, className, onChange } = props;
  const selectProps: SelectProps<Value> = {
    isSearchable: true,
    isClearable: true,
    name: state.id,
    id: state.id,
    placeholder: state.placeholder,
    value: state.value,
    isDisabled: disabled,
    options: state.options,
    className: `${className} react-select-container`,
    classNamePrefix: 'react-select',
    styles: {
      control(styles) {
        return {
          ...styles,
          minHeight: undefined,
          borderWidth: undefined,
          borderColor: undefined,
          borderStyle: undefined,
          boxShadow: undefined,
          '&:hover': undefined
        };
      },
      placeholder(styles) {
        return {
          ...styles,
          color: undefined
        };
      },
      singleValue(styles) {
        return {
          ...styles,
          color: undefined
        };
      },
      option(styles) {
        return {
          ...styles,
          backgroundColor: undefined,
          ':active': undefined
        };
      }
    },
    onChange(value, action) {
      if (value && Array.isArray(value)) {
        onChange(value[0]);
      } else {
        onChange(value as Value);
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
