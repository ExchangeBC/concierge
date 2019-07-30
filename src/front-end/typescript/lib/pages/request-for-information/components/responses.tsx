import * as Table from 'front-end/lib/components/table';
import { Component, ComponentView, Dispatch, immutable, Immutable, Init, mapComponentDispatch, Update, updateComponentChild, View } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import { BigStat, SmallStats, Stats } from 'front-end/lib/pages/request-for-information/views/stats';
import FormSectionHeading from 'front-end/lib/views/form-section-heading';
import Icon from 'front-end/lib/views/icon';
import Link from 'front-end/lib/views/link';
import moment from 'moment';
import { default as React } from 'react';
import { Col, Row } from 'reactstrap';
import { compareDates, diffDates, formatDate } from 'shared/lib';
import { PublicFile } from 'shared/lib/resources/file';
import { makeFileBlobPath } from 'shared/lib/resources/file-blob';
import { PublicRfi } from 'shared/lib/resources/request-for-information';
import { PublicRfiResponse } from 'shared/lib/resources/request-for-information/response';
import { PublicUser } from 'shared/lib/resources/user';
import { ADT, profileToName } from 'shared/lib/types';
import { invalid, valid, ValidOrInvalid } from 'shared/lib/validators';

export const TAB_NAME = 'Responses';

export interface Params {
  rfi: PublicRfi;
}

export type Msg
  = ADT<'table', Table.Msg>

interface ValidState {
  rfi: PublicRfi;
  responses: PublicRfiResponse[];
  table: Immutable<Table.State<TableCellData>>;
};

export type State = ValidOrInvalid<ValidState, null>;

type TableCellData
  = ADT<'vendor', PublicUser>
  | ADT<'attachment', PublicFile>
  | ADT<'dateSubmitted', Date>;

const TDView: View<Table.TDProps<TableCellData>> = ({ data }) => {
  const NUM_COLUMNS = 2;
  switch (data.tag) {
    case 'vendor':
      return (
        <td className='bg-light font-size-base align-middle' colSpan={NUM_COLUMNS}>
          <Link route={{ tag: 'userView', value: { profileUserId: data.value._id }}} className='mr-2' newTab>
            {profileToName(data.value.profile)}
          </Link>
          {'('}
          <Link href={`mailto:${data.value.email}`}>{data.value.email}</Link>
          {')'}
        </td>
      )
    case 'attachment':
      return (
        <td className='align-middle'>
          <div className='d-flex flex-nowrap'>
            <Icon name='paperclip' color='secondary' className='mr-2 mt-1 flex-shrink-0' width={1} height={1} />
            <Link href={makeFileBlobPath(data.value._id)} className='d-block' download>
              {data.value.originalName}
            </Link>
          </div>
        </td>
      );
    case 'dateSubmitted':
      return (
        <td className='align-middle'>
          {formatDate(data.value)}
        </td>
      );
  }
};

const tableHeadCells: Table.THSpec[] = [
  {
    children: 'Attachment Name',
    style: {
      minWidth: '240px',
      width: '75%'
    }
  },
  {
    children: 'Date Submitted',
    style: {
      minWidth: '110px',
      width: '25%'
    }
  }
];

const TableComponent: Table.TableComponent<TableCellData> = Table.component();

export const init: Init<Params, State> = async ({ rfi }) => {
  const result = await api.readManyRfiResponses(rfi._id);
  if (result.tag === 'invalid') { return invalid(null); }
  const responses = result.value.items.sort((a, b) => {
    // Show newest responses first.
    const dateComparison = compareDates(a.createdAt, b.createdAt) * -1;
    if (dateComparison === 0) {
      return profileToName(a.createdBy.profile).localeCompare(profileToName(b.createdBy.profile));
    }
    return dateComparison;
  });
  return valid({
    rfi,
    responses,
    table: immutable(await TableComponent.init({
      TDView,
      THView: Table.DefaultTHView,
      idNamespace: 'rfi-responses'
    }))
  });
};

export const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'table':
      return updateComponentChild({
        state,
        mapChildMsg: value => ({ tag: 'table' as const, value }),
        childStatePath: ['value', 'table'],
        childUpdate: TableComponent.update,
        childMsg: msg.value
      });
    default:
      return [state];
  }
};

function tableBodyRows(responses: PublicRfiResponse[]): Table.RowsSpec<TableCellData> {
  const rows: TableCellData[][] = responses.reduce((tableRows: TableCellData[][], response) => {
    // Add vendor title row.
    tableRows.push([{
      tag: 'vendor',
      value: response.createdBy
    }]);
    // Add attachment rows.
    return tableRows.concat(response.attachments.reduce((responseRows: TableCellData[][], attachment) => {
      responseRows.push([
        { tag:  'attachment', value: attachment },
        { tag:  'dateSubmitted', value: attachment.createdAt }
      ]);
      return responseRows;
    }, []));
  }, []);
  // Create TD specs from each row's content.
  return rows.map(row => {
    return row.map(data => Table.makeTDSpec(data));
  });
}

const ResponsesReceived: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (state.tag === 'invalid' || !state.value.responses.length) { return null; }
  const dispatchTable: Dispatch<Table.Msg> = mapComponentDispatch(dispatch, value => ({ tag:  'table' as const, value }));
  return (
    <div>
      <Row className='mb-3'>
        <Col xs='12'>
          <h4>Response(s) Received</h4>
        </Col>
      </Row>
      <Row>
        <Col xs='12'>
          <TableComponent.view
            className='text-nowrap'
            headCells={tableHeadCells}
            bodyRows={tableBodyRows(state.value.responses)}
            state={state.value.table}
            dispatch={dispatchTable} />
        </Col>
      </Row>
    </div>
  );
};

export const view: ComponentView<State, Msg> = props => {
  const { state } = props;
  if (state.tag === 'invalid') { return null; }
  const { responses, rfi } = state.value;
  const { closingAt, gracePeriodDays, addenda } = rfi.latestVersion;
  const numResponses = responses.length;
  const numAddenda = addenda.length;
  let numOnClosingDate = 0;
  let numDuringGracePeriod = 0;
  responses.forEach(response => {
    const diffDays = diffDates(response.createdAt, closingAt, 'days');
    const onClosingDay = diffDays > -1 && diffDays < 1 && moment(response.createdAt).get('date') === moment(closingAt).get('date');
    const duringGracePeriod = diffDays > 0 && diffDays <= gracePeriodDays;
    if (onClosingDay) {
      numOnClosingDate++;
    }
    if (duringGracePeriod) {
      numDuringGracePeriod++;
    }
  });
  return (
    <div>
      <Row className='mb-3'>
        <Col xs='12'>
          <FormSectionHeading text='Vendor Responses' />
        </Col>
      </Row>
      <Row className='mb-5'>
        <Col xs='12'>
          <Stats>
            <BigStat color='info' count={numResponses} label={(<span>Response{numResponses === 1 ? '' : 's'}<br />Received</span>)} />
            <SmallStats a={{ color: 'info', count: numOnClosingDate, label: 'Received on Closing Date' }} b={{ color: 'primary', count: numDuringGracePeriod, label: 'Received During Grace Period' }} />
            <BigStat color='primary' count={numAddenda} label={(<span>Addend{numAddenda === 1 ? 'um' : 'a'}<br />Issued</span>)} />
          </Stats>
        </Col>
      </Row>
      <ResponsesReceived {...props} />
    </div>
  );
};

export const component: Component<Params, State, Msg> = {
  init,
  update,
  view
};
