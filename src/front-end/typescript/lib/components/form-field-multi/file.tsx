import { Route } from 'front-end/lib/app/types';
import * as FormFieldMulti from 'front-end/lib/components/form-field-multi/lib';
import { Component, ComponentViewProps, GlobalComponentMsg, immutable, Immutable, Init, Update, View } from 'front-end/lib/framework';
import * as Input from 'front-end/lib/views/form-field/lib/input';
import Icon from 'front-end/lib/views/icon';
import Link from 'front-end/lib/views/link';
import { ChangeEvent, default as React } from 'react';
import { Button } from 'reactstrap';
import { bytesToMegabytes } from 'shared/lib';
import { MAX_MULTIPART_FILES_SIZE } from 'shared/lib/resources/file';
import { PublicFile } from 'shared/lib/resources/file';
import { makeFileBlobPath } from 'shared/lib/resources/file-blob';
import { ADT, Omit } from 'shared/lib/types';
import { invalid, valid, Validation } from 'shared/lib/validators';
import { validateFileName } from 'shared/lib/validators/file';

export interface NewFile {
  file: File;
  name: string;
  size: number;
}

export type Value = ADT<'existing', PublicFile> | ADT<'new', NewFile>;

export function makeExistingValue(value: PublicFile): ADT<'existing', PublicFile> {
  return {
    tag: 'existing',
    value
  };
}

export function makeNewValue(value: NewFile): ADT<'new', NewFile> {
  return {
    tag: 'new',
    value
  };
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
  return values.map((value) => {
    if (value.tag === 'new') {
      const { file, name } = value.value;
      const originalExtension = getFileExtension(file.name);
      return makeNewValue({
        ...value.value,
        // Help the user by appending the original file extension if they
        // overrode the attachment name.
        // If no overridden name is provided, use the original file name.
        name: name ? name.replace(new RegExp(`(${originalExtension})?$`), originalExtension) : file.name
      });
    } else {
      return value;
    }
  });
}

export function setValues(state: Immutable<State>, values: Value[]): Immutable<State> {
  return state.set('formFieldMulti', FormFieldMulti.setFieldValues(state.formFieldMulti, values));
}

export function setErrors(state: Immutable<State>, errors: string[][]): Immutable<State> {
  return state.set('formFieldMulti', FormFieldMulti.setFieldErrors(state.formFieldMulti, errors));
}

export function isValid(state: Immutable<State>): boolean {
  return FormFieldMulti.isValid(state.formFieldMulti);
}

type InnerMsg = ADT<'add', File> | ADT<'remove', number> | ADT<'change', { index: number; value: Value }> | ADT<'validate', number>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

export interface Params extends Omit<State, 'formFieldMulti'> {
  formFieldMulti: FormFieldMulti.State<Value>;
}

export const init: Init<Params, State> = async (params) => {
  return {
    formFieldMulti: immutable(params.formFieldMulti)
  };
};

function validateValue(value: Value): Validation<Value> {
  if (value.tag === 'existing') {
    return valid(value);
  }
  let errors: string[] = [];
  const validatedName = validateFileName(value.value.name || value.value.file.name);
  if (validatedName.tag === 'invalid') {
    errors = errors.concat(validatedName.value);
  }
  if (value.value.size > MAX_MULTIPART_FILES_SIZE) {
    errors.push(`Please remove this file, and select one less than ${bytesToMegabytes(MAX_MULTIPART_FILES_SIZE)} MB in size.`);
  }
  return invalid(errors);
}

export const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'add':
      const file = msg.value;
      const value: Value = makeNewValue({
        file,
        // The file name's input placeholder will show the original file name.
        name: '',
        size: file.size
      });
      const validatedValue = validateValue(value);
      let errors: string[] = [];
      if (validatedValue.tag === 'invalid') {
        errors = validatedValue.value;
      }
      let addFields = state.formFieldMulti.fields;
      addFields = addFields.concat(FormFieldMulti.makeField(value, errors));
      return [state.setIn(['formFieldMulti', 'fields'], addFields)];
    case 'remove':
      let removeFields = state.formFieldMulti.fields;
      removeFields = removeFields.filter((field, i) => i !== msg.value);
      return [state.setIn(['formFieldMulti', 'fields'], removeFields)];
    case 'change':
      const changeFields = state.formFieldMulti.fields.map((field, i) => {
        if (i === msg.value.index && field.value.tag === 'new') {
          field.value = msg.value.value;
        }
        return field;
      });
      return [state.setIn(['formFieldMulti', 'fields'], changeFields)];
    case 'validate':
      const validatedFields = state.formFieldMulti.fields.map((field, i) => {
        if (i === msg.value && field.value.tag === 'new') {
          const validatedValue = validateValue(field.value);
          if (validatedValue.tag === 'invalid') {
            field.errors = validatedValue.value;
          }
        }
        return field;
      });
      return [state.setIn(['formFieldMulti', 'fields'], validatedFields)];
    default:
      return [state];
  }
};

interface ExtraChildProps {
  onChangeDebounced(index: number): void;
}

const Child: View<FormFieldMulti.ChildProps<ExtraChildProps, Value>> = (props) => {
  const { id, index, className, field, onChange, extraProps, disabled = false } = props;
  const value = field.value.tag === 'new' ? field.value.value.name : field.value.value.originalName;
  const placeholder = field.value.tag === 'new' ? field.value.value.file.name : field.value.value.originalName;
  return (
    <div className="d-flex align-items-center">
      <Input.View
        id={id}
        type="text"
        className={`${className} form-control`}
        value={value}
        placeholder={placeholder}
        disabled={field.value.tag === 'existing' || disabled}
        onChange={(event) =>
          field.value.tag === 'new' &&
          onChange({
            tag: 'new',
            value: {
              ...field.value.value,
              name: event.currentTarget.value
            }
          })
        }
        onChangeDebounced={() => extraProps && extraProps.onChangeDebounced(index)}
      />
      {field.value.tag === 'existing' ? (
        <Link download href={makeFileBlobPath(field.value.value._id)} className="d-flex align-items-center">
          <Icon name="download" width={1} height={1} className="ml-3 flex-shrink-0" />
        </Link>
      ) : null}
      <FormFieldMulti.ConditionalRemoveButton {...props} />
      {field.value.tag !== 'existing' ? <div className="ml-3 flex-shrink-0" style={{ width: '1rem', height: '1rem' }}></div> : null}
    </div>
  );
};

export function AddButton(props: FormFieldMulti.AddButtonProps<File>) {
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
    <div className="position-relative">
      <input type="file" className="position-absolute w-100 h-100" style={{ top: '0px', left: '0px', opacity: 0 }} value="" onChange={onChange} />
      <Button color="info" size="sm">
        {props.text || 'Add Attachment'}
      </Button>
    </div>
  );
}

interface Props extends ComponentViewProps<State, Msg> {
  disabled?: boolean;
  labelClassName?: string;
  labelWrapperClassName?: string;
  formGroupClassName?: string;
  className?: string;
}

export const view: View<Props> = ({ state, dispatch, disabled = false, labelClassName, labelWrapperClassName, formGroupClassName, className }) => {
  const onChange =
    (index: number): FormFieldMulti.OnChange<Value> =>
    (value) => {
      dispatch({
        tag: 'change',
        value: { index, value }
      });
    };
  const onAdd = (file: File) => dispatch({ tag: 'add', value: file });
  const onRemove = (index: number) => () => dispatch({ tag: 'remove', value: index });
  const formFieldProps: FormFieldMulti.Props<File, ExtraChildProps, Value> = {
    state: state.formFieldMulti,
    disabled,
    AddButton,
    addButtonProps: { onAdd },
    Child,
    extraChildProps: {
      onChangeDebounced(index) {
        dispatch({
          tag: 'validate',
          value: index
        });
      }
    },
    onChange,
    onRemove,
    labelClassName,
    labelWrapperClassName,
    formGroupClassName,
    className
  };
  return <FormFieldMulti.view {...formFieldProps} />;
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
