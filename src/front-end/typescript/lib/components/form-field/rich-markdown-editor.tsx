import { makeStartLoading, makeStopLoading, UpdateState } from 'front-end/lib';
import * as FormField from 'front-end/lib/components/form-field';
import { Init, Update } from 'front-end/lib/framework';
import { createFile } from 'front-end/lib/http/api';
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
  | ADT<'insertImage', File>
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

const childUpdate: Update<ChildState, ChildMsg> = ({ state, msg }) => {
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
    case 'insertImage':
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
          state = state
            .set('value', `${state.value.substring(0, state.selectionStart)}${imagePath}${state.value.substring(state.selectionEnd)}`)
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

const Controls: FormField.ChildView<Value, ChildState, ChildMsg> = ({ state, dispatch, disabled = false }) => {
  const isLoading = state.loading > 0;
  const isDisabled = disabled || isLoading;
  const onSelectFile = (event: ChangeEvent<HTMLInputElement>) => {
    if (isDisabled) { return; }
    const file = event.currentTarget.files && event.currentTarget.files[0];
    if (file) {
      dispatch({ tag: 'insertImage', value: file });
    }
  };
  return (
    <div className='bg-light flex-grow-0 flex-shrink-0 d-flex flex-nowrap align-items-center px-3 py-2 form-control' style={{ borderBottom: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, pointerEvents: isDisabled ? 'none' : undefined }}>
      <Link className='position-relative' color='primary' disabled={isDisabled}>
        Insert Image
        <input
          type='file'
          className='position-absolute w-100 h-100'
          style={{ top: '0px', left: '0px', opacity: 0 }}
          value=''
          onChange={onSelectFile} />
      </Link>
    <Spinner
      size='xs'
      color='secondary'
      className={`o-50 ml-auto ${isLoading ? '' : 'd-none'}`} />
    </div>
  );
};

const ChildView: FormField.ChildView<Value, ChildState, ChildMsg> = props => {
  const { state, dispatch, className = '', disabled = false } = props;
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
    <div className={`${className} d-flex flex-column flex-nowrap align-items-stretch`}>
      <Controls {...props} />
      <textarea
        id={state.id}
        value={state.value}
        disabled={isDisabled}
        className='form-control flex-grow-1'
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
