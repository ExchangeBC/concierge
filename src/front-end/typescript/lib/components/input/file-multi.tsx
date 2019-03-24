import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, ComponentViewProps, immutable, Immutable, Init, Update, View } from 'front-end/lib/framework';
import * as FormFieldMulti from 'front-end/lib/views/form-field-multi';
import * as Input from 'front-end/lib/views/input/input';
import { ChangeEvent, ChangeEventHandler, default as React } from 'react';
import { Button } from 'reactstrap';
import { bytesToMegabytes } from 'shared/lib';
import { MAX_MULTIPART_FILES_SIZE } from 'shared/lib/resources/file';
import { ADT, Omit } from 'shared/lib/types';

export interface Value {
  file: File;
  name: string;
}

export interface State {
  formFieldMulti: Immutable<FormFieldMulti.State<Value>>;
}

const FILE_EXTENSION_REGEXP = /\.\w+$/;

function getFileExtension(name: string) {
  const match = name.match(FILE_EXTENSION_REGEXP);
  return match ? match[0] : '';
}

export function getValues(state: Immutable<State>): Value[] {
  const values = FormFieldMulti.getFieldValues(state.formFieldMulti);
  return values.map(value => {
    const { file, name } = value;
    const originalExtension = getFileExtension(value.file.name);
    return {
      file,
      // Help the user by appending the original file extension if they
      // overrode the attachment name.
      // If no overridden name is provided, use the original file name.
      name: name ? name.replace(new RegExp(`(${originalExtension})?$`), originalExtension) : file.name
    };
  });
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
  = ADT<'add', File>
  | ADT<'remove', number>
  | ADT<'change', { index: number, value: string }>;

export type Msg = ComponentMsg<InnerMsg, Page>;

export interface Params extends Omit<State, 'formFieldMulti'> {
  formFieldMulti: FormFieldMulti.State<Value>;
}

export const init: Init<Params, State> = async params => {
  return {
    formFieldMulti: immutable(params.formFieldMulti)
  };
};

export const update: Update<State, Msg> = (state, msg) => {
  switch (msg.tag) {
    case 'add':
      const file = msg.value;
      let addFields = state.formFieldMulti.fields;
      const errors = file.size > MAX_MULTIPART_FILES_SIZE ? [`Please remove this file, and select one less than ${bytesToMegabytes(MAX_MULTIPART_FILES_SIZE)} MB in size.`] : [];
      addFields = addFields.concat(FormFieldMulti.makeField({
        file,
        // The file name's input placeholder will show the original file name.
        name: ''
      }, errors));
      return [state.setIn(['formFieldMulti', 'fields'], addFields)];
    case 'remove':
      let removeFields = state.formFieldMulti.fields;
      removeFields = removeFields.filter((field, i) => i !== msg.value);
      return [state.setIn(['formFieldMulti', 'fields'], removeFields)];
    case 'change':
      const changeFields = state.formFieldMulti.fields.map((field, i) => {
        if (i === msg.value.index) {
          field.value.name = msg.value.value;
        }
        return field;
      });
      return [state.setIn(['formFieldMulti', 'fields'], changeFields)];
    default:
      return [state];
  }
};

const Child: View<FormFieldMulti.ChildProps<HTMLInputElement, Value, void>> = props => {
  const { id, className, field, onChange, disabled = false } = props;
  return (
    <FormFieldMulti.DefaultChild childProps={props}>
      <Input.View
        id={id}
        type='text'
        className={className}
        value={field.value.name}
        placeholder={field.value.file.name}
        disabled={disabled}
        onChange={onChange} />
    </FormFieldMulti.DefaultChild>
  );
};

function AddButton(props: FormFieldMulti.AddButtonProps<File>) {
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files && event.currentTarget.files[0];
    if (file) {
      props.onAdd(file);
    }
  };
  // Keep file value as empty string so it never stores the last
  // selected file, which breaks selecting the same file twice
  // in a row.
  return (
    <div className='position-relative'>
      <input
        type='file'
        className='position-absolute w-100 h-100'
        style={{ top: '0px', left: '0px', opacity: 0 }}
        value={''}
        onChange={onChange} />
      <Button color='secondary' size='sm' className='mb-2'>
        Add Attachment
      </Button>
    </div>
  );
}

interface Props extends ComponentViewProps<State, Msg> {
  disabled?: boolean;
}

export const view: View<Props> = ({ state, dispatch, disabled = false }) => {
  const onChange = (index: number): ChangeEventHandler<HTMLInputElement> => event => {
    dispatch({
      tag: 'change',
      value: {
        index,
        value: event.currentTarget.value
      }
    });
  };
  const onAdd = (file: File) => dispatch({ tag: 'add', value: file });
  const onRemove = (index: number) => () => dispatch({ tag: 'remove', value: index });
  const formFieldProps: FormFieldMulti.Props<HTMLInputElement, Value, File, void> = {
    state: state.formFieldMulti,
    disabled,
    AddButton,
    addButtonProps: { onAdd },
    Child,
    extraChildProps: undefined,
    onChange,
    onRemove
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
