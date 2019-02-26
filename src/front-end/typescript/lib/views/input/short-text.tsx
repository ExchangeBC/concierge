import { Dispatch, View } from 'front-end/lib/framework';
import * as FormField from 'front-end/lib/views/form-field';
import { default as React, FormEventHandler, SyntheticEvent } from 'react';

export interface State extends FormField.State {
  type: 'text' | 'email' | 'password';
  placeholder?: string;
}

export interface Props extends Pick<FormField.Props<State, HTMLInputElement>, 'toggleHelp'> {
  state: State;
  onChange: FormEventHandler<HTMLInputElement>;
}

type Params = Pick<State, 'id' | 'required' | 'type' | 'label' | 'placeholder' | 'help'>;

export function init(params: Params): State {
  return {
    id: params.id,
    value: '',
    errors: [],
    required: params.required,
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

const Child: View<FormField.ChildProps<State, HTMLInputElement>> = props => {
  const { state, onChange, className } = props;
  return (
    <input
      type={state.type}
      name={state.id}
      id={state.id}
      value={state.value || ''}
      placeholder={state.placeholder || ''}
      className={className}
      onChange={onChange} />
  );
};

export const view: View<Props> = ({ state, onChange, toggleHelp }) => {
  return (
    <FormField.view Child={Child} state={state} onChange={onChange} toggleHelp={toggleHelp} />
  );
};
