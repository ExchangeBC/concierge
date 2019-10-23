import { ContentState, Editor, EditorState } from 'draft-js';
import { Component, ComponentView, Init, Update } from 'front-end/lib/framework';
import Link from 'front-end/lib/views/link';
import React from 'react';
import { ADT } from 'shared/lib/types';

export interface State {
  editor: EditorState;
};

export interface Params {
  text: string;
}

export type Msg
  = ADT<'onChangeEditor', EditorState>
  | ADT<'addImage'>;

export const init: Init<Params, State> = async ({ text }) => ({
  editor: EditorState.createWithContent(ContentState.createFromText(text))
});

export const update: Update<State, Msg> = ({ state, msg }) => {
    switch (msg.tag) {
      case 'onChangeEditor':
        return [state.set('editor', msg.value)];
      default:
        return [state];
    }
};

const Nav: ComponentView<State, Msg> = ({ dispatch }) => {
  return (
    <div>
      <Link onClick={() => dispatch({ tag: 'addImage', value: undefined })}>Image</Link>
    </div>
  );
};

export const view: ComponentView<State, Msg> = props => {
  const { state, dispatch } = props;
  return (
    <div>
      <Nav {...props} />
      <Editor
        editorState={state.editorState}
        onChange={value => dispatch({ tag: 'onChangeEditor', value })} />
    </div>
  );
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
