import { Dispatch, View } from 'front-end/lib/framework';
import * as FormField from 'front-end/lib/views/form-field';
import { noop } from 'lodash';
import { ChangeEvent, ChangeEventHandler, default as React, KeyboardEventHandler } from 'react';

export interface State extends FormField.State {
  type: 'text' | 'email' | 'password';
  placeholder?: string;
}

type OnEnter = () => void;

interface ExtraProps {
  onKeyPress: KeyboardEventHandler<HTMLInputElement>;
  disabled: boolean;
}

export interface Props extends Pick<FormField.Props<State, HTMLInputElement, ExtraProps>, 'toggleHelp'> {
  state: State;
  disabled?: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onEnter?: OnEnter;
}

interface Params extends Pick<State, 'id' | 'required' | 'type' | 'label' | 'placeholder' | 'help'> {
  value?: string;
}

export function init(params: Params): State {
  return {
    id: params.id,
    value: params.value || '',
    errors: [],
    required: params.required,
    type: params.type,
    label: params.label,
    placeholder: params.placeholder
  };
}

export function makeOnChange<Msg>(dispatch: Dispatch<Msg>, fn: (event: ChangeEvent<HTMLInputElement>) => Msg): ChangeEventHandler<HTMLInputElement> {
  return event => {
    dispatch(fn(event));
  };
}

function makeOnKeyPress(onEnter?: OnEnter): KeyboardEventHandler<HTMLInputElement> {
  return event => {
    if (event.key === 'Enter' && onEnter) { onEnter(); }
  };
};

// We need to define a stateful React Component because React has a known issue that causes
// <input> field's cursors to jump around when we update their values using state management.
// In my opinion, the React team should fix this, but they don't view it as a bug (argh).
// Using a stateful component that tracks cursor position is the industry standard workaround
// as of 2019.03.04.
// Workaround idea: https://stackoverflow.com/questions/46000544/react-controlled-input-cursor-jumps
// Related React GitHub Issue: https://github.com/facebook/react/issues/12762
class Input extends React.Component<FormField.ChildProps<State, HTMLInputElement, ExtraProps>> {

  private ref: HTMLInputElement | null;
  private selectionStart: number | null;
  private selectionEnd: number | null;

  constructor(props: FormField.ChildProps<State, HTMLInputElement, ExtraProps>) {
    super(props);
    this.ref = null;
    this.selectionStart = null;
    this.selectionEnd = null;
  }

  public render() {
    const { state, onChange, className, extraProps } = this.props;
    const onKeyPress = (extraProps && extraProps.onKeyPress) || noop;
    const disabled: boolean = !!(extraProps && extraProps.disabled) || false;
    // Override the input type to text for emails to support selectionStart selection state.
    const inputType = state.type === 'email' ? 'text' : state.type;
    return (
      <input
        type={inputType}
        name={state.id}
        id={state.id}
        value={state.value || ''}
        placeholder={disabled ? '' : (state.placeholder || '')}
        disabled={disabled}
        className={className}
        onChange={this.onChange.bind(this, onChange)}
        onKeyPress={onKeyPress}
        ref={ref => { this.ref = ref; }} />
    );
  }

  public componentDidUpdate() {
    if (this.ref && this.selectionStart) {
      this.ref.setSelectionRange(this.selectionStart, this.selectionEnd || this.selectionStart);
    }
  }

  private onChange(onChangeChild: ChangeEventHandler<HTMLInputElement>, event: ChangeEvent<HTMLInputElement>) {
    this.selectionStart = event.target.selectionStart;
    this.selectionEnd = event.target.selectionEnd;
    onChangeChild(event);
  }
}

const Child: View<FormField.ChildProps<State, HTMLInputElement, ExtraProps>> = props => {
  return (
    <Input {...props} />
  );
};

export const view: View<Props> = ({ state, onChange, onEnter, toggleHelp, disabled = false }) => {
  const extraProps: ExtraProps = {
    onKeyPress: makeOnKeyPress(onEnter),
    disabled
  };
  return (
    <FormField.view Child={Child} state={state} onChange={onChange} toggleHelp={toggleHelp} extraProps={extraProps} />
  );
};
