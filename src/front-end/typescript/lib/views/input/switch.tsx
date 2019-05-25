import { Dispatch, View } from 'front-end/lib/framework';
import * as FormField from 'front-end/lib/views/form-field';
import { default as React, FormEventHandler, SyntheticEvent } from 'react';
import { CustomInput } from 'reactstrap';

export interface State extends FormField.State<boolean> {
  inlineLabel: string;
}

type ExtraProps = null;

export interface Props extends Pick<FormField.Props<State, HTMLInputElement, undefined, boolean>, 'toggleHelp' | 'labelClassName' | 'disabled'> {
  state: State;
  onChange: FormEventHandler<HTMLInputElement>;
}

type ChildProps = FormField.ChildProps<State, HTMLInputElement, ExtraProps>;

type InitParams = Pick<State, 'id' | 'value' | 'label' | 'help' | 'inlineLabel'>;

export function init(params: InitParams): State {
  return {
    ...params,
    errors: [],
    required: false
  };
}

export function makeOnChange<Msg>(dispatch: Dispatch<Msg>, fn: (event: SyntheticEvent<HTMLInputElement>) => Msg): FormEventHandler<HTMLInputElement> {
  return event => {
    dispatch(fn(event));
  };
}

const Child: View<ChildProps> = props => {
  const { state, disabled, onChange, className } = props;
  return (
    <CustomInput
      id={state.id}
      name={state.id}
      checked={state.value}
      disabled={disabled}
      type='checkbox'
      label={state.inlineLabel}
      className={className}
      onChange={onChange} />
  );
};

export const view: View<Props> = ({ state, onChange, toggleHelp, labelClassName, disabled = false }) => {
  return (
    <FormField.view
      Child={Child}
      state={state}
      onChange={onChange}
      toggleHelp={toggleHelp}
      extraProps={null}
      disabled={disabled}
      labelClassName={labelClassName} />
  );
};
