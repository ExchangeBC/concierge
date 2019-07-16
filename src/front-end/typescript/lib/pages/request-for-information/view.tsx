import { CONTACT_EMAIL } from 'front-end/config';
import { makePageMetadata, makeStartLoading, makeStopLoading, UpdateState } from 'front-end/lib';
import router from 'front-end/lib/app/router';
import { Route, SharedState } from 'front-end/lib/app/types';
import { ComponentView, emptyPageAlerts, GlobalComponentMsg, Immutable, newRoute, PageBreadcrumbs, PageComponent, PageInit, Update, View } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import { publishedDateToString, updatedDateToString } from 'front-end/lib/pages/request-for-information/lib';
import StatusBadge from 'front-end/lib/pages/request-for-information/views/status-badge';
import { WarningId } from 'front-end/lib/pages/terms-and-conditions';
import FormSectionHeading from 'front-end/lib/views/form-section-heading';
import Icon, { AvailableIcons } from 'front-end/lib/views/icon';
import FixedBar from 'front-end/lib/views/layout/fixed-bar';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import Markdown from 'front-end/lib/views/markdown';
import { default as React, ReactElement } from 'react';
import { Col, Row } from 'reactstrap';
import { compareDates, formatDate, formatTime } from 'shared/lib';
import * as DdrResource from 'shared/lib/resources/discovery-day-response';
import * as FileResource from 'shared/lib/resources/file';
import { makeFileBlobPath } from 'shared/lib/resources/file-blob';
import * as RfiResource from 'shared/lib/resources/request-for-information';
import { PublicDiscoveryDay, PublicRfi, rfiToRfiStatus } from 'shared/lib/resources/request-for-information';
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
  | ADT<'respondToRfi'>
  | ADT<'respondToDiscoveryDay'>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

export interface State {
  respondToDiscoveryDayLoading: number;
  respondToRfiLoading: number;
  infoAlerts: string[];
  preview: boolean;
  promptResponseConfirmation: boolean;
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
    respondToDiscoveryDayLoading: 0,
    respondToRfiLoading: 0,
    infoAlerts: [],
    preview,
    promptResponseConfirmation: false,
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
        const ddrResult = await api.readOneDdr(rfi._id);
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

const startRespondToRfiLoading: UpdateState<State> = makeStartLoading('respondToRfiLoading');
const stopRespondToRfiLoading: UpdateState<State> = makeStopLoading('respondToRfiLoading');
const startRespondToDiscoveryDayLoading: UpdateState<State> = makeStartLoading('respondToDiscoveryDayLoading');
const stopRespondToDiscoveryDayLoading: UpdateState<State> = makeStopLoading('respondToDiscoveryDayLoading');

const update: Update<State, Msg> = ({ state, msg }) => {
  if (!state.rfi) { return [state]; }
  switch (msg.tag) {
    case 'hideResponseConfirmationPrompt':
      return [state.set('promptResponseConfirmation', false)];
    case 'respondToRfi':
      return [
        startRespondToRfiLoading(state),
        async (state, dispatch) => {
          state = stopRespondToRfiLoading(state);
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
    case 'respondToDiscoveryDay':
      return [
        startRespondToDiscoveryDayLoading(state),
        async (state, dispatch) => {
          if (!state.rfi) { return null; }
          const finish = (state: Immutable<State>) => stopRespondToDiscoveryDayLoading(state);
          const thisRoute: Route = {
            tag: 'requestForInformationView' as const,
            value: {
              rfiId: state.rfi._id
            }
          };
          const thisUrl = router.routeToUrl(thisRoute);
          // Redirect the user to the sign-in form.
          if (!state.sessionUser) {
            dispatch(newRoute({
              tag: 'signIn' as const,
              value: {
                redirectOnSuccess: thisUrl
              }
            }));
            return finish(state);
          }
          const acceptedTerms = await api.hasUserAcceptedTerms(state.sessionUser.id);
          // Ask the user to accept the terms first.
          if (!acceptedTerms) {
            dispatch(newRoute({
              tag: 'termsAndConditions' as const,
              value: {
                userId: state.sessionUser.id,
                warningId: WarningId.DiscoveryDayResponse,
                redirectOnAccept: thisUrl,
                redirectOnSkip: thisUrl
              }
            }));
            return finish(state);
          }
          return state;
          // Otherwise, process the response.
          /*const result = await api.createDdr({
            rfiId: state.rfi._id
          });
          switch (result.tag) {
            case 'valid':
              return finish(state.set('ddr', result.value));
            case 'invalid':
              // TODO show error messages from the server.
              // TODO Redirect to T&C if required.
              return finish(state);
          }*/
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
    : ['No Discovery Day'];
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
  const { description, occurringAt, location } = discoveryDay;
  const InfoItem: View<{ icon: AvailableIcons, name: string, value: string }> = ({ icon, name, value }) => (
    <div className='d-flex align-items-start mb-3'>
      <Icon name={icon} color='secondary' className='mr-3 flex-shrink-0' width={1.4} height={1.4} />
      <span className='font-weight-bold text-secondary mr-3'>{name}</span>
      <span>{value}</span>
    </div>
  );
  const Info = () => (
    <Col xs='12'>
      <InfoItem name='Date' value={formatDate(occurringAt)} icon='calendar' />
      <InfoItem name='Time' value={formatTime(occurringAt, true)} icon='clock' />
      <InfoItem name='Location' value={location} icon='map-marker' />
    </Col>
  );
  return (
    <div className='pt-5 mt-5 border-top' id={DISCOVERY_DAY_ID}>
      <FormSectionHeading text='Discovery Day' />
      <Row>
        <Col xs='12'>
          {description ? (<Markdown source={description} className='pb-3' openLinksInNewTabs />) : null}
        </Col>
        <Info />
      </Row>
    </div>
  );
}

const Attachments: View<{ files: FileResource.PublicFile[] }> = ({ files }) => {
  if (!files.length) { return null; }
  const children = files.map((file, i) => {
    return (
      <div className='d-flex align-items-start mb-3' key={`view-rfi-attachment-${i}`}>
        <Icon name='paperclip' color='secondary' className='mr-3 mt-1 flex-shrink-0' width={1.1} height={1.1} />
        <a href={makeFileBlobPath(file._id)} className='d-block' download>
          {file.originalName}
        </a>
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

interface RespondToDiscoveryDayButtonProps {
  loading: boolean;
  discoveryDay?: PublicDiscoveryDay;
  alreadyResponded: boolean;
  onClick(): void;
}

const RespondToDiscoveryDayButton: View<RespondToDiscoveryDayButtonProps> = props => {
  const { loading, discoveryDay, alreadyResponded, onClick } = props;
  if (!discoveryDay) { return null; }
  const disabled = alreadyResponded || loading;
  const text = alreadyResponded ? 'Discovery Session Request Sent' : 'Attend Discovery Session';
  return (
    <LoadingButton color='info' onClick={onClick} loading={loading} disabled={disabled} className='ml-3 ml-md-0 mx-md-3 text-nowrap'>
      {text}
    </LoadingButton>
  );
};

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
  const respondToDiscoveryDay = () => !alreadyRespondedToDiscoveryDay && dispatch({ tag: 'respondToDiscoveryDay', value: undefined });
  const isLoading = state.respondToDiscoveryDayLoading > 0;
  const respondToRfi = () => dispatch({ tag: 'respondToRfi', value: undefined });
  return (
    <FixedBar>
      <Link onClick={respondToRfi} button color='primary' disabled={isLoading} className='text-nowrap'>
        Respond to RFI
      </Link>
      {rfiStatus === RfiStatus.Open
        ? (<RespondToDiscoveryDayButton
             discoveryDay={version.discoveryDay}
             alreadyResponded={alreadyRespondedToDiscoveryDay}
             onClick={respondToDiscoveryDay}
             loading={isLoading} />)
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
    const title
      = state.preview
      ? 'Request for Information Preview'
      : 'Request for Information';
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
    if (state.rfi) {
      breadcrumbs.push({
        text: state.rfi.latestVersion.rfiNumber
      });
    }
    return breadcrumbs;
  },
  getModal(state) {
    if (!state.promptResponseConfirmation || !state.rfi) { return null; }
    return {
      title: 'Review the Terms and Conditions?',
      body: 'You must accept the Procurement Concierge Terms and Conditions in order to respond to this Request for Information.',
      onCloseMsg: { tag: 'hideResponseConfirmationPrompt', value: undefined },
      actions: [
        {
          text: 'Yes, review Terms and Conditions',
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
  }
};
