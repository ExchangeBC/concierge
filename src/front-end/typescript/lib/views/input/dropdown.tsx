import { Dispatch, View } from 'front-end/lib/framework';
import * as FormField from 'front-end/lib/views/form-field';
import { default as React, FormEventHandler, SyntheticEvent } from 'react';

export interface Option {
  value: string;
  label: string;
}

export interface State extends FormField.State {
  options: Option[];
  unselectedLabel?: string;
}

export interface Props extends Pick<FormField.Props<State, HTMLSelectElement>, 'toggleHelp'> {
  state: State;
  onChange: FormEventHandler<HTMLSelectElement>;
}

type ChildProps = FormField.ChildProps<State, HTMLSelectElement>;

type InitParams = Pick<State, 'id' | 'value' | 'required' | 'label' | 'help' | 'options' | 'unselectedLabel'>;

export function init(params: InitParams): State {
  let options = params.options;
  if (params.unselectedLabel) {
    options = [{ value: '', label: params.unselectedLabel }].concat(params.options);
  }
  return {
    id: params.id,
    value: params.value,
    valid: false,
    invalid: false,
    required: params.required,
    label: params.label,
    options,
    unselectedLabel: params.unselectedLabel
  };
}

export function makeOnChange<Msg>(dispatch: Dispatch<Msg>, fn: (event: SyntheticEvent<HTMLSelectElement>) => Msg): FormEventHandler<HTMLSelectElement> {
  return event => {
    dispatch(fn(event));
  };
}

const Child: View<ChildProps> = props => {
  const { state, onChange, className } = props;
  const children = state.options.map((o, i) => {
    return (<option key={`${o.value}-${i}`} value={o.value}>{o.label}</option>);
  });
  return (
    <select
      name={state.id}
      id={state.id}
      value={state.value}
      className={className}
      onChange={onChange}>
      {children}
    </select>
  );
};

export const view: View<Props> = ({ state, onChange, toggleHelp }) => {
  return (
    <FormField.view Child={Child} state={state} onChange={onChange} toggleHelp={toggleHelp} />
  );
};
