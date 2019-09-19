import { makeStartLoading, makeStopLoading, UpdateState } from 'front-end/lib';
import * as Table from 'front-end/lib/components/table';
import { Component, ComponentView, Dispatch, immutable, Immutable, Init, mapComponentDispatch, Update, updateComponentChild } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import { getLogItemTypeDropdownItems, getLogItemTypeNonSystemDropdownItems } from 'front-end/lib/pages/vendor-idea/lib';
import { LogItemTypeFull } from 'front-end/lib/pages/vendor-idea/views/log-item-type-badge';
import LogItemTypeSelectGroupLabel from 'front-end/lib/pages/vendor-idea/views/log-item-type-select-group-label';
import * as LongText from 'front-end/lib/views/form-field/long-text';
import * as Select from 'front-end/lib/views/form-field/select';
import * as ShortText from 'front-end/lib/views/form-field/short-text';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import { get } from 'lodash';
import React from 'react';
import { Col, Row } from 'reactstrap';
import { compareDates, formatTime, rawFormatDate } from 'shared/lib';
import { CreateValidationErrors, PublicLogItem } from 'shared/lib/resources/vendor-idea/log-item';
import { ADT, profileToName } from 'shared/lib/types';
import { getInvalidValue, mapValid, Validation } from 'shared/lib/validators';
import { validateLogItemNote } from 'shared/lib/validators/vendor-idea/log-item';

const tableHeadCells: Table.THSpec[] = [
  {
    children: 'Entry Type',
    style: {
      width: '30%'
    }
  },
  {
    children: 'Comments/Notes',
    style: {
      minWidth: '300px',
      width: '50%'
    }
  },
  {
    children: 'Published',
    style: {
      width: '20%'
    }
  }
];

function tableBodyRows(logItems: LogItem[], dispatch: Dispatch<Msg>): Table.RowsSpec {
  const className = (center?: boolean, wrap?: boolean) => `align-top ${center ? 'text-center' : ''} ${wrap ? 'text-wrap' : ''}`;
  return logItems.map(li => {
    return [
      {
        children: (<LogItemTypeFull logItemType={li.type} />),
        className: className(false, true)
      },
      {
        children: li.note || '-',
        className: className(false, true)
      },
      {
        children: (
          <div>
            <div>{rawFormatDate(li.createdAt, 'YYYY-MM-DD', false)}</div>
            <div>{formatTime(li.createdAt, true)}</div>
            <div className='small text-uppercase text-secondary'>{li.createdByName}</div>
          </div>
        ),
        className: className()
      }
    ];
  });
}

export interface Params {
  viId: string;
  logItems: PublicLogItem[];
}

export type Msg
  = ADT<'onChangeNewLogItemType', Select.Value>
  | ADT<'onChangeNewLogItemNote', string>
  | ADT<'onChangeLogItemTypeFilter', Select.Value>
  | ADT<'onChangeSearchFilter', string>
  | ADT<'table', Table.Msg>
  | ADT<'cancel'>
  | ADT<'submit'>;

interface LogItem extends PublicLogItem {
  createdByName: string;
}

export interface State {
  viId: string;
  logItems: LogItem[];
  visibleLogItems: LogItem[];
  submitLoading: number;
  newLogItemType: Select.State;
  newLogItemNote: LongText.State;
  logItemTypeFilter: Select.State;
  searchFilter: ShortText.State;
  table: Immutable<Table.State>;
}

type FormFieldKeys
  = 'newLogItemType'
  | 'newLogItemNote'
  | 'logItemTypeFilter'
  | 'searchFilter';

type QueryKeys
  = 'logItemTypeFilter'
  | 'searchFilter';

function cleanUpLogItems(logItems: PublicLogItem[]): LogItem[] {
  return logItems
    .map(li => ({ ...li, createdByName: li.createdBy ? profileToName(li.createdBy.profile) : 'System' }))
    .sort((a, b) => compareDates(a.createdAt, b.createdAt) * -1);
}

export const init: Init<Params, State> = async ({ viId, logItems }) => {
  const sortedLogItems = cleanUpLogItems(logItems);
  return {
    viId,
    logItems: sortedLogItems,
    visibleLogItems: sortedLogItems,
    submitLoading: 0,
    newLogItemType: Select.init({
      id: 'vi-management-new-log-item-type',
      required: true,
      label: 'Select Entry Type',
      placeholder: 'Select Entry Type',
      options: { tag: 'optionGroups', value: getLogItemTypeNonSystemDropdownItems() },
      value: null
    }),
    newLogItemNote: LongText.init({
      id: 'vi-management-new-log-item-note',
      required: false,
      label: 'Comments/Notes',
      placeholder: 'Comments/Notes',
      value: ''
    }),
    logItemTypeFilter: Select.init({
      id: 'vi-management-log-item-type-filter',
      required: false,
      label: 'Entry Type',
      placeholder: 'All',
      options: { tag: 'optionGroups', value: getLogItemTypeDropdownItems() }
    }),
    searchFilter: ShortText.init({
      id: 'vi-management-search-filter',
      required: false,
      type: 'text',
      placeholder: 'Search',
      value: ''
    }),
    table: immutable(await Table.init({
      idNamespace: 'vi-management-history-table'
    }))
  };
};

const startSubmitLoading: UpdateState<State> = makeStartLoading('submitLoading');
const stopSubmitLoading: UpdateState<State> = makeStopLoading('submitLoading');

export const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'onChangeNewLogItemType':
      return [updateValue(state, 'newLogItemType', msg.value)];
    case 'onChangeNewLogItemNote':
      state = updateValue(state, 'newLogItemNote', msg.value);
      return [validateValue(state, 'newLogItemNote', v => mapValid(validateLogItemNote(v), w => w || ''))];
    case 'onChangeLogItemTypeFilter':
      return [updateAndQuery(state, 'logItemTypeFilter', msg.value)];
    case 'onChangeSearchFilter':
      return [updateAndQuery(state, 'searchFilter', msg.value)];
    case 'table':
      return updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'table' as const, value }),
        childStatePath: ['table'],
        childUpdate: Table.update,
        childMsg: msg.value
      });
    case 'cancel':
      return [
        state
          .setIn(['newLogItemType', 'value'], null)
          .setIn(['newLogItemNote', 'value'], '')
      ];
    case 'submit':
      return [
        startSubmitLoading(state),
        async state => {
          state = stopSubmitLoading(state);
          if (!state.newLogItemType.value) { return state; }
          const result = await api.createViLogItem({
            vendorIdeaId: state.viId,
            type: state.newLogItemType.value.value,
            note: state.newLogItemNote.value || undefined
          });
          switch (result.tag) {
            case 'valid':
              // Parent component should re-initialize this component after reloading
              // the vendor idea from the back-end.
              return state;
            case 'invalid':
              return setErrors(state, result.value);
          }
          return state;
        }
      ];
    default:
      return [state];
  }
};

function updateValue<K extends FormFieldKeys>(state: Immutable<State>, key: K, value: State[K]['value']): Immutable<State> {
  return state.setIn([key, 'value'], value);
}

function liMatchesSearch(li: LogItem, query: RegExp): boolean {
  return !!(li.note && li.note.match(query)) || !!li.createdByName.match(query);
}

function updateAndQuery<K extends QueryKeys>(state: Immutable<State>, key: K, value: State[K]['value']): Immutable<State> {
  // Update state with the filter value.
  state = updateValue(state, key, value);
  // Query the list of available RFIs based on all filters' state.
  const logItemTypeQuery = state.logItemTypeFilter.value && state.logItemTypeFilter.value.value;
  const rawSearchQuery = state.searchFilter.value;
  const searchQuery = rawSearchQuery ? new RegExp(state.searchFilter.value.split(/\s+/).join('.*'), 'i') : null;
  const logItems = state.logItems.filter(li => {
    let match = true;
    match = match && (!logItemTypeQuery || logItemTypeQuery === li.type);
    match = match && (!searchQuery || liMatchesSearch(li, searchQuery));
    return match;
  });
  return state.set('visibleLogItems', logItems); ;
}

function validateValue<K extends FormFieldKeys>(state: Immutable<State>, key: K, validate: (value: State[K]['value']) => Validation<State[K]['value']>): Immutable<State> {
  const validation = validate(state.getIn([key, 'value']));
  return state.setIn([key, 'errors'], getInvalidValue(validation, []));
}

export function setErrors(state: Immutable<State>, errors: CreateValidationErrors): Immutable<State> {
  const getErrors = (k: keyof CreateValidationErrors) => get(errors, k, []);
  return state
    .setIn(['newLogItemNote', 'errors'], getErrors('note'));
}

export function hasProvidedRequiredFields(state: State): boolean {
  const { newLogItemType } = state;
  return !!newLogItemType.value;
}

export function hasValidationErrors(state: State): boolean {
  const { newLogItemNote } = state;
  return !!newLogItemNote.errors.length;
}

export function isValid(state: State): boolean {
  return hasProvidedRequiredFields(state) && !hasValidationErrors(state);
}

const CreateEntry: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const onChangeSelect = (tag: any) => Select.makeOnChange(dispatch, value => ({ tag, value }));
  const onChangeLongText = (tag: any) => LongText.makeOnChange(dispatch, value => ({ tag, value }));
  const isSubmitLoading = state.submitLoading > 0;
  const isDisabled = isSubmitLoading || !isValid(state);
  const submit = () => dispatch({ tag: 'submit', value: undefined });
  const cancel = () => dispatch({ tag: 'cancel', value: undefined });
  return (
    <div className='mb-5 pb-5 border-bottom'>
      <Row className='mb-4'>
        <Col xs='12' md='10' lg='8'>
          <h3 className='mb-0'>Create Entry</h3>
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='5' lg='4'>
          <Select.view
            state={state.newLogItemType}
            formatGroupLabel={LogItemTypeSelectGroupLabel}
            onChange={onChangeSelect('onChangeNewLogItemType')} />
        </Col>
        {state.newLogItemType.value
          ? (<Col xs='12' md='7' lg='8'>
              <LongText.view
                style={{ minHeight: '120px' }}
                state={state.newLogItemNote}
                onChange={onChangeLongText('onChangeNewLogItemNote')} />
              <div className='d-flex flex-md-row-reverse flex-nowrap align-items-center'>
                <LoadingButton color='primary' onClick={submit} loading={isSubmitLoading} disabled={isDisabled} className='text-nowrap'>Submit Entry</LoadingButton>
                <Link onClick={cancel} color='secondary' disabled={isSubmitLoading} className='mx-3'>Cancel</Link>
              </div>
            </Col>)
          : null}
      </Row>
    </div>
  );
};

const History: ComponentView<State, Msg> = ({ state, dispatch }) => {
  const onChangeSelect = (tag: any) => Select.makeOnChange(dispatch, value => ({ tag, value }));
  const onChangeShortText = (tag: any) => ShortText.makeOnChange(dispatch, value => ({ tag, value }));
  const dispatchTable: Dispatch<Table.Msg> = mapComponentDispatch(dispatch, value => ({ tag: 'table' as const, value }));
  return (
    <div>
      <Row className='mb-4'>
        <Col xs='12' md='10' lg='8'>
          <h3 className='mb-0'>History</h3>
        </Col>
      </Row>
      <Row className='d-none d-md-flex align-items-end'>
        <Col xs='12' md='5' lg='4'>
          <Select.view
            state={state.logItemTypeFilter}
            formatGroupLabel={LogItemTypeSelectGroupLabel}
            onChange={onChangeSelect('onChangeLogItemTypeFilter')} />
        </Col>
        <Col xs='12' md='4' className='ml-md-auto'>
          <ShortText.view
            state={state.searchFilter}
            onChange={onChangeShortText('onChangeSearchFilter')} />
        </Col>
      </Row>
      <Table.view
        className='text-nowrap'
        style={{ lineHeight: '1.5rem' }}
        headCells={tableHeadCells}
        bodyRows={tableBodyRows(state.visibleLogItems, dispatch)}
        state={state.table}
        dispatch={dispatchTable} />
    </div>
  );
};

export const view: ComponentView<State, Msg> = props => {
  return (
    <div>
      <CreateEntry {...props} />
      <History {...props} />
    </div>
  );
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
