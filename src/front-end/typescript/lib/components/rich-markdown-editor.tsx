import { Component, ComponentView, Init, Update } from 'front-end/lib/framework';
import Icon from 'front-end/lib/views/icon';
import React from 'react';
import { ADT } from 'shared/lib/types';

export interface State {
  id: string;
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

export interface Params {
  id: string;
  value: string;
}

export type Msg
  = ADT<'onChangeTextArea', [string, number, number]> // [value, selectionStart, selectionEnd]
  | ADT<'onChangeSelection', [number, number]> // [selectionStart, selectionEnd]
  | ADT<'insertImage'>;

export const init: Init<Params, State> = async ({ id, value }) => ({
  id,
  value,
  selectionStart: 0,
  selectionEnd: 0
});

export const update: Update<State, Msg> = ({ state, msg }) => {
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
        state
          .set('value', `${state.value.substring(0, state.selectionStart)}HELLO${state.value.substring(state.selectionEnd)}`)
          .set('selectionEnd', state.selectionStart + 5),
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

export const view: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const onChangeSelection = (target: EventTarget & HTMLTextAreaElement) => {
    const start = target.selectionStart;
    const end = target.selectionEnd;
    if (start !== state.selectionStart || end !== state.selectionEnd) {
      dispatch({ tag: 'onChangeSelection', value: [start, end] });
    }
  };
  return (
    <div>
      <div className='d-flex flex-nowrap p-2 text-primary'>
        <a className='d-flex flex-nowrap align-items-center' onClick={() => dispatch({ tag: 'insertImage', value: undefined })}>
          <Icon name='image' width={1} height={1} className='mr-1'/>
          Insert Image
        </a>
      </div>
      <textarea
        id={state.id}
        value={state.value}
        ref={ref => {
          const start = state.selectionStart;
          const end = state.selectionEnd;
          if (ref) {
            if (ref.selectionStart !== start) { ref.selectionStart = start; }
            if (ref.selectionEnd !== end) { ref.selectionEnd = end; }
          }
        }}
        onChange={e => {
          dispatch({ tag: 'onChangeTextArea', value: [
            e.currentTarget.value,
            e.currentTarget.selectionStart,
            e.currentTarget.selectionEnd
          ]});
        }}
        onSelect={e => onChangeSelection(e.currentTarget)}>
      </textarea>
    </div>
  );
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};

export default component;
