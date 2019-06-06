import { View } from 'front-end/lib/framework';
import { OnChange } from 'front-end/lib/views/form-field/lib';
import React from 'react';
import Select from 'react-select';
import { Props as SelectProps } from 'react-select/lib/Select';

export interface Option {
  value: string;
  label: string;
}

export type Value = Option | undefined;

export interface Props {
  name: string;
  id: string;
  placeholder: string;
  value?: Value;
  disabled?: boolean;
  options: Option[];
  className?: string;
  onChange: OnChange<Value>;
}

export const view: View<Props> = props => {
  const { disabled = false, className = '', onChange } = props;
  const selectProps: SelectProps<Value> = {
    ...props,
    isSearchable: true,
    isClearable: true,
    isDisabled: disabled,
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

export default view;
