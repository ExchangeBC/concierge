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

export interface ChildProps<State, ChildElement, ExtraProps> {
  state: State;
  onChange: FormEventHandler<ChildElement>;
  className: string;
  extraProps?: ExtraProps;
}

export interface Props<ChildState extends State, ChildElement, ChildExtraProps> {
  state: ChildState;
  Child: View<ChildProps<ChildState, ChildElement, ChildExtraProps>>;
  onChange: FormEventHandler<ChildElement>;
  extraProps?: ChildExtraProps;
  toggleHelp?(): void;
}

const ConditionHelpToggle: View<Props<any, any, any>> = ({ state, toggleHelp }) => {
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

const ConditionalLabel: View<Props<any, any, any>> = (props) => {
  const { id, label, required } = props.state;
  if (label) {
    return (
      <Label for={id} className={required ? 'font-weight-bold' : ''}>
        {label}
        <span className='text-info'>{required ? '*' : ''}</span>
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
      return (<div key={`form-field-conditional-errors-${i}`}>{error}</div>);
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

export function view<ChildState extends State, ChildElement, ChildExtraProps>(props: Props<ChildState, ChildElement, ChildExtraProps>) {
  const { state, Child, onChange, extraProps } = props;
  const invalid = !!state.errors.length;
  const className = `form-control ${invalid ? 'is-invalid' : ''}`;
  return (
    <FormGroup className={`form-field-${state.id}`}>
      <ConditionalLabel {...props} />
      <ConditionalHelp {...state} />
      <Child state={state} onChange={onChange} className={className} extraProps={extraProps} />
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
