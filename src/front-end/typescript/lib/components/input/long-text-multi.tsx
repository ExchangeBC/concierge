import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentViewProps, immutable, Immutable, Init, Update, View } from 'front-end/lib/framework';
import * as FormFieldMulti from 'front-end/lib/views/form-field-multi';
import * as TextArea from 'front-end/lib/views/input/text-area';
import { compact } from 'lodash';
import { ChangeEventHandler, CSSProperties, default as React } from 'react';
import { Label } from 'reactstrap';
import { ADT, Omit } from 'shared/lib/types';

export type Value
  = ADT<'new', string>
  | ADT<'existing', string>
  | ADT<'deleted'>;

export function makeNewValue(value: string): ADT<'new', string> {
  return {
    tag: 'new',
    value
  };
}

export function makeExistingValue(value: string): ADT<'existing', string> {
  return {
    tag: 'existing',
    value
  };
}

export function makeDeletedValue(): ADT<'deleted'> {
  return {
    tag: 'deleted',
    value: undefined
  };
}

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

export function getValuesAsStrings(state: Immutable<State>, deletedString: string): string[] {
  return getValues(state).map(value => value.tag === 'deleted' ? deletedString : value.value);
}

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
      addFields = addFields.concat(FormFieldMulti.makeField(makeNewValue('')));
      return [state.setIn(['formFieldMulti', 'fields'], addFields)];
    case 'remove':
      const fields = state.formFieldMulti.fields;
      const processedFields = fields.map((field, i) => {
        if (i !== msg.value) {
          return field;
        }
        switch (field.value.tag) {
          // Only remove 'new' fields.
          case 'new':
            return null;
          // Transform 'existing' fields to deleted ones.
          case 'existing':
            return FormFieldMulti.makeField(makeDeletedValue());
          // Do nothing with 'deleted' fields.
          // In practice this "shouldn't" happen.
          case 'deleted':
            return field
        }
      });
      const removeFields: Array<FormFieldMulti.Field<Value>> = compact(processedFields);
      return [state.setIn(['formFieldMulti', 'fields'], removeFields)];
    case 'change':
      const changeFields = state.formFieldMulti.fields.map((field, i) => {
        if (i === msg.value.index && (field.value.tag === 'new' || field.value.tag === 'existing')) {
          return {
            ...field,
            value: {
              ...field.value,
              value: msg.value.value
            }
          };
        }
        return field;
      });
      return [state.setIn(['formFieldMulti', 'fields'], changeFields)];
    default:
      return [state];
  }
};

const ConditionalLabel: View<FormFieldMulti.ChildProps<HTMLTextAreaElement, Value, ExtraChildProps>> = props => {
  const text = props.extraProps.field.label;
  if (text) {
    return (
      <Label className='mb-2 w-100 d-flex justify-content-between align-items-center'>
        {text}
        <FormFieldMulti.ConditionalRemoveButton {...props} />
      </Label>
    );
  } else {
    return null;
  }
};

const Child: View<FormFieldMulti.ChildProps<HTMLTextAreaElement, Value, ExtraChildProps>> = props => {
  const { id, extraProps, className, field, onChange, disabled = false } = props;
  if (field.value.tag === 'deleted') { return null; }
  return (
    <div>
      <ConditionalLabel {...props} />
      <TextArea.View
        id={id}
        className={className}
        value={field.value.value}
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
    formGroupClassName: 'px-md-7',
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
