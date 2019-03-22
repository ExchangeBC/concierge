import { Immutable, View } from 'front-end/lib/framework';
import Icon from 'front-end/lib/views/icon';
import { cloneDeep, reduce } from 'lodash';
import { default as React, FormEventHandler } from 'react';
import { Alert, Button, FormGroup, FormText, InputGroup, InputGroupAddon, Label } from 'reactstrap';

export interface Field {
  value: string;
  errors: string[];
  removable?: boolean;
}

export function emptyField(): Field {
  return {
    value: '',
    errors: []
  };
}

export interface State {
  idNamespace: string;
  label?: string;
  labelClassName?: string;
  required: boolean;
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
  fields.forEach((field, i) => field.value = values[i] || '');
  return state.set('fields', fields);
}

export function setFieldErrors(state: Immutable<State>, errors: string[][]): Immutable<State> {
  const fields = cloneDeep(state.fields);
  fields.forEach((field, i) => field.errors = errors[i] || []);
  return state.set('fields', fields);
}

export function isValid(state: Immutable<State>): boolean {
  return reduce(state.fields, (acc: boolean, v: Field) => {
    return acc && (!v.errors || !v.errors.length);
  }, true);
}

export interface ChildProps<ChildElement> {
  id: string;
  className: string;
  state: Field;
  disabled: boolean;
  onChange: FormEventHandler<ChildElement>;
}

export interface Props<ChildElement> {
  state: State;
  Child: View<ChildProps<ChildElement>>;
  disabled?: boolean;
  onChange(index: number): FormEventHandler<ChildElement>;
  onAdd(): void;
  onRemove(index: number): void;
  toggleHelp?(): void;
}

const ConditionHelpToggle: View<Props<any>> = ({ state, toggleHelp, disabled = false }) => {
  const { help } = state;
  if (help && toggleHelp && !disabled) {
    return (
      <a onClick={() => toggleHelp()}>
        {help.show ? 'Hide' : 'Show'} Help Text
      </a>
    );
  } else {
    return null;
  }
};

const ConditionalLabel: View<Props<any>> = (props) => {
  const { label, required } = props.state;
  if (label) {
    return (
      <Label className={required ? 'font-weight-bold' : ''}>
        {label}
        <span className='text-info'>{required ? '*' : ''}</span>
        <ConditionHelpToggle {...props} />
      </Label>
    );
  } else {
    return null;
  }
};

const ConditionalAddButton: View<Props<any>> = ({ state, onAdd, disabled = false }) => {
  if (!disabled) {
    return (
      <Button color='secondary' size='sm' className='ml-2' onClick={() => onAdd()}>
        Add
      </Button>
    );
  } else {
    return null;
  }
}

const ConditionalHelp: View<Props<any>> = ({ state, disabled = false }) => {
  const { help } = state;
  if (help && help.show && !disabled) {
    return (
      <Alert color='info'>
        {help.text}
      </Alert>
    );
  } else {
    return null;
  }
}

const ConditionalFieldErrors: View<Field> = ({ errors }) => {
  if (errors.length) {
    const errorElements = errors.map((error, i) => {
      return (<div key={`form-field-multi-conditional-errors-${i}`}>{error}</div>);
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

function ConditionalRemoveButton<ChildElement>(props: Props<ChildElement> & { index: number, field: Field }) {
  if (props.disabled) {
    return null;
  } else {
    const { removable = true } = props.field;
    return (
      <InputGroupAddon addonType='append'>
        <Button color='secondary' onClick={() => removable && props.onRemove(props.index)} disabled={!removable}>
          <Icon name='trash' color='white' width={1.25} height={1.25} />
        </Button>
      </InputGroupAddon>
    );
  }
}

function Children<ChildElement>(props: Props<ChildElement>) {
  const { Child, state, onChange, disabled = false } = props;
  const children = state.fields.map((field, i) => {
    const id = `${state.idNamespace}-${i}`;
    const invalid = !!field.errors.length;
    const className = `form-control ${invalid ? 'is-invalid' : ''}`;
    return (
      <FormGroup key={`form-field-multi-child-${i}`}>
        <InputGroup>
          <Child id={id} className={className} state={field} onChange={onChange(i)} disabled={disabled} />
          <ConditionalRemoveButton index={i} field={field} {...props} />
        </InputGroup>
        <ConditionalFieldErrors {...field} />
      </FormGroup>
    );
  });
  return (
    <div>{children}</div>
  );
};

export function view<ChildElement>(props: Props<ChildElement>) {
  const { state } = props;
  const labelClassName = state.labelClassName || '';
  return (
    <FormGroup className={`form-field-${state.idNamespace}`}>
      <div className={`d-flex justify-content-between align-items-center ${labelClassName}`}>
        <ConditionalLabel {...props} />
        <ConditionalAddButton {...props} />
      </div>
      <ConditionalHelp {...props} />
      <Children {...props} />
    </FormGroup >
  );
}
