import { Immutable, View } from 'front-end/lib/framework';
import { default as React, FormEventHandler } from 'react';
import { Alert, FormGroup, Label } from 'reactstrap';
import { Validation } from 'shared/lib/validators';

export interface State {
  value: string;
  id: string;
  required: boolean;
  valid: boolean;
  invalid: boolean;
  label: string;
  help?: {
    text: string;
    show: boolean;
  }
}

export interface ChildProps<State, ChildElement> {
  state: State;
  onChange: FormEventHandler<ChildElement>;
  className: string;
}

export interface Props<ChildState extends State, ChildElement> {
  state: ChildState;
  Child: View<ChildProps<ChildState, ChildElement>>;
  onChange: FormEventHandler<ChildElement>;
  toggleHelp?(): void;
}

const ConditionHelpToggle: View<Props<any, any>> = ({ state, toggleHelp }) => {
  const { help } = state;
  if (help && toggleHelp) {
    return (
      <a onClick={() => toggleHelp()}>
        {help.show ? 'Hide' : 'Show'} Help Text
      </a>
    );
  } else {
    return null;
  }
};

const FieldLabel: View<Props<any, any>> = (props) => {
  const { id, label, required } = props.state;
  return (
    <Label for={id}>
      {`${label}${required ? '*' : ''}`}
      <ConditionHelpToggle {...props} />
    </Label>
  );
};

const ConditionalHelp: View<State> = ({ help }) => {
  if (help && help.show) {
    return (
      <Alert color='info'>
        {help.text}
      </Alert>
    );
  } else {
    return null;
  }
}

export function view<ChildState extends State, ChildElement>(props: Props<ChildState, ChildElement>) {
  const { state, Child, onChange } = props;
  const className = `form-control ${state.valid ? 'is-valid' : ''} ${state.invalid ? 'is-invalid' : ''}`;
  return (
    <FormGroup className={`form-field-${state.id}`}>
      <FieldLabel {...props} />
      <ConditionalHelp {...state} />
      <Child state={state} onChange={onChange} className={className} />
    </FormGroup>
  );
};

export function validateAndUpdateField<State>(state: Immutable<State>, key: string, value: string, validate: (value: string) => Validation<string>): Immutable<State> {
  const validation = validate(value);
  const valid = validation.tag === 'valid';
  return state
    .setIn([key, 'value'], value)
    .setIn([key, 'invalid'], !valid)
    .setIn([key, 'valid'], valid)
    .setIn(['validationErrors', key], valid ? [] : validation.value);
}
