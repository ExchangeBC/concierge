import { Dispatch, View } from 'front-end/lib/framework';
import * as FormField from 'front-end/lib/views/form-field';
import { AvailableIcons, default as Icon } from 'front-end/lib/views/icon';
import * as Input from 'front-end/lib/views/input/input';
import { ChangeEvent, ChangeEventHandler, default as React, KeyboardEventHandler } from 'react';
import { InputGroup, InputGroupAddon, InputGroupText } from 'reactstrap';

export interface State extends FormField.State {
  type: 'text' | 'email' | 'password' | 'date';
  placeholder?: string;
}

type OnEnter = () => void;

export interface Addon {
  icon: AvailableIcons;
  type: 'prepend' | 'append';
}

interface ExtraProps {
  onKeyUp: KeyboardEventHandler<HTMLInputElement>;
  onChangeDebounced?: Input.OnChangeDebounced;
  inputClassName: string;
  autoFocus?: boolean;
  addon?: Addon;
}

export interface Props extends Pick<FormField.Props<State, HTMLInputElement, ExtraProps>, 'toggleHelp' | 'disabled'> {
  state: State;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onChangeDebounced?: Input.OnChangeDebounced;
  onEnter?: OnEnter;
  inputClassName?: string;
  autoFocus?: boolean
  addon?: Addon;
}

interface Params extends Pick<State, 'id' | 'required' | 'type' | 'label' | 'placeholder' | 'help'> {
  value?: string;
}

export function init(params: Params): State {
  return {
    ...params,
    value: params.value || '',
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

const ConditionalAddon: View<{ addon?: Addon }> = ({ addon }) => {
  if (!addon) { return null; }
  return(
    <InputGroupAddon addonType={addon.type}>
      <InputGroupText>
        <Icon name={addon.icon} color='secondary' width={0.875} height={0.875} />
      </InputGroupText>
    </InputGroupAddon>
  );
};

const Child: View<FormField.ChildProps<State, HTMLInputElement, ExtraProps>> = props => {
  const { state, disabled, className, onChange, extraProps } = props;
  const addon: Addon | undefined = (extraProps && extraProps.addon);
  let inputClassName: string = (extraProps && extraProps.inputClassName) || '';
  inputClassName = `${inputClassName} ${addon ? (addon.type === 'prepend' ? 'border-left-0' : 'border-right-0') : ''}`;
  const autoFocus: boolean = !disabled && !!(extraProps && extraProps.autoFocus);
  return (
    <InputGroup>
      <Input.View
        id={state.id}
        type={state.type}
        value={state.value}
        placeholder={state.placeholder}
        className={`${className} ${inputClassName} form-control`}
        disabled={disabled}
        autoFocus={autoFocus}
        onChange={onChange}
        onChangeDebounced={extraProps && extraProps.onChangeDebounced}
        onKeyUp={extraProps && extraProps.onKeyUp} />
      <ConditionalAddon addon={addon} />
    </InputGroup>
  );
};

export const view: View<Props> = ({ state, onChange, onChangeDebounced, onEnter, toggleHelp, disabled = false, inputClassName = '', autoFocus, addon }) => {
  const extraProps: ExtraProps = {
    onKeyUp: makeOnKeyUp(onEnter),
    onChangeDebounced,
    inputClassName,
    autoFocus,
    addon
  };
  return (
    <FormField.view Child={Child} state={state} onChange={onChange} toggleHelp={toggleHelp} extraProps={extraProps} disabled={disabled} />
  );
};
