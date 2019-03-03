import { Dispatch, View } from 'front-end/lib/framework';
import * as FormField from 'front-end/lib/views/form-field';
import { noop } from 'lodash';
import { default as React, FormEventHandler, KeyboardEventHandler, SyntheticEvent } from 'react';

export interface State extends FormField.State {
  type: 'text' | 'email' | 'password';
  placeholder?: string;
}

type OnEnter = () => void;

interface ExtraProps {
  onKeyPress: KeyboardEventHandler<HTMLInputElement>;
}

export interface Props extends Pick<FormField.Props<State, HTMLInputElement, ExtraProps>, 'toggleHelp'> {
  state: State;
  onChange: FormEventHandler<HTMLInputElement>;
  onEnter?: OnEnter;
}

interface Params extends Pick<State, 'id' | 'required' | 'disabled' | 'type' | 'label' | 'placeholder' | 'help'> {
  value?: string;
}

export function init(params: Params): State {
  return {
    id: params.id,
    value: params.value || '',
    errors: [],
    required: params.required,
    disabled: params.disabled || false,
    type: params.type,
    label: params.label,
    placeholder: params.placeholder
  };
}

export function makeOnChange<Msg>(dispatch: Dispatch<Msg>, fn: (event: SyntheticEvent<HTMLInputElement>) => Msg): FormEventHandler<HTMLInputElement> {
  return event => {
    dispatch(fn(event));
  };
}

function makeOnKeyPress(onEnter?: OnEnter): KeyboardEventHandler<HTMLInputElement> {
  return event => {
    if (event.key === 'Enter' && onEnter) { onEnter(); }
  };
};

const Child: View<FormField.ChildProps<State, HTMLInputElement, ExtraProps>> = props => {
  const { state, onChange, className, extraProps } = props;
  const onKeyPress = (extraProps && extraProps.onKeyPress) || noop;
  return (
    <input
      type={state.type}
      name={state.id}
      id={state.id}
      value={state.value || ''}
      placeholder={state.placeholder || ''}
      disabled={state.disabled}
      className={className}
      onChange={onChange}
      onKeyPress={onKeyPress} />
  );
};

export const view: View<Props> = ({ state, onChange, onEnter, toggleHelp }) => {
  const extraProps = {
    onKeyPress: makeOnKeyPress(onEnter)
  };
  return (
    <FormField.view Child={Child} state={state} onChange={onChange} toggleHelp={toggleHelp} extraProps={extraProps} />
  );
};
