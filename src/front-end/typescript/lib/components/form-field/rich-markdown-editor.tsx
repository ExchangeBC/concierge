import { MARKDOWN_HELP_URL } from 'front-end/config';
import { makeStartLoading, makeStopLoading, UpdateState } from 'front-end/lib';
import * as FormField from 'front-end/lib/components/form-field';
import { Immutable, Init, Update, View, ViewElement } from 'front-end/lib/framework';
import { createFile } from 'front-end/lib/http/api';
import Icon, { AvailableIcons } from 'front-end/lib/views/icon';
import Link from 'front-end/lib/views/link';
import React, { ChangeEvent } from 'react';
import { Spinner } from 'reactstrap';
import { ADT } from 'shared/lib/types';

export type Value = string;

interface ChildState extends FormField.ChildStateBase<Value> {
  loading: number;
  selectionStart: number;
  selectionEnd: number;
}

export type State = FormField.State<Value, ChildState>;

export type Params = FormField.Params<Value>;

type ChildMsg
  = ADT<'onChangeTextArea', [string, number, number]> // [value, selectionStart, selectionEnd]
  | ADT<'onChangeSelection', [number, number]> // [selectionStart, selectionEnd]
  | ADT<'controlH1'>
  | ADT<'controlH2'>
  | ADT<'controlH3'>
  | ADT<'controlBold'>
  | ADT<'controlItalics'>
  | ADT<'controlOrderedList'>
  | ADT<'controlUnorderedList'>
  | ADT<'controlImage', File>
  | ADT<'focus'>;

export type Msg = FormField.Msg<ChildMsg>;

const childInit: Init<FormField.ChildParams<Value>, ChildState> = async ({ value, id }) => ({
  value,
  id,
  loading: 0,
  selectionStart: 0,
  selectionEnd: 0
});

const startLoading: UpdateState<ChildState> = makeStartLoading('loading');
const stopLoading: UpdateState<ChildState>  = makeStopLoading('loading');

function insert(state: Immutable<ChildState>, text: string): Immutable<ChildState> {
  return state.set('value', `${state.value.substring(0, state.selectionStart)}${text}${state.value.substring(state.selectionEnd)}`);
}

const childUpdate: Update<ChildState, ChildMsg> = ({ state, msg }) => {
  const hasSelectedMultipleCharacters = state.selectionStart !== state.selectionEnd;
  switch (msg.tag) {
    case 'onChangeTextArea':
      return [state
        .set('value', msg.value[0])
        .set('selectionStart', msg.value[1])
        .set('selectionEnd', msg.value[2])
      ];
    case 'onChangeSelection':
      return [state
        .set('selectionStart', msg.value[0])
        .set('selectionEnd', msg.value[1])
      ];
    case 'controlH1':
      // TODO better new line insertion depending on context of selection/cursor
      const h1Text = `${state.selectionStart === 0 ? '' : '\n\n'}# ${hasSelectedMultipleCharacters ? state.value.substring(state.selectionStart, state.selectionEnd) : ''}\n\n`;
      return [
        insert(state, h1Text)
          .set('selectionStart', state.selectionStart + (state.selectionStart === 0 ? 2 : 4))
          .set('selectionEnd', state.selectionEnd + (state.selectionStart === 0 ? 2 : 4)),
        async (state, dispatch) => {
          dispatch({ tag: 'focus', value: undefined });
          return null;
        }
      ];
    case 'controlH2':
    case 'controlH3':
    case 'controlBold':
    case 'controlItalics':
    case 'controlOrderedList':
    case 'controlUnorderedList':
      return [state];
    case 'controlImage':
      return [
        startLoading(state),
        async (state, dispatch) => {
          state = stopLoading(state);
          const file = await createFile({
            name: msg.value.name,
            file: msg.value
          });
          if (file.tag === 'invalid') { return state; }
          const imagePath = `![${msg.value.name}](/api/fileBlobs/${file.value._id})`;
          state = insert(state, imagePath)
            .set('selectionEnd', state.selectionStart + imagePath.length);
          dispatch({ tag: 'focus', value: undefined });
          return state;
        }
      ];
    case 'focus':
      return [
        state,
        async () => {
          const el = document.getElementById(state.id);
          if (el) { el.focus(); }
          return null;
        }
      ];
    default:
      return [state];
  }
};

interface ControlIconProps {
  name: AvailableIcons;
  disabled: boolean;
  children?: ViewElement;
  width?: number;
  height?: number;
  onClick?(): void;
}

const ControlIcon: View<ControlIconProps> = ({ name, disabled, onClick, children, width = 1.25, height = 1.25 }) => {
  return (
    <Link color={disabled ? 'secondary' : 'primary'} className='position-relative mr-2' disabled={disabled} onClick={onClick} style={{ lineHeight: 0, pointerEvents: disabled ? 'none' : undefined }}>
      <Icon name={name} width={width} height={height} />
      {children ? children : ''}
    </Link>
  );
};

const ControlSeparator: View<{}> = () => {
  return (<div className='mr-2'></div>);
};

const Controls: FormField.ChildView<Value, ChildState, ChildMsg> = ({ state, dispatch, disabled = false }) => {
  const isLoading = state.loading > 0;
  const isDisabled = disabled || isLoading;
  const onSelectFile = (event: ChangeEvent<HTMLInputElement>) => {
    if (isDisabled) { return; }
    const file = event.currentTarget.files && event.currentTarget.files[0];
    if (file) {
      dispatch({ tag: 'controlImage', value: file });
    }
  };
  return (
    <div className='bg-light flex-grow-0 flex-shrink-0 d-flex flex-nowrap align-items-center px-3 py-2 form-control border-0'>
      <ControlIcon
        name='h1'
        disabled={isDisabled}
        onClick={() => dispatch({ tag: 'controlH1', value: undefined })} />
      <ControlIcon
        name='h2'
        disabled={isDisabled}
        onClick={() => dispatch({ tag: 'controlH2', value: undefined })} />
      <ControlIcon
        name='h3'
        disabled={isDisabled}
        onClick={() => dispatch({ tag: 'controlH3', value: undefined })} />
      <ControlSeparator />
      <ControlIcon
        name='bold'
        disabled={isDisabled}
        width={0.85}
        height={0.85}
        onClick={() => dispatch({ tag: 'controlBold', value: undefined })} />
      <ControlIcon
        name='italics'
        width={0.85}
        height={0.85}
        disabled={isDisabled}
        onClick={() => dispatch({ tag: 'controlItalics', value: undefined })} />
      <ControlSeparator />
      <ControlIcon
        name='unordered-list'
        width={0.9}
        height={0.9}
        disabled={isDisabled}
        onClick={() => dispatch({ tag: 'controlUnorderedList', value: undefined })} />
      <ControlIcon
        name='ordered-list'
        width={0.9}
        height={0.9}
        disabled={isDisabled}
        onClick={() => dispatch({ tag: 'controlOrderedList', value: undefined })} />
      <ControlSeparator />
      <ControlIcon name='image' disabled={isDisabled} width={1.1} height={1.1}>
        <input
          type='file'
          className='position-absolute w-100 h-100'
          style={{ top: '0px', left: '0px', opacity: 0 }}
          value=''
          onChange={onSelectFile} />
      </ControlIcon>
      <div className='ml-auto'>
        <Spinner
          size='xs'
          color='secondary'
          className={`o-50 ${isLoading ? '' : 'd-none'}`} />
        <Link newTab href={MARKDOWN_HELP_URL} color='secondary' className='ml-2' >
          <Icon name='markdown' />
        </Link>
      </div>
    </div>
  );
};

const ChildView: FormField.ChildView<Value, ChildState, ChildMsg> = props => {
  const { state, dispatch, className = '', validityClassName, disabled = false } = props;
  const isLoading = state.loading > 0;
  const isDisabled = disabled || isLoading;
  const onChangeSelection = (target: EventTarget & HTMLTextAreaElement) => {
    if (isDisabled) { return; }
    const start = target.selectionStart;
    const end = target.selectionEnd;
    if (start !== state.selectionStart || end !== state.selectionEnd) {
      dispatch({ tag: 'onChangeSelection', value: [start, end] });
    }
  };
  return (
    <div className={`${className} ${validityClassName} form-control p-0 d-flex flex-column flex-nowrap align-items-stretch`}>
      <Controls {...props} />
      <textarea
        id={state.id}
        value={state.value}
        disabled={isDisabled}
        className={`${validityClassName} form-control flex-grow-1 border-left-0 border-right-0 border-bottom-0`}
        style={{
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0
        }}
        ref={ref => {
          const start = state.selectionStart;
          const end = state.selectionEnd;
          if (ref) {
            if (ref.selectionStart !== start) { ref.selectionStart = start; }
            if (ref.selectionEnd !== end) { ref.selectionEnd = end; }
          }
        }}
        onChange={e => {
          const value = e.currentTarget.value;
          dispatch({ tag: 'onChangeTextArea', value: [
            value,
            e.currentTarget.selectionStart,
            e.currentTarget.selectionEnd
          ]});
          // Let the parent form field component know that the value has been updated.
          props.onChange(value);
        }}
        onSelect={e => onChangeSelection(e.currentTarget)}>
      </textarea>
    </div>
  );
};

export const component = FormField.makeComponent({
  init: childInit,
  update: childUpdate,
  view: ChildView
});

export const init = component.init;

export const update = component.update;

export const view = component.view;

export default component;
