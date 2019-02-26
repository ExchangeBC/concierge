import { Immutable, View } from 'front-end/lib/framework';
import { default as React, FormEventHandler } from 'react';
import { Alert, FormGroup, FormText, Label } from 'reactstrap';
import { getInvalidValue, Validation } from 'shared/lib/validators';

export interface State {
  value: string;
  id: string;
  required: boolean;
  errors: string[];
  label?: string;
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

const ConditionalLabel: View<Props<any, any>> = (props) => {
  const { id, label, required } = props.state;
  if (label) {
    return (
      <Label for={id}>
        {`${label}${required ? '*' : ''}`}
        <ConditionHelpToggle {...props} />
      </Label>
    );
  } else {
    return null;
  }
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

const ConditionalErrors: View<State> = ({ errors }) => {
  if (errors.length) {
    const errorElements = errors.map((error, i) => {
      return (<div key={i}>{error}</div>);
    });
    return (
      <FormText color='danger'>
        {errorElements}
      </FormText>
    );
  } else {
    return null;
  }
}

export function view<ChildState extends State, ChildElement>(props: Props<ChildState, ChildElement>) {
  const { state, Child, onChange } = props;
  const invalid = !!state.errors.length;
  const className = `form-control ${invalid ? 'is-invalid' : ''}`;
  return (
    <FormGroup className={`form-field-${state.id}`}>
      <ConditionalLabel {...props} />
      <ConditionalHelp {...state} />
      <Child state={state} onChange={onChange} className={className} />
      <ConditionalErrors {...state} />
    </FormGroup>
  );
};

export function validateAndUpdateField<State>(state: Immutable<State>, key: string, value: string, validate: (value: string) => Validation<string>): Immutable<State> {
  const validation = validate(value);
  return state
    .setIn([key, 'value'], value)
    .setIn([key, 'errors'], getInvalidValue(validation, []));
}
