import { MARKDOWN_HELP_URL } from 'front-end/config';
import { makeStartLoading, makeStopLoading, UpdateState } from 'front-end/lib';
import * as FormField from 'front-end/lib/components/form-field';
import { Immutable, Init, Update, UpdateReturnValue, View, ViewElement } from 'front-end/lib/framework';
import { createFile } from 'front-end/lib/http/api';
import Icon, { AvailableIcons } from 'front-end/lib/views/icon';
import Link from 'front-end/lib/views/link';
import React, { ChangeEvent } from 'react';
import { Spinner } from 'reactstrap';
import { ADT } from 'shared/lib/types';

export type Value = string;

type Snapshot = [string, number, number]; // [value, selectionStart, selectionEnd]

type StackEntry = ADT<'single', Snapshot> | ADT<'batch', Snapshot>;

type Stack = StackEntry[];

function emptyStack(): Stack {
  return [];
}

function isStackEmpty(stack: Stack): boolean {
  return !stack.length;
}

interface ChildState extends FormField.ChildStateBase<Value> {
  currentStackEntry: StackEntry | null; // When in the middle of undoing/redoing to ensure continuity in UX.
  undo: Stack;
  redo: Stack;
  loading: number;
  selectionStart: number;
  selectionEnd: number;
}

export type State = FormField.State<Value, ChildState>;

export type Params = FormField.Params<Value>;

type InnerChildMsg =
  | ADT<'onChangeTextArea', Snapshot>
  | ADT<'onChangeSelection', [number, number]> // [selectionStart, selectionEnd]
  | ADT<'controlUndo'>
  | ADT<'controlRedo'>
  | ADT<'controlH1'>
  | ADT<'controlH2'>
  | ADT<'controlH3'>
  | ADT<'controlBold'>
  | ADT<'controlItalics'>
  | ADT<'controlOrderedList'>
  | ADT<'controlUnorderedList'>
  | ADT<'controlImage', File>
  | ADT<'focus'>;

export type Msg = FormField.Msg<InnerChildMsg>;

const childInit: Init<FormField.ChildParams<Value>, ChildState> = async (params) => ({
  ...params,
  currentStackEntry: null,
  undo: emptyStack(),
  redo: emptyStack(),
  loading: 0,
  selectionStart: 0,
  selectionEnd: 0
});

const startLoading: UpdateState<ChildState> = makeStartLoading('loading');
const stopLoading: UpdateState<ChildState> = makeStopLoading('loading');

interface InsertParams {
  separateLine?: boolean;
  text(selectedText: string): string;
}

function insert(state: Immutable<ChildState>, params: InsertParams): UpdateReturnValue<ChildState, FormField.ChildMsg<InnerChildMsg>> {
  const { text, separateLine = false } = params;
  const selectedText = state.value.substring(state.selectionStart, state.selectionEnd);
  const body = text(selectedText);
  let prefix = state.value.substring(0, state.selectionStart);
  if (prefix !== '' && separateLine) {
    prefix = prefix.replace(/\n?\n?$/, '\n\n');
  }
  let suffix = state.value.substring(state.selectionEnd);
  if (suffix !== '' && separateLine) {
    suffix = suffix.replace(/^\n?\n?/, '\n\n');
  }
  state = pushStack(state, 'undo', getStackEntry(state));
  state = resetRedoStack(state);
  state = setSnapshot(state, [`${prefix}${body}${suffix}`, prefix.length, prefix.length + body.length]);
  return [
    state,
    async (state, dispatch) => {
      dispatch({ tag: '@validate', value: undefined });
      dispatch({ tag: 'focus', value: undefined });
      return null;
    }
  ];
}

function getSnapshot(state: Immutable<ChildState>): Snapshot {
  return [state.value, state.selectionStart, state.selectionEnd];
}

function setSnapshot(state: Immutable<ChildState>, snapshot: Snapshot): Immutable<ChildState> {
  return state.set('value', snapshot[0]).set('selectionStart', snapshot[1]).set('selectionEnd', snapshot[2]);
}

function getStackEntry(state: Immutable<ChildState>): StackEntry {
  return state.currentStackEntry || { tag: 'single', value: getSnapshot(state) };
}

function setStackEntry(state: Immutable<ChildState>, entry: StackEntry): Immutable<ChildState> {
  return setSnapshot(state, entry.value).set('currentStackEntry', entry);
}

function resetRedoStack(state: Immutable<ChildState>): Immutable<ChildState> {
  return state.set('redo', emptyStack()).set('currentStackEntry', null);
}

const MAX_STACK_ENTRIES = 50;
const STACK_BATCH_SIZE = 5;

function pushStack(state: Immutable<ChildState>, k: 'undo' | 'redo', entry: StackEntry): Immutable<ChildState> {
  return state.update(k, (stack) => {
    const addAsNewest = () => [entry, ...stack.slice(0, MAX_STACK_ENTRIES - 1)];
    // If stack is smaller than batch size, or are adding a batch, simply add the entry.
    if (stack.length < STACK_BATCH_SIZE || entry.tag === 'batch') {
      return addAsNewest();
    }
    // If newest entries are batches, simply add the entry.
    for (let i = 0; i < STACK_BATCH_SIZE; i++) {
      if (stack[i].tag === 'batch') {
        return addAsNewest();
      }
    }
    // Otherwise, the newest (single) entries need to be batched.
    return [
      entry,
      { tag: 'batch', value: stack[STACK_BATCH_SIZE - 1].value }, // convert single entry to batch
      ...stack.slice(STACK_BATCH_SIZE, MAX_STACK_ENTRIES - 2)
    ];
  });
}

function popStack(state: Immutable<ChildState>, k: 'undo' | 'redo'): [StackEntry | undefined, Immutable<ChildState>] {
  const stack = state.get(k);
  if (!stack.length) {
    return [undefined, state];
  }
  const [entry, ...rest] = stack;
  return [entry, state.set(k, rest)];
}

const childUpdate: Update<ChildState, FormField.ChildMsg<InnerChildMsg>> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'onChangeTextArea':
      state = pushStack(state, 'undo', getStackEntry(state));
      state = resetRedoStack(state);
      return [setSnapshot(state, msg.value)];
    case 'onChangeSelection':
      return [state.set('selectionStart', msg.value[0]).set('selectionEnd', msg.value[1])];
    case 'controlUndo': {
      let entry;
      [entry, state] = popStack(state, 'undo');
      if (!entry) {
        return [state];
      }
      state = pushStack(state, 'redo', getStackEntry(state));
      state = setStackEntry(state, entry);
      return [state];
    }
    case 'controlRedo': {
      let entry;
      [entry, state] = popStack(state, 'redo');
      if (!entry) {
        return [state];
      }
      state = pushStack(state, 'undo', getStackEntry(state));
      state = setStackEntry(state, entry);
      return [state];
    }
    case 'controlH1':
      return insert(state, {
        text: (selectedText) => `# ${selectedText}`,
        separateLine: true
      });
    case 'controlH2':
      return insert(state, {
        text: (selectedText) => `## ${selectedText}`,
        separateLine: true
      });
    case 'controlH3':
      return insert(state, {
        text: (selectedText) => `### ${selectedText}`,
        separateLine: true
      });
    case 'controlBold':
      return insert(state, {
        text: (selectedText) => `**${selectedText}**`
      });
    case 'controlItalics':
      return insert(state, {
        text: (selectedText) => `*${selectedText}*`
      });
    case 'controlOrderedList':
      return insert(state, {
        text: (selectedText) => `1. ${selectedText}`,
        separateLine: true
      });
    case 'controlUnorderedList':
      return insert(state, {
        text: (selectedText) => `- ${selectedText}`,
        separateLine: true
      });
    case 'controlImage':
      return [
        startLoading(state),
        async (state, dispatch) => {
          state = stopLoading(state);
          const file = await createFile({
            name: msg.value.name,
            file: msg.value
          });
          if (file.tag === 'invalid') {
            return state;
          }
          const result = insert(state, {
            text: () => `![${msg.value.name}](/api/fileBlobs/${file.value._id})`
          });
          state = result[0];
          if (result[1]) {
            await result[1](state, dispatch);
          }
          return state;
        }
      ];
    case 'focus':
      return [
        state,
        async () => {
          const el = document.getElementById(state.id);
          if (el) {
            el.focus();
          }
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
  className?: string;
  onClick?(): void;
}

const ControlIcon: View<ControlIconProps> = ({ name, disabled, onClick, children, width = 1.25, height = 1.25, className = '' }) => {
  return (
    <Link color="secondary" className={`${className} d-flex justify-content-center align-items-center position-relative`} disabled={disabled} onClick={onClick} style={{ cursor: 'default', lineHeight: 0, pointerEvents: disabled ? 'none' : undefined }}>
      <Icon name={name} width={width} height={height} />
      {children ? children : ''}
    </Link>
  );
};

const ControlSeparator: View<{}> = () => {
  return <div className="mr-3 border-left h-100"></div>;
};

const Controls: FormField.ChildView<Value, ChildState, InnerChildMsg> = ({ state, dispatch, disabled = false }) => {
  const isLoading = state.loading > 0;
  const isDisabled = disabled || isLoading;
  const onSelectFile = (event: ChangeEvent<HTMLInputElement>) => {
    if (isDisabled) {
      return;
    }
    const file = event.currentTarget.files && event.currentTarget.files[0];
    if (file) {
      dispatch({ tag: 'controlImage', value: file });
    }
  };
  return (
    <div className="bg-light flex-grow-0 flex-shrink-0 d-flex flex-nowrap align-items-center px-3 py-2 form-control border-0">
      <ControlIcon name="undo" width={0.9} height={0.9} disabled={isDisabled || isStackEmpty(state.undo)} className="mr-2" onClick={() => dispatch({ tag: 'controlUndo', value: undefined })} />
      <ControlIcon name="redo" width={0.9} height={0.9} disabled={isDisabled || isStackEmpty(state.redo)} className="mr-3" onClick={() => dispatch({ tag: 'controlRedo', value: undefined })} />
      <ControlSeparator />
      <ControlIcon name="h1" disabled={isDisabled} className="mr-2" onClick={() => dispatch({ tag: 'controlH1', value: undefined })} />
      <ControlIcon name="h2" disabled={isDisabled} className="mr-2" onClick={() => dispatch({ tag: 'controlH2', value: undefined })} />
      <ControlIcon name="h3" disabled={isDisabled} className="mr-3" onClick={() => dispatch({ tag: 'controlH3', value: undefined })} />
      <ControlSeparator />
      <ControlIcon name="bold" disabled={isDisabled} width={0.9} height={0.9} className="mr-2" onClick={() => dispatch({ tag: 'controlBold', value: undefined })} />
      <ControlIcon name="italics" width={0.9} height={0.9} disabled={isDisabled} className="mr-3" onClick={() => dispatch({ tag: 'controlItalics', value: undefined })} />
      <ControlSeparator />
      <ControlIcon name="unordered-list" width={1} height={1} disabled={isDisabled} className="mr-2" onClick={() => dispatch({ tag: 'controlUnorderedList', value: undefined })} />
      <ControlIcon name="ordered-list" width={1} height={1} disabled={isDisabled} className="mr-3" onClick={() => dispatch({ tag: 'controlOrderedList', value: undefined })} />
      <ControlSeparator />
      <ControlIcon name="image" disabled={isDisabled} width={1.1} height={1.1}>
        <input type="file" className="position-absolute w-100 h-100" style={{ top: '0px', left: '0px', opacity: 0 }} value="" onChange={onSelectFile} />
      </ControlIcon>
      <div className="ml-auto d-flex flex-nowrap align-items-center">
        <Spinner size="xs" color="secondary" className={`o-50 ${isLoading ? '' : 'd-none'}`} />
        <Link newTab href={MARKDOWN_HELP_URL} color="primary" className="d-flex justify-content-center align-items-center ml-2" style={{ lineHeight: 0 }}>
          <Icon name="markdown" />
        </Link>
      </div>
    </div>
  );
};

const ChildView: FormField.ChildView<Value, ChildState, InnerChildMsg> = (props) => {
  const { state, dispatch, placeholder, className = '', validityClassName, disabled = false } = props;
  const isLoading = state.loading > 0;
  const isDisabled = disabled || isLoading;
  const onChangeSelection = (target: EventTarget & HTMLTextAreaElement) => {
    if (isDisabled) {
      return;
    }
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
        placeholder={placeholder}
        className={`${validityClassName} form-control flex-grow-1 border-left-0 border-right-0 border-bottom-0`}
        style={{
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0
        }}
        ref={(ref) => {
          const start = state.selectionStart;
          const end = state.selectionEnd;
          if (ref) {
            if (ref.selectionStart !== start) {
              ref.selectionStart = start;
            }
            if (ref.selectionEnd !== end) {
              ref.selectionEnd = end;
            }
          }
        }}
        onChange={(e) => {
          const value = e.currentTarget.value;
          dispatch({ tag: 'onChangeTextArea', value: [value, e.currentTarget.selectionStart, e.currentTarget.selectionEnd] });
          // Let the parent form field component know that the value has been updated.
          props.onChange(value);
        }}
        onKeyDown={(e) => {
          const isModifier = e.ctrlKey || e.metaKey;
          const isUndo = isModifier && !e.shiftKey && e.keyCode === 90; //Ctrl-Z or Cmd-Z
          const isRedo = isModifier && ((e.shiftKey && e.keyCode === 90) || e.keyCode === 89); //Ctrl-Shift-Z, Cmd-Shift-Z, Ctrl-Y or Cmd-Y
          const run = (msg: InnerChildMsg) => {
            e.preventDefault();
            dispatch(msg);
          };
          if (isUndo) {
            run({ tag: 'controlUndo', value: undefined });
          } else if (isRedo) {
            run({ tag: 'controlRedo', value: undefined });
          }
        }}
        onSelect={(e) => onChangeSelection(e.currentTarget)}
      ></textarea>
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
