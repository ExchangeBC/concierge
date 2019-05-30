import { Dispatch, View } from 'front-end/lib/framework';
import * as FormField from 'front-end/lib/views/form-field';
import * as Input from 'front-end/lib/views/input/input';
import { ChangeEvent, ChangeEventHandler, default as React, KeyboardEventHandler } from 'react';
import { InputGroup, InputGroupAddon } from 'reactstrap';

export type Value = number | undefined;

export interface State extends FormField.State<Value> {
  placeholder?: string;
  min?: string;
  max?: string;
}

type OnEnter = () => void;

interface Addon {
  type: 'append' | 'prepend';
  text: string;
}

interface ExtraProps {
  onKeyUp: KeyboardEventHandler<HTMLInputElement>;
  onChangeDebounced?: Input.OnChangeDebounced;
  addon?: Addon;
}

export interface Props extends Pick<FormField.Props<State, HTMLInputElement, ExtraProps, Value>, 'toggleHelp' | 'disabled'> {
  state: State;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onChangeDebounced?: Input.OnChangeDebounced;
  onEnter?: OnEnter;
  addon?: Addon;
}

type Params  = Pick<State, 'id' | 'required' | 'placeholder' | 'min' | 'max' | 'label' | 'help' | 'value'>;

export function init(params: Params): State {
  return {
    ...params,
    errors: []
  };
}

export function makeOnChange<Msg>(dispatch: Dispatch<Msg>, fn: (event: ChangeEvent<HTMLInputElement>) => Msg): ChangeEventHandler<HTMLInputElement> {
  return event => {
    dispatch(fn(event));
  };
}

function makeOnKeyUp(onEnter?: OnEnter): KeyboardEventHandler<HTMLInputElement> {
  return event => {
    if (event.key === 'Enter' && onEnter) { onEnter(); }
  };
};

const Child: View<FormField.ChildProps<State, HTMLInputElement, ExtraProps>> = props => {
  const { state, disabled, className, onChange, extraProps } = props;
  const addon: Addon | undefined = extraProps && extraProps.addon;
  return (
    <InputGroup>
      <Input.View
        id={state.id}
        type='number'
        value={state.value === undefined ? '' : String(state.value)}
        className={`${className} form-control`}
        disabled={disabled}
        placeholder={state.placeholder}
        min={state.min}
        max={state.max}
        onChange={onChange}
        onChangeDebounced={extraProps && extraProps.onChangeDebounced}
        onKeyUp={extraProps && extraProps.onKeyUp} />
      {addon ? (<InputGroupAddon addonType={addon.type}>{addon.text}</InputGroupAddon>) : null}
    </InputGroup>
  );
};

export const view: View<Props> = ({ state, onChange, onChangeDebounced, onEnter, toggleHelp, disabled = false, addon }) => {
  const extraProps: ExtraProps = {
    onKeyUp: makeOnKeyUp(onEnter),
    onChangeDebounced,
    addon
  };
  return (
    <FormField.view<State, HTMLInputElement, ExtraProps, Value>
      Child={Child}
      state={state}
      onChange={onChange}
      toggleHelp={toggleHelp}
      extraProps={extraProps}
      disabled={disabled} />
  );
};
