import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentViewProps, immutable, Immutable, Init, Update, View } from 'front-end/lib/framework';
import * as FormFieldMulti from 'front-end/lib/views/form-field-multi';
import Icon from 'front-end/lib/views/icon';
import * as TextArea from 'front-end/lib/views/input/text-area';
import { ChangeEventHandler, CSSProperties, default as React } from 'react';
import { Button, Label } from 'reactstrap';
import { ADT, Omit } from 'shared/lib/types';

export type Value = string;

export interface State {
  addButtonText?: string;
  field: {
    placeholder: string;
    label?: string;
    textAreaStyle?: CSSProperties;
  };
  formFieldMulti: Immutable<FormFieldMulti.State<Value>>;
}

export function getValues(state: Immutable<State>): Value[] {
  return FormFieldMulti.getFieldValues(state.formFieldMulti);
};

export function setValues(state: Immutable<State>, values: Value[]): Immutable<State> {
  return state.set(
    'formFieldMulti',
    FormFieldMulti.setFieldValues(state.formFieldMulti, values)
  );
};

export function setErrors(state: Immutable<State>, errors: string[][]): Immutable<State> {
  return state.set(
    'formFieldMulti',
    FormFieldMulti.setFieldErrors(state.formFieldMulti, errors)
  );
};

export function isValid(state: Immutable<State>): boolean {
  return FormFieldMulti.isValid(state.formFieldMulti);
};

type InnerMsg
  = ADT<'add'>
  | ADT<'remove', number>
  | ADT<'change', { index: number, value: string }>;

export type Msg = ComponentMsg<InnerMsg, Page>;

export interface Params extends Omit<State, 'formFieldMulti'> {
  formFieldMulti: FormFieldMulti.State<Value>;
}

type ExtraChildProps = Pick<State, 'field'>;

export const init: Init<Params, State> = async params => {
  return {
    addButtonText: params.addButtonText,
    field: params.field,
    formFieldMulti: immutable(params.formFieldMulti)
  };
};

export const update: Update<State, Msg> = (state, msg) => {
  switch (msg.tag) {
    case 'add':
      let addFields = state.formFieldMulti.fields;
      addFields = addFields.concat(FormFieldMulti.makeField(''));
      return [state.setIn(['formFieldMulti', 'fields'], addFields)];
    case 'remove':
      let removeFields = state.formFieldMulti.fields;
      removeFields = removeFields.filter((field, i) => i !== msg.value);
      return [state.setIn(['formFieldMulti', 'fields'], removeFields)];
    case 'change':
      const changeFields = state.formFieldMulti.fields.map((field, i) => {
        if (i === msg.value.index) {
          field.value = msg.value.value;
        }
        return field;
      });
      return [state.setIn(['formFieldMulti', 'fields'], changeFields)];
    default:
      return [state];
  }
};

const ConditionalRemoveButton: View<FormFieldMulti.ChildProps<HTMLTextAreaElement, Value, ExtraChildProps>> = props => {
  if (props.disabled) {
    return null;
  } else {
    const { removable = true } = props.field;
    return (
      <Button
        color='link'
        onClick={() => removable && props.onRemove()}
        disabled={!removable}
        className='p-0'>
        <Icon name='trash' color='secondary' width={1.25} height={1.25} />
      </Button>
    );
  }
}

const ConditionalLabel: View<FormFieldMulti.ChildProps<HTMLTextAreaElement, Value, ExtraChildProps>> = props => {
  const text = props.extraProps.field.label;
  if (text) {
    return (
      <Label className='mb-2 w-100 d-flex justify-content-between align-items-center'>
        {text}
        <ConditionalRemoveButton {...props} />
      </Label>
    );
  } else {
    return null;
  }
};

const Child: View<FormFieldMulti.ChildProps<HTMLTextAreaElement, Value, ExtraChildProps>> = props => {
  const { id, extraProps, className, field, onChange, disabled = false } = props;
  return (
    <div>
      <ConditionalLabel {...props} />
      <TextArea.View
        id={id}
        className={className}
        value={field.value}
        placeholder={extraProps.field.placeholder}
        disabled={disabled}
        style={extraProps.field.textAreaStyle}
        onChange={onChange} />
    </div>
  );
};

interface Props extends ComponentViewProps<State, Msg> {
  disabled?: boolean;
}

export const view: View<Props> = ({ state, dispatch, disabled = false }) => {
  const AddButton: View<FormFieldMulti.AddButtonProps<void>> = FormFieldMulti.makeDefaultAddButton(state.addButtonText);
  const onChange = (index: number): ChangeEventHandler<HTMLTextAreaElement> => event => {
    dispatch({
      tag: 'change',
      value: {
        index,
        value: event.currentTarget.value
      }
    });
  };
  const onAdd = () => dispatch({ tag: 'add', value: undefined });
  const onRemove = (index: number) => () => dispatch({ tag: 'remove', value: index });
  const formFieldProps: FormFieldMulti.Props<HTMLTextAreaElement, Value, void, ExtraChildProps> = {
    state: state.formFieldMulti,
    disabled,
    AddButton,
    addButtonProps: { onAdd },
    Child,
    childClassName: 'px-md-7',
    onChange,
    onRemove,
    extraChildProps: {
      field: state.field
    }
  };
  return (
    <FormFieldMulti.view {...formFieldProps} />
  );
}

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
