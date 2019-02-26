import { Immutable, View } from 'front-end/lib/framework';
import { cloneDeep } from 'lodash';
import { default as React, FormEventHandler } from 'react';
import { Alert, Button, FormGroup, InputGroup, InputGroupAddon, Label } from 'reactstrap';

export interface Field {
  value: string;
  valid: boolean;
  invalid: boolean;
}

export function emptyField(): Field {
  return {
    value: '',
    valid: false,
    invalid: false
  };
}

export interface State {
  idNamespace: string;
  label: string;
  labelClassName?: string;
  fields: Field[];
  help?: {
    text: string;
    show: boolean;
  }
}

export function getFieldValues(state: State): string[] {
  return state.fields.map(field => field.value);
}

export function setFieldValues(state: Immutable<State>, values: string[]): Immutable<State> {
  const fields = cloneDeep(state.fields);
  values.forEach((value, i) => fields[i].value = value);
  return state.set('fields', fields);
}

export interface ChildProps<ChildElement> {
  id: string;
  className: string;
  state: Field;
  onChange: FormEventHandler<ChildElement>;
}

export interface Props<ChildElement> {
  state: State;
  Child: View<ChildProps<ChildElement>>;
  onChange(index: number): FormEventHandler<ChildElement>;
  onAdd(): void;
  onRemove(index: number): void;
  toggleHelp?(): void;
}

const ConditionHelpToggle: View<Props<any>> = ({ state, toggleHelp }) => {
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

const FieldLabel: View<Props<any>> = (props) => {
  const { label, labelClassName = '' } = props.state;
  return (
    <Label className={labelClassName}>
      {label}
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

function Children<ChildElement>({ Child, state, onChange, onRemove }: Props<ChildElement>) {
  const children = state.fields.map((field, i) => {
    const id = `${state.idNamespace}-${i}`;
    const className = `form-control ${field.valid ? 'is-valid' : ''} ${field.invalid ? 'is-invalid' : ''}`;
    return (
      <InputGroup key={i} className='mt-2'>
        <Child id={id} className={className} state={field} onChange={onChange(i)} />
        <InputGroupAddon addonType='append'>
          <Button color='danger' onClick={() => onRemove(i)}>
            Remove
          </Button>
        </InputGroupAddon>
      </InputGroup>
    );
  });
  return (
    <div>{children}</div>
  );
};

export function view<ChildElement>(props: Props<ChildElement>) {
  const { state, onAdd } = props;
  return (
    <FormGroup className={`form-field-${state.idNamespace}`}>
      <div className='d-flex justify-content-between align-items-center'>
        <FieldLabel {...props} />
        <Button color='secondary' size='sm' className='ml-2' onClick={() => onAdd()}>
          Add
        </Button>
      </div>
      <ConditionalHelp {...state} />
      <Children {...props} />
    </FormGroup >
  );
}
