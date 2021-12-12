import * as Table from 'front-end/lib/components/table';
import { Component, ComponentView, Dispatch, immutable, Immutable, Init, mapComponentDispatch, Update, updateComponentChild } from 'front-end/lib/framework';
import { BigStat, SmallStats, Stats } from 'front-end/lib/pages/request-for-information/views/stats';
import FormSectionHeading from 'front-end/lib/views/form-section-heading';
import Icon from 'front-end/lib/views/icon';
import Link from 'front-end/lib/views/link';
import { reduce } from 'lodash';
import { default as React } from 'react';
import { Col, Row } from 'reactstrap';
import { compareDates, diffDates, formatDateAndTime } from 'shared/lib';
import { PublicFile } from 'shared/lib/resources/file';
import { makeFileBlobPath } from 'shared/lib/resources/file-blob';
import { PublicRfi } from 'shared/lib/resources/request-for-information';
import { PublicRfiResponse } from 'shared/lib/resources/request-for-information/response';
import { ADT, profileToName } from 'shared/lib/types';

export const TAB_NAME = 'Responses';

export interface Params {
  rfi: PublicRfi;
  responses: PublicRfiResponse[];
}

export type Msg = ADT<'table', Table.Msg>;

interface RfiResponse {
  createdBy: PublicRfiResponse['createdBy'];
  createdAt: PublicRfiResponse['createdAt'];
  attachments: PublicRfiResponse['attachments'];
}

export interface State {
  rfi: PublicRfi;
  responses: RfiResponse[];
  table: Immutable<Table.State>;
}

const tableHeadCells: Table.THSpec[] = [
  {
    children: 'Attachment Name',
    style: {
      minWidth: '360px',
      width: '80%',
      height: '4rem'
    }
  },
  {
    children: 'Date Submitted',
    className: 'text-right',
    style: {
      minWidth: '210px',
      width: '20%',
      height: '4rem'
    }
  }
];

export const init: Init<Params, State> = async ({ rfi, responses }) => {
  const responsesByVendor: Record<string, PublicRfiResponse[]> = responses.reduce((acc: Record<string, PublicRfiResponse[]>, response) => {
    const vendorId = response.createdBy._id;
    acc[vendorId] = acc[vendorId] || [];
    acc[vendorId].push(response);
    return acc;
  }, {});
  // Combine all of a vendor's responses into a single response.
  // Each response's attachments are sorted by creation date, newest first.
  // All responses are sorted alphabetically by vendor's name.
  const transformedResponses: RfiResponse[] = reduce(
    responsesByVendor,
    (acc: RfiResponse[], v, k) => {
      // Sort to ensure newest responses are first,
      // so `createdAt` reflects the most recent response, and
      // the attachments are shown in reverse order of submission.
      const vendorResponses = v.sort((a, b) => compareDates(a.createdAt, b.createdAt) * -1);
      acc.push({
        createdBy: vendorResponses[0].createdBy,
        createdAt: vendorResponses[0].createdAt,
        attachments: vendorResponses.reduce((acc: PublicFile[], { attachments }) => [...acc, ...attachments], [])
      });
      return acc;
    },
    []
  ).sort((a, b) => profileToName(a.createdBy.profile).localeCompare(profileToName(b.createdBy.profile)));
  return {
    rfi,
    responses: transformedResponses,
    table: immutable(
      await Table.init({
        idNamespace: 'rfi-responses'
      })
    )
  };
};

export const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'table':
      return updateComponentChild({
        state,
        mapChildMsg: (value) => ({ tag: 'table' as const, value }),
        childStatePath: ['table'],
        childUpdate: Table.update,
        childMsg: msg.value
      });
    default:
      return [state];
  }
};

const NUM_COLUMNS = 2;

function tableBodyRows(responses: RfiResponse[]): Table.RowsSpec {
  return responses.reduce((tableRows: Table.RowsSpec, response) => {
    // Add vendor title row.
    tableRows.push([
      {
        children: (
          <div>
            <Link route={{ tag: 'userView', value: { profileUserId: response.createdBy._id } }} className="mr-2" newTab>
              {profileToName(response.createdBy.profile)}
            </Link>
            {'('}
            <Link href={`mailto:${response.createdBy.email}`}>{response.createdBy.email}</Link>
            {')'}
          </div>
        ),
        className: 'bg-light font-size-base text-wrap',
        colSpan: NUM_COLUMNS
      }
    ]);
    // Add attachment rows.
    return tableRows.concat(
      response.attachments.reduce((responseRows: Table.RowsSpec, attachment) => {
        responseRows.push([
          {
            children: (
              <div className="d-flex flex-nowrap">
                <Icon name="paperclip" color="secondary" className="mr-2 mt-1 flex-shrink-0" width={1} height={1} />
                <Link href={makeFileBlobPath(attachment._id)} className="d-block" download>
                  {attachment.originalName}
                </Link>
              </div>
            ),
            className: 'align-top'
          },
          {
            children: formatDateAndTime(attachment.createdAt, true),
            className: 'align-top text-right'
          }
        ]);
        return responseRows;
      }, [])
    );
  }, []);
}

const ResponsesReceived: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (!state.responses.length) {
    return null;
  }
  const dispatchTable: Dispatch<Table.Msg> = mapComponentDispatch(dispatch, (value) => ({ tag: 'table' as const, value }));
  return (
    <div>
      <Row className="mb-3">
        <Col xs="12">
          <h4>Response(s) Received</h4>
        </Col>
      </Row>
      <Row>
        <Col xs="12">
          <Table.view className="text-nowrap" headCells={tableHeadCells} bodyRows={tableBodyRows(state.responses)} state={state.table} dispatch={dispatchTable} />
        </Col>
      </Row>
    </div>
  );
};

export const view: ComponentView<State, Msg> = (props) => {
  const { state } = props;
  const { responses, rfi } = state;
  const { closingAt, gracePeriodDays, addenda } = rfi.latestVersion;
  const numResponses = responses.length;
  const numAddenda = addenda.length;
  let numByClosingTime = 0;
  let numDuringGracePeriod = 0;
  responses.forEach((response) => {
    const diffDays = diffDates(response.createdAt, closingAt, 'days');
    const byClosingTime = diffDays <= 0;
    const duringGracePeriod = diffDays > 0 && diffDays <= gracePeriodDays;
    if (byClosingTime) {
      numByClosingTime++;
    }
    if (duringGracePeriod) {
      numDuringGracePeriod++;
    }
  });
  return (
    <div>
      <Row className="mb-3">
        <Col xs="12">
          <FormSectionHeading text="Vendor Responses" />
        </Col>
      </Row>
      <Row className="mb-5">
        <Col xs="12">
          <Stats>
            <BigStat
              color="primary-alt"
              count={numResponses}
              label={
                <span>
                  Response{numResponses === 1 ? '' : 's'}
                  <br />
                  Received
                </span>
              }
            />
            <SmallStats a={{ color: 'primary-alt', count: numByClosingTime, label: 'Received by closing time' }} b={{ color: 'info', count: numDuringGracePeriod, label: 'Received during grace period' }} />
            <BigStat
              color="info"
              count={numAddenda}
              label={
                <span>
                  Addend{numAddenda === 1 ? 'um' : 'a'}
                  <br />
                  Issued
                </span>
              }
            />
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
