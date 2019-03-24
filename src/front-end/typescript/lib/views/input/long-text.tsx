import { Dispatch, View } from 'front-end/lib/framework';
import * as FormField from 'front-end/lib/views/form-field';
import { debounce } from 'lodash';
import { ChangeEvent, ChangeEventHandler, CSSProperties, default as React, KeyboardEventHandler } from 'react';

export interface State extends FormField.State {
  placeholder?: string;
}

type OnEnter = () => void;

type OnChangeDebounced = () => void;

interface ExtraProps {
  onKeyUp: KeyboardEventHandler<HTMLTextAreaElement>;
  disabled: boolean;
  onChangeDebounced?: OnChangeDebounced;
  style?: CSSProperties;
}

export interface Props extends Pick<FormField.Props<State, HTMLTextAreaElement, ExtraProps>, 'toggleHelp'> {
  state: State;
  disabled?: boolean;
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
    id: params.id,
    value: params.value || '',
    errors: [],
    required: params.required,
    label: params.label,
    placeholder: params.placeholder
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

// We need to define a stateful React Component because React has a known issue that causes
// <input> field's cursors to jump around when we update their values using state management.
// In my opinion, the React team should fix this, but they don't view it as a bug (argh).
// Using a stateful component that tracks cursor position is the industry standard workaround
// as of 2019.03.04.
// Workaround idea: https://stackoverflow.com/questions/46000544/react-controlled-input-cursor-jumps
// Related React GitHub Issue: https://github.com/facebook/react/issues/12762
class TextArea extends React.Component<FormField.ChildProps<State, HTMLTextAreaElement, ExtraProps>> {

  private ref: HTMLTextAreaElement | null;
  private selectionStart: number | null;
  private selectionEnd: number | null;
  private onChangeDebounced: OnChangeDebounced | null;
  private value: string;
  private className: string;
  private disabled: boolean;

  constructor(props: FormField.ChildProps<State, HTMLTextAreaElement, ExtraProps>) {
    super(props);
    this.ref = null;
    this.selectionStart = null;
    this.selectionEnd = null;
    this.onChangeDebounced = null;
    this.value = '';
    this.className = '';
    this.disabled = false;
  }

  public render() {
    const { state, onChange, className, extraProps } = this.props;
    const onKeyUp = (extraProps && extraProps.onKeyUp) || undefined;
    const disabled: boolean = !!(extraProps && extraProps.disabled) || false;
    const style = (extraProps && extraProps.style) || {};
    // Manage this.onChangeDebounced.
    // This is pretty gross, but the only (simple) way to support real-time validation
    // and live user feedback of user input. We assume that onChangeDebounced never
    // *semantically* changes after it has been passed as a prop for the first time.
    // This allows us to ensure calls to this.onChangeDebounced are properly debounced.
    // Effectively, you can't change the functionality of the prop `onChangeDebounced`.
    if (!this.onChangeDebounced && extraProps && extraProps.onChangeDebounced) {
      this.onChangeDebounced = debounce(() => {
        // Update the component's cursor selection state.
        if (this.ref) {
          this.selectionStart = this.ref.selectionStart;
          this.selectionEnd = this.ref.selectionEnd;
        }
        // Run the debounced change handler.
        if (extraProps.onChangeDebounced) {
          extraProps.onChangeDebounced();
        }
      }, 500);
    }
    // Update the component's store of the state.
    this.value = state.value;
    this.className = className;
    this.disabled = disabled;
    return (
      <textarea
        name={state.id}
        id={state.id}
        value={state.value || ''}
        placeholder={disabled ? '' : (state.placeholder || '')}
        disabled={disabled}
        className={`${className} form-control`}
        style={style}
        onChange={this.onChange.bind(this, onChange)}
        onKeyUp={onKeyUp}
        ref={ref => { this.ref = ref; }} />
    );
  }

  public shouldComponentUpdate(nextProps: FormField.ChildProps<State, HTMLTextAreaElement, ExtraProps>) {
    return this.value !== nextProps.state.value || this.className !== nextProps.className || (!!nextProps.extraProps && this.disabled !== nextProps.extraProps.disabled);
  }

  public componentDidUpdate() {
    if (this.ref && this.selectionStart) {
      this.ref.setSelectionRange(this.selectionStart, this.selectionEnd || this.selectionStart);
    }
  }

  private onChange(onChange: ChangeEventHandler<HTMLTextAreaElement>, event: ChangeEvent<HTMLTextAreaElement>) {
    this.selectionStart = event.target.selectionStart;
    this.selectionEnd = event.target.selectionEnd;
    onChange(event);
    if (this.onChangeDebounced) { this.onChangeDebounced(); }
  }
}

const Child: View<FormField.ChildProps<State, HTMLTextAreaElement, ExtraProps>> = props => {
  return (
    <TextArea {...props} />
  );
};

export const view: View<Props> = ({ state, onChange, onChangeDebounced, onEnter, toggleHelp, style, disabled = false }) => {
  const extraProps: ExtraProps = {
    onKeyUp: makeOnKeyUp(onEnter),
    onChangeDebounced,
    disabled,
    style
  };
  return (
    <FormField.view Child={Child} state={state} onChange={onChange} toggleHelp={toggleHelp} extraProps={extraProps} />
  );
};
