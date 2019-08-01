import { CONTACT_EMAIL } from 'front-end/config';
import { makePageMetadata } from 'front-end/lib';
import { Route, SharedState } from 'front-end/lib/app/types';
import { ComponentView, emptyPageAlerts, GlobalComponentMsg, newRoute, PageBreadcrumbs, PageComponent, PageInit, Update, View } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import { publishedDateToString, updatedDateToString } from 'front-end/lib/pages/request-for-information/lib';
import DiscoveryDayInfo from 'front-end/lib/pages/request-for-information/views/discovery-day-info';
import StatusBadge from 'front-end/lib/pages/request-for-information/views/status-badge';
import FormSectionHeading from 'front-end/lib/views/form-section-heading';
import Icon from 'front-end/lib/views/icon';
import FixedBar from 'front-end/lib/views/layout/fixed-bar';
import Link from 'front-end/lib/views/link';
import Markdown from 'front-end/lib/views/markdown';
import { default as React, ReactElement } from 'react';
import { Col, Row } from 'reactstrap';
import { compareDates, formatDate, formatTime } from 'shared/lib';
import * as DdrResource from 'shared/lib/resources/discovery-day-response';
import * as FileResource from 'shared/lib/resources/file';
import { makeFileBlobPath } from 'shared/lib/resources/file-blob';
import * as RfiResource from 'shared/lib/resources/request-for-information';
import { PublicRfi, rfiToRfiStatus } from 'shared/lib/resources/request-for-information';
import { PublicSessionUser } from 'shared/lib/resources/session';
import { Addendum, ADT, RfiStatus, UserType } from 'shared/lib/types';

const ERROR_MESSAGE = 'The Request for Information you are looking for is not available.';
const DISCOVERY_DAY_ID = 'discovery-day';
const ATTACHMENTS_ID = 'attachments';

export interface RouteParams {
  rfiId: string;
  preview?: boolean;
}

export type InnerMsg
  = ADT<'hideResponseConfirmationPrompt'>
  | ADT<'hideDiscoveryDayConfirmationPrompt'>
  | ADT<'respondToRfi'>
  | ADT<'attendDiscoveryDay'>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

export interface State {
  infoAlerts: string[];
  preview: boolean;
  promptResponseConfirmation: boolean;
  promptDiscoveryDayConfirmation: boolean;
  // TODO refactor how sessionUser, rfi and ddr exist on state
  // once we have better session retrieval in the front-end.
  // See pages/request-for-information/request.tsx for a good example
  // of handling valid/invalid state initialization for pages.
  sessionUser?: PublicSessionUser;
  rfi?: PublicRfi;
  ddr?: DdrResource.PublicDiscoveryDayResponse;
};

const init: PageInit<RouteParams, SharedState, State, Msg> = async ({ routeParams, shared }) => {
  const { rfiId, preview = false } = routeParams;
  const { session } = shared;
  const sessionUser = session && session.user;
  const defaultState: State = {
    infoAlerts: [],
    preview,
    promptResponseConfirmation: false,
    promptDiscoveryDayConfirmation: false,
    sessionUser
  };
  const rfiResult = preview ? await api.readOneRfiPreview(rfiId) : await api.readOneRfi(rfiId);
  switch (rfiResult.tag) {
    case 'valid':
      const rfi = rfiResult.value;
      // Show newest addenda first.
      rfi.latestVersion.addenda.reverse();
      // Determine if the user has already sent a Discovery Day Response,
      // if they are a Vendor.
      let ddr: DdrResource.PublicDiscoveryDayResponse | undefined;
      if (sessionUser && sessionUser.type === UserType.Vendor) {
        const ddrResult = await api.readOneDdr(sessionUser.id, rfi._id);
        if (ddrResult.tag === 'valid') {
          ddr = ddrResult.value;
        }
      }
      // Determine infoAlerts to display on the page.
      const infoAlerts: string[] = [];
      if (preview) {
        infoAlerts.push('This is a preview. All "Published" and "Last Updated" dates on this page are only relevant to the preview, and do not reflect the dates associated with the original RFI.');
      } else {
        // Use `mightViewResponseButtons` to only show response-related infoAlerts
        // to unauthenticated users and Vendor.
        const mightViewResponseButtons = sessionUser && sessionUser.type === UserType.Vendor || !sessionUser;
        const rfiStatus = rfiToRfiStatus(rfi);
        if (mightViewResponseButtons && rfiStatus === RfiStatus.Closed) {
          infoAlerts.push(`This RFI is still accepting responses up to ${rfi.latestVersion.gracePeriodDays} calendar days after the closing date and time.`);
        }
        if (mightViewResponseButtons && rfiStatus === RfiStatus.Expired) {
          infoAlerts.push('This RFI is no longer accepting responses.');
        }
        const updatedAt = rfi.latestVersion.createdAt;
        if (rfiStatus === RfiStatus.Open && updatedAt && compareDates(rfi.publishedAt, updatedAt) === -1) {
          infoAlerts.push(`This RFI was last updated on ${formatDate(updatedAt)}.`);
        }
      }
      return {
        ...defaultState,
        infoAlerts,
        rfi,
        ddr
      };
    case 'invalid':
      return defaultState;
  }
};

const update: Update<State, Msg> = ({ state, msg }) => {
  if (!state.rfi) { return [state]; }
  switch (msg.tag) {
    case 'hideResponseConfirmationPrompt':
      return [state.set('promptResponseConfirmation', false)];
    case 'hideDiscoveryDayConfirmationPrompt':
      return [state.set('promptDiscoveryDayConfirmation', false)];
    case 'respondToRfi':
      return [
        state,
        async (state, dispatch) => {
          if (!state.rfi) {
            return null;
          } else if (state.promptResponseConfirmation || !state.sessionUser || (await api.hasUserAcceptedTerms(state.sessionUser.id))) {
            dispatch(newRoute({
              tag: 'requestForInformationRespond',
              value: {
                rfiId: state.rfi._id
              }
            }));
            return null;
          } else {
            return state.set('promptResponseConfirmation', true);
          }
        }
      ];
    case 'attendDiscoveryDay':
      return [
        state,
        async (state, dispatch) => {
          if (!state.rfi) {
            return null;
          } else if (state.promptDiscoveryDayConfirmation || !state.sessionUser || (await api.hasUserAcceptedTerms(state.sessionUser.id))) {
            dispatch(newRoute({
              tag: 'requestForInformationAttendDiscoveryDay',
              value: {
                rfiId: state.rfi._id
              }
            }));
            return null;
          } else {
            return state.set('promptDiscoveryDayConfirmation', true);
          }
        }
      ];
    default:
      return [state];
  }
};

interface DetailProps {
  title: string;
  values: Array<string | ReactElement<any>>;
}

const Detail: View<DetailProps> = ({ title, values }) => {
  values = values.map((v, i) => (<div key={`${title}-${i}`}>{v}</div>));
  return (
    <Row className='align-items-start mb-3'>
      <Col xs='12' md='5' className='font-weight-bold text-secondary text-center text-md-right'>{title}</Col>
      <Col xs='12' md='7' className='text-center text-md-left'>{values}</Col>
    </Row>
  );
};

const Details: View<{ rfi: PublicRfi }> = ({ rfi }) => {
  const version = rfi.latestVersion;
  const contactValues = [
    `${version.programStaffContact.firstName} ${version.programStaffContact.lastName}`,
    version.programStaffContact.positionTitle,
    (<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>)
  ];
  const statusValues = [
    (<StatusBadge rfi={rfi} />)
  ];
  const discoveryDayValues = version.discoveryDay
    ? [(<a href={`#${DISCOVERY_DAY_ID}`}>View Discovery Day Information</a>)]
    : ['No Discovery Day session'];
  const attachmentsValues = version.attachments.length
    ? [(<a href={`#${ATTACHMENTS_ID}`}>View Attachments</a>)]
    : ['No attachments'];
  return (
    <Row>
      <Col xs='12' md='7'>
        <Detail title='Public Sector Entity' values={[version.publicSectorEntity]} />
        <Detail title='Contact' values={contactValues} />
        <Detail title='Commodity Code(s)' values={version.categories} />
      </Col>
      <Col xs='12' md='5'>
        <Detail title='Status' values={statusValues} />
        <Detail title='Closing Date' values={[formatDate(version.closingAt)]} />
        <Detail title='Closing Time' values={[formatTime(version.closingAt, true)]} />
        <Detail title='Discovery Day' values={discoveryDayValues} />
        <Detail title='Attachments' values={attachmentsValues} />
      </Col>
    </Row>
  );
}

const Description: View<{ value: string }> = ({ value }) => {
  return (
    <div className='mt-5 pt-5 border-top'>
      <Row>
        <Col xs='12'>
          <Markdown source={value} openLinksInNewTabs />
        </Col>
      </Row>
    </div>
  );
}

const DiscoveryDay: View<{ discoveryDay?: RfiResource.PublicDiscoveryDay }> = ({ discoveryDay }) => {
  if (!discoveryDay) { return null; }
  return (
    <div className='pt-5 mt-5 border-top' id={DISCOVERY_DAY_ID}>
      <FormSectionHeading text='Discovery Day Session' />
      <DiscoveryDayInfo discoveryDay={discoveryDay} />
    </div>
  );
}

const Attachments: View<{ files: FileResource.PublicFile[] }> = ({ files }) => {
  if (!files.length) { return null; }
  const children = files.map((file, i) => {
    return (
      <div className='d-flex align-items-start mb-3' key={`view-rfi-attachment-${i}`}>
        <Icon name='paperclip' color='secondary' className='mr-3 mt-1 flex-shrink-0' width={1.1} height={1.1} />
        <Link href={makeFileBlobPath(file._id)} className='d-block' download>
          {file.originalName}
        </Link>
      </div>
    );
  });
  return (
    <div className='pt-5 mt-5 border-top' id={ATTACHMENTS_ID}>
      <FormSectionHeading text='Attachments' />
      <Row>
        <Col xs='12'>
          {children}
        </Col>
      </Row>
    </div>
  );
}

const Addenda: View<{ addenda: Addendum[] }> = ({ addenda }) => {
  if (!addenda.length) { return null; }
  const children = addenda.map((addendum, i) => {
    return (
      <div key={`view-rfi-addendum-${i}`} className={`pb-${i === addenda.length - 1 ? '0' : '4'} w-100`}>
        <Col xs='12' md={{ size: 10, offset: 1 }} className={i !== 0 ? 'pt-4 border-top' : ''}>
          <Markdown source={addendum.description} className='mb-2' openLinksInNewTabs />
        </Col>
        <Col xs='12' md={{ size: 10, offset: 1 }} className='d-flex flex-column flex-md-row justify-content-between text-secondary'>
          <small>{publishedDateToString(addendum.createdAt)}</small>
          <small>{updatedDateToString(addendum.updatedAt)}</small>
        </Col>
      </div>
    );
  });
  return (
    <Row className='mt-5 pt-5 border-top'>
      <Col xs='12'>
        <h3 className='pb-3'>Addenda</h3>
      </Col>
      {children}
    </Row>
  );
}

function showButtons(rfiStatus: RfiStatus, userType?: UserType): boolean {
  return (!userType || userType === UserType.Vendor) && !!rfiStatus && rfiStatus !== RfiStatus.Expired;
}

const viewBottomBar: ComponentView<State, Msg> = props => {
  const { state, dispatch } = props;
  // Do not show buttons for previews.
  if (state.preview || !state.rfi) { return null; }
  // Only show these buttons for Vendors and unauthenticated users.
  const rfiStatus = rfiToRfiStatus(state.rfi);
  if (!showButtons(rfiStatus, state.sessionUser && state.sessionUser.type)) { return null; }
  const version = state.rfi.latestVersion;
  const alreadyRespondedToDiscoveryDay = !!state.ddr;
  const attendDiscoveryDay = () => dispatch({ tag: 'attendDiscoveryDay', value: undefined });
  const respondToRfi = () => dispatch({ tag: 'respondToRfi', value: undefined });
  return (
    <FixedBar>
      <Link onClick={respondToRfi} button color='primary' className='text-nowrap'>
        Respond to RFI
      </Link>
      {version.discoveryDay && rfiStatus === RfiStatus.Open && !RfiResource.discoveryDayHasPassed(version.discoveryDay.occurringAt)
        ? (<Link onClick={attendDiscoveryDay} button color='info' className='text-nowrap mr-md-3 mr-0 ml-3 ml-md-0'>
            {alreadyRespondedToDiscoveryDay ? 'View Discovery Day Session Registration' : 'Attend Discovery Day Session'}
          </Link>)
        : null}
      <div className='text-secondary font-weight-bold d-none d-md-block mr-auto'>I want to...</div>
    </FixedBar>
  );
};

const view: ComponentView<State, Msg> = props => {
  const { state } = props;
  if (!state.rfi) { return null; }
  const rfi = state.rfi;
  const version = state.rfi.latestVersion;
  return (
    <div>
      <Row className='mb-5'>
        <Col xs='12' className='d-flex flex-column text-center align-items-center'>
          <h1 className='h4'>RFI Number: {version.rfiNumber}</h1>
          <h2 className='h1'>{version.title}</h2>
          <div className='text-secondary small'>
            {publishedDateToString(rfi.publishedAt)}
          </div>
          <div className='text-secondary small'>
            {updatedDateToString(version.createdAt)}
          </div>
        </Col>
      </Row>
      <Details rfi={rfi} />
      <Description value={version.description} />
      <DiscoveryDay discoveryDay={version.discoveryDay} />
      <Attachments files={version.attachments} />
      <Addenda addenda={version.addenda} />
    </div>
  );
};

export const component: PageComponent<RouteParams, SharedState, State, Msg> = {
  init,
  update,
  view,
  viewBottomBar,
  getAlerts(state) {
    return {
      ...emptyPageAlerts(),
      info: state.infoAlerts,
      errors: !state.rfi ? [ERROR_MESSAGE] : []
    };
  },
  getMetadata(state) {
    const name = state.rfi ? state.rfi.latestVersion.rfiNumber : 'Request for Information';
    const title = `${name}${state.preview ? ' Preview' : ''}`;
    return makePageMetadata(title);
  },
  getBreadcrumbs(state) {
    const breadcrumbs: PageBreadcrumbs<Msg> = [{
      text: 'RFIs',
      onClickMsg: newRoute({
        tag: 'requestForInformationList',
        value: null
      })
    }];
    breadcrumbs.push({
      text: state.rfi ? state.rfi.latestVersion.rfiNumber : 'Request for Information'
    });
    return breadcrumbs;
  },
  getModal(state) {
    if (!state.rfi) { return null; }
    if (state.promptResponseConfirmation) {
      return {
        title: 'Review Terms and Conditions',
        body: 'You must accept the Procurement Concierge Terms and Conditions in order to respond to this Request for Information.',
        onCloseMsg: { tag: 'hideResponseConfirmationPrompt', value: undefined },
        actions: [
          {
            text: 'Review Terms & Conditions',
            color: 'primary',
            button: true,
            msg: { tag: 'respondToRfi', value: undefined }
          },
          {
            text: 'Go Back',
            color: 'secondary',
            msg: { tag: 'hideResponseConfirmationPrompt', value: undefined }
          }
        ]
      };
    } else if (state.promptDiscoveryDayConfirmation) {
      return {
        title: 'Review Terms and Conditions',
        body: 'You must accept the Procurement Concierge Terms and Conditions in order to attend this RFI\'s Discovery Day session.',
        onCloseMsg: { tag: 'hideDiscoveryDayConfirmationPrompt', value: undefined },
        actions: [
          {
            text: 'Review Terms & Conditions',
            color: 'primary',
            button: true,
            msg: { tag: 'attendDiscoveryDay', value: undefined }
          },
          {
            text: 'Go Back',
            color: 'secondary',
            msg: { tag: 'hideDiscoveryDayConfirmationPrompt', value: undefined }
          }
        ]
      }
    } else {
      return null;
    }
  }
};
