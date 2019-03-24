import { Immutable, View } from 'front-end/lib/framework';
import Icon from 'front-end/lib/views/icon';
import { cloneDeep, reduce } from 'lodash';
import { ChangeEventHandler, default as React, ReactElement } from 'react';
import { Alert, Button, FormGroup, FormText, InputGroup, InputGroupAddon, Label } from 'reactstrap';

export interface Field<Value> {
  value: Value;
  errors: string[];
  removable?: boolean;
}

export function makeField<Value>(value: Value, errors: string[] = []): Field<Value> {
  return {
    value,
    errors
  };
}

export interface State<Value> {
  idNamespace: string;
  label?: string;
  labelClassName?: string;
  required: boolean;
  fields: Array<Field<Value>>;
  help?: {
    text: string;
    show: boolean;
  }
}

export function getFieldValues<Value>(state: State<Value>): Value[] {
  return state.fields.map(field => field.value);
}

export function setFieldValues<Value>(state: Immutable<State<Value>>, values: Value[]): Immutable<State<Value>> {
  const fields = cloneDeep(state.fields);
  fields.forEach((field, i) => field.value = values[i] || field.value);
  return state.set('fields', fields);
}

export function setFieldErrors<Value>(state: Immutable<State<Value>>, errors: string[][]): Immutable<State<Value>> {
  const fields = cloneDeep(state.fields);
  fields.forEach((field, i) => field.errors = errors[i] || []);
  return state.set('fields', fields);
}

export function isValid<Value>(state: Immutable<State<Value>>): boolean {
  return reduce(state.fields, (acc: boolean, v: Field<Value>) => {
    return acc && (!v.errors || !v.errors.length);
  }, true);
}

export interface ChildProps<ChildElement, Value, ExtraProps> {
  id: string;
  className: string;
  field: Field<Value>;
  disabled: boolean;
  onChange: ChangeEventHandler<ChildElement>;
  extraProps: ExtraProps;
  onRemove(): void;
}

export interface AddButtonProps<OnAddParams> {
  onAdd(params?: OnAddParams): void;
}

export interface Props<ChildElement, Value, OnAddParams, ExtraChildProps> {
  state: State<Value>;
  disabled?: boolean;
  AddButton: View<AddButtonProps<OnAddParams>>;
  addButtonProps: AddButtonProps<OnAddParams>;
  Child: View<ChildProps<ChildElement, Value, ExtraChildProps>>;
  childClassName?: string;
  extraChildProps: ExtraChildProps;
  onChange(index: number): ChangeEventHandler<ChildElement>;
  onRemove(index: number): () => void;
  toggleHelp?(): void;
}

const ConditionHelpToggle: View<Props<any, any, any, any>> = ({ state, toggleHelp, disabled = false }) => {
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

const ConditionalLabel: View<Props<any, any, any, any>> = (props) => {
  const { label, required } = props.state;
  if (label) {
    return (
      <Label className={`mb-0 mr-3 mb-2 ${required ? 'font-weight-bold' : ''}`}>
        {label}
        <span className='text-info'>{required ? '*' : ''}</span>
        <ConditionHelpToggle {...props} />
      </Label>
    );
  } else {
    return null;
  }
};

export function makeDefaultAddButton(text = 'Add'): View<AddButtonProps<void>> {
  return props => {
    return (
      <Button color='secondary' size='sm' className='mb-2' onClick={() => props.onAdd()}>
        {text}
      </Button>
    );
  };
}

function ConditionalAddButton<OnAddParams>(props: Props<any, any, OnAddParams, any>) {
  const { AddButton, addButtonProps, disabled = false } = props;
  if (disabled) {
    return null;
  } else {
    return (<AddButton onAdd={addButtonProps.onAdd} />);
  }
}

const ConditionalHelp: View<Props<any, any, any, any>> = ({ state, disabled = false }) => {
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

const ConditionalFieldErrors: View<Field<any>> = ({ errors }) => {
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

function ConditionalRemoveButton<ChildElement, Value>(props: ChildProps<ChildElement, Value, any>) {
  if (props.disabled) {
    return null;
  } else {
    const { removable = true } = props.field;
    return (
      <InputGroupAddon addonType='append'>
        <Button color='secondary' onClick={() => removable && props.onRemove()} disabled={!removable}>
          <Icon name='trash' color='white' width={1.25} height={1.25} />
        </Button>
      </InputGroupAddon>
    );
  }
}

export interface DefaultChildProps<ChildElement, Value, ExtraProps> {
  childProps: ChildProps<ChildElement, Value, ExtraProps>;
  children: ReactElement<any> | Array<ReactElement<any>> | string;
}

/**
 * Helper React component to create a "standard"
 * child component.
 */

export function DefaultChild<ChildElement, Value, ExtraProps>(props: DefaultChildProps<ChildElement, Value, ExtraProps>) {
  const { childProps, children } = props;
  return (
    <InputGroup>
      {children}
      <ConditionalRemoveButton {...childProps} />
    </InputGroup>
  );
}

function Children<ChildElement, Value, OnAddParams, ExtraChildProps>(props: Props<ChildElement, Value, OnAddParams, ExtraChildProps>) {
  const { Child, state, onChange, onRemove, childClassName = '', extraChildProps, disabled = false } = props;
  const children = state.fields.map((field, i) => {
    const id = `${state.idNamespace}-${i}`;
    const invalid = !!field.errors.length;
    const className = `form-control ${invalid ? 'is-invalid' : ''}`;
    return (
      <FormGroup key={`form-field-multi-child-${i}`} className={childClassName}>
        <Child
          key={`form-field-multi-child-${i}`}
          id={id}
          className={className}
          field={field}
          onChange={onChange(i)}
          onRemove={onRemove(i)}
          extraProps={extraChildProps}
          disabled={disabled} />
        <ConditionalFieldErrors {...field} />
      </FormGroup>
    );
  });
  return (
    <div>{children}</div>
  );
};

export function view<ChildElement, Value, OnAddParams, ExtraChildProps>(props: Props<ChildElement, Value, OnAddParams, ExtraChildProps>) {
  const { state } = props;
  const labelClassName = state.labelClassName || '';
  return (
    <FormGroup className={`form-field-${state.idNamespace}`}>
      <div className={`d-flex flex-wrap align-items-center mb-2 ${labelClassName}`}>
        <ConditionalLabel {...props} />
        <ConditionalAddButton {...props} />
      </div>
      <ConditionalHelp {...props} />
      <Children {...props} />
    </FormGroup >
  );
}
