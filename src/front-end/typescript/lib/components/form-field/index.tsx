import { ComponentViewProps, Dispatch, immutable, Immutable, Init, mapComponentDispatch, Update, updateComponentChild, View, ViewElement, ViewElementChildren } from 'front-end/lib/framework';
import * as framework from 'front-end/lib/framework';
import Icon from 'front-end/lib/views/icon';
import React, { CSSProperties } from 'react';
import { Alert, FormGroup, FormText, Label } from 'reactstrap';
import { ADT } from 'shared/lib/types';
import { getInvalidValue, getValidValue, Validation } from 'shared/lib/validators';

export interface HasValue<Value> {
  value: Value;
}

interface ChildProps<Value, ChildState extends HasValue<Value>, ChildMsg> {
  id: string;
  state: Immutable<ChildState>;
  className?: string;
  disabled?: boolean;
  dispatch: Dispatch<ChildMsg>;
}

export type ChildView<Value, ChildState extends HasValue<Value>, ChildMsg> = View<ChildProps<Value, ChildState, ChildMsg>>;

type ChildComponent<Value, ChildState extends HasValue<Value>, ChildMsg> = framework.Component<Value, ChildState, ChildMsg, ChildProps<Value, ChildState, ChildMsg>>;

export interface State<Value, ChildState extends HasValue<Value>> {
  id: string;
  errors: string[];
  showHelp: boolean;
  child: Immutable<ChildState>;
}

export interface Params<Value> {
  id: string;
  value: Value;
  errors: string[];
}

export type Msg<ChildMsg>
  = ADT<'toggleHelp'>
  | ADT<'child', ChildMsg>;

function makeInit<Value, ChildState extends HasValue<Value>, ChildMsg>(childInit: ChildComponent<Value, ChildState, ChildMsg>['init']): Init<Params<Value>, State<Value, ChildState>> {
  return async params => ({
    id: params.id,
    errors: params.errors,
    showHelp: false,
    child: immutable(await childInit(params.value))
  });
};

function makeUpdate<Value, ChildState extends HasValue<Value>, ChildMsg>(childUpdate: ChildComponent<Value, ChildState, ChildMsg>['update']): Update<State<Value, ChildState>, Msg<ChildMsg>> {
  return ({ state, msg }) => {
    switch (msg.tag) {
      case 'toggleHelp':
        return [
          state.update('showHelp', v => !v)
        ];
      case 'child':
        return updateComponentChild({
          state,
          mapChildMsg: value => ({ tag: 'child', value }),
          childStatePath: ['child'],
          childUpdate,
          childMsg: msg.value
        });
      default:
        return [state];
    }
  };
};

interface ViewProps<Value, ChildState extends HasValue<Value>, ChildMsg> extends ComponentViewProps<State<Value, ChildState>, Msg<ChildMsg>> {
  className?: string;
  labelClassName?: string;
  style?: CSSProperties;
  required?: boolean;
  disabled?: boolean;
  label?: string;
  help?: ViewElementChildren;
}

function ConditionalHelpToggle<Value, ChildState extends HasValue<Value>, ChildMsg>(props: ViewProps<Value, ChildState, ChildMsg>): ViewElement<ViewProps<Value, ChildState, ChildMsg>> {
  const { dispatch, disabled, help } = props;
  if (help && !disabled) {
    return (
      <Icon
        name='question-circle'
        color='secondary'
        width={1}
        height={1}
        className='mt-n1 ml-2 text-hover-dark flex-shrink-0 d-inline'
        style={{ cursor: 'pointer' }}
        onClick={e => {
          dispatch({ tag: 'toggleHelp', value: undefined });
          e.preventDefault();
        }} />
    );
  } else {
    return null;
  }
};

function ConditionalLabel<Value, ChildState extends HasValue<Value>, ChildMsg>(props: ViewProps<Value, ChildState, ChildMsg>): ViewElement<ViewProps<Value, ChildState, ChildMsg>> {
  const { state, label, required, labelClassName } = props;
  const className = `${required ? 'font-weight-bold' : ''} ${labelClassName || ''}`;
  if (label) {
    return (
      <Label for={state.id} className={className}>
        <span>
          {label}
          {required ? (<span className='text-info ml-1'>*</span>) : null}
          <ConditionalHelpToggle {...props} />
        </span>
      </Label>
    );
  } else {
    return null;
  }
};

function ConditionalHelp<Value, ChildState extends HasValue<Value>, ChildMsg>(props: ViewProps<Value, ChildState, ChildMsg>): ViewElement<ViewProps<Value, ChildState, ChildMsg>> {
  const { state, help, disabled } = props;
  if (help && state.showHelp && !disabled) {
    return (
      <Alert color='info' style={{ whiteSpace: 'pre-line' }}>
        {help}
      </Alert>
    );
  } else {
    return null;
  }
}

function ConditionalErrors<Value, ChildState extends HasValue<Value>, ChildMsg>(props: ViewProps<Value, ChildState, ChildMsg>): ViewElement<ViewProps<Value, ChildState, ChildMsg>> {
  const { state } = props;
  if (state.errors.length) {
    const errorElements = state.errors.map((error, i) => {
      return (<div key={`form-field-conditional-errors-${i}`}>{error}</div>);
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

function makeView<Value, ChildState extends HasValue<Value>, ChildMsg>(ChildView: ChildComponent<Value, ChildState, ChildMsg>['view']): View<ViewProps<Value, ChildState, ChildMsg>> {
  return props => {
    const { state, dispatch } = props;
    const invalid = !!state.errors.length;
    const childClassName = invalid ? 'is-invalid' : '';
    return (
      <FormGroup className={`form-field-${state.id} ${props.className || ''}`}>
        <ConditionalLabel {...props} />
        <ConditionalHelp {...props} />
        <ChildView
          id={state.id}
          state={state.child}
          className={childClassName}
          disabled={props.disabled}
          dispatch={mapComponentDispatch(dispatch, value => ({ tag: 'child', value }))} />
        <ConditionalErrors {...props} />
      </FormGroup>
    );
  };
};

export type Component<Value, ChildState extends HasValue<Value>, ChildMsg> = framework.Component<Params<Value>, State<Value, ChildState>, Msg<ChildMsg>, ViewProps<Value, ChildState, ChildMsg>>;

export function makeComponent<Value, ChildState extends HasValue<Value>, ChildMsg>(params: ChildComponent<Value, ChildState, ChildMsg>): Component<Value, ChildState, ChildMsg> {
  return {
    init: makeInit(params.init),
    update: makeUpdate(params.update),
    view: makeView(params.view)
  };
}

export function getValue<Value, ChildState extends HasValue<Value>>(state: State<Value, ChildState>): Value {
  return state.child.value;
}

export function setValue<Value, ChildState extends HasValue<Value>>(state: Immutable<State<Value, ChildState>>, value: Value): Immutable<State<Value, ChildState>> {
  return state.setIn(['child', 'value'], value);
}

// TODO refactor the functions below this comment

export function validateAndUpdateField<State>(state: Immutable<State>, key: keyof State, value: string, validate: (value: string) => Validation<string>): Immutable<State> {
  const validation = validate(value);
  return state
    .setIn([key, 'value'], value)
    .setIn([key, 'errors'], getInvalidValue(validation, []));
}

export function updateField<State>(state: Immutable<State>, key: keyof State, value: string): Immutable<State> {
  return state.setIn([key, 'value'], value);
}

export function validateField<State>(state: Immutable<State>, key: keyof State, validate: (value: string) => Validation<string>): Immutable<State> {
  const value = state.getIn([key, 'value']) || '';
  const validation = validate(value);
  return state
    .setIn([key, 'value'], getValidValue(validation, value))
    .setIn([key, 'errors'], getInvalidValue(validation, []));
}
