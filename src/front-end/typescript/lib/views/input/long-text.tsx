import { Dispatch, View } from 'front-end/lib/framework';
import * as FormField from 'front-end/lib/views/form-field';
import * as TextArea from 'front-end/lib/views/input/text-area';
import { ChangeEvent, ChangeEventHandler, CSSProperties, default as React, KeyboardEventHandler } from 'react';

export interface State extends FormField.State {
  placeholder?: string;
}

type OnEnter = () => void;

type OnChangeDebounced = () => void;

interface ExtraProps {
  onKeyUp: KeyboardEventHandler<HTMLTextAreaElement>;
  onChangeDebounced?: OnChangeDebounced;
  style?: CSSProperties;
}

export interface Props extends Pick<FormField.Props<State, HTMLTextAreaElement, ExtraProps>, 'toggleHelp' | 'disabled'> {
  state: State;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
  onChangeDebounced?: OnChangeDebounced;
  onEnter?: OnEnter;
  style?: CSSProperties;
}

interface Params extends Pick<State, 'id' | 'required' | 'label' | 'placeholder' | 'help'> {
  value?: string;
}

export function init(params: Params): State {
  return {
    ...params,
    value: params.value || '',
    errors: []
  };
}

export function makeOnChange<Msg>(dispatch: Dispatch<Msg>, fn: (event: ChangeEvent<HTMLTextAreaElement>) => Msg): ChangeEventHandler<HTMLTextAreaElement> {
  return event => {
    dispatch(fn(event));
  };
}

function makeOnKeyUp(onEnter?: OnEnter): KeyboardEventHandler<HTMLTextAreaElement> {
  return event => {
    if (event.key === 'Enter' && onEnter) { onEnter(); }
  };
};

const Child: View<FormField.ChildProps<State, HTMLTextAreaElement, ExtraProps>> = props => {
  const { state, className, onChange, extraProps, disabled } = props;
  return (
    <TextArea.View
      id={state.id}
      value={state.value}
      placeholder={state.placeholder}
      className={`${className} form-control`}
      disabled={disabled}
      style={extraProps && extraProps.style}
      onChange={onChange}
      onChangeDebounced={extraProps && extraProps.onChangeDebounced}
      onKeyUp={extraProps && extraProps.onKeyUp} />
  );
};

export const view: View<Props> = ({ state, onChange, onChangeDebounced, onEnter, toggleHelp, style, disabled = false }) => {
  const extraProps: ExtraProps = {
    onKeyUp: makeOnKeyUp(onEnter),
    onChangeDebounced,
    style
  };
  return (
    <FormField.view Child={Child} state={state} onChange={onChange} toggleHelp={toggleHelp} extraProps={extraProps} disabled={disabled} />
  );
};
