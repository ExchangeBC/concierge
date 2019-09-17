import { CONTACT_EMAIL } from 'front-end/config';
import { makePageMetadata } from 'front-end/lib';
import { isUserType } from 'front-end/lib/access-control';
import router from 'front-end/lib/app/router';
import { Route, SharedState } from 'front-end/lib/app/types';
import { ComponentView, emptyPageAlerts, GlobalComponentMsg, newRoute, noPageModal, PageComponent, PageInit, replaceRoute, Update, View } from 'front-end/lib/framework';
import { readOneUser, readOneViForBuyers } from 'front-end/lib/http/api';
import { WarningId } from 'front-end/lib/pages/terms-and-conditions';
import { expressInterestHref } from 'front-end/lib/pages/vendor-idea/lib';
import FormSectionHeading from 'front-end/lib/views/form-section-heading';
import Icon from 'front-end/lib/views/icon';
import FixedBar from 'front-end/lib/views/layout/fixed-bar';
import Link from 'front-end/lib/views/link';
import React, { ReactElement } from 'react';
import { Col, Row } from 'reactstrap';
import { formatDate } from 'shared/lib';
import * as FileResource from 'shared/lib/resources/file';
import { makeFileBlobPath } from 'shared/lib/resources/file-blob';
import { PublicVendorIdeaForBuyers } from 'shared/lib/resources/vendor-idea';
import { ADT, UserType, VerificationStatus } from 'shared/lib/types';
import { invalid, valid } from 'shared/lib/validators';

const ATTACHMENTS_ID = 'vi-view-attachments';

type VendorIdea = PublicVendorIdeaForBuyers;

interface ValidState {
  vi: VendorIdea;
};

export type State
  = ADT<'valid', ValidState>
  | ADT<'invalid'>;

export interface RouteParams {
  viId: string;
}

export type Msg = GlobalComponentMsg<ADT<'noop'>, Route>;

export const init: PageInit<RouteParams, SharedState, State, Msg> = isUserType({

  userTypes: [UserType.Buyer],

  async success({ routeParams, shared, dispatch }) {
    const userResult = await readOneUser(shared.sessionUser.id);
    if (userResult.tag === 'invalid') {
        dispatch(replaceRoute({
          tag: 'notice',
          value: {
            noticeId: {
              tag: 'notFound',
              value: undefined
            }
          }
        }));
        return invalid(undefined);
      }
    const user = userResult.value;
    if (!user.acceptedTermsAt) {
        dispatch(replaceRoute({
          tag: 'termsAndConditions',
          value: {
            warningId: WarningId.ViewVisAsBuyer,
            redirectOnAccept: router.routeToUrl({
              tag: 'viList',
              value: null
            }),
            redirectOnSkip: router.routeToUrl({
              tag: 'landing',
              value: null
            })
          }
        }));
        return invalid(undefined);
      }
    if (user.profile.type !== UserType.Buyer || user.profile.verificationStatus !== VerificationStatus.Verified) {
        dispatch(replaceRoute({
          tag: 'notice',
          value: {
            noticeId: {
              tag: 'viUnverifiedBuyer',
              value: undefined
            }
          }
        }));
        return invalid(undefined);
      }
    const result = await readOneViForBuyers(routeParams.viId);
    if (result.tag === 'invalid') {
        dispatch(replaceRoute({
          tag: 'notice',
          value: {
            noticeId: {
              tag: 'notFound',
              value: undefined
            }
          }
        }));
        return invalid(undefined);
      }
    return valid({
      vi: result.value
    });
  },

  async fail({ routeParams, shared, dispatch }) {
    if (!shared.session || !shared.session.user) {
      dispatch(replaceRoute({
        tag: 'signIn' as const,
        value: {
          redirectOnSuccess: router.routeToUrl({
            tag: 'viView',
            value: routeParams
          })
        }
      }));
    } else if (shared.session.user.type === UserType.ProgramStaff) {
      dispatch(replaceRoute({
        tag: 'viEdit',
        value: {
          viId: routeParams.viId
        }
      }));
    } else { // Vendor
      dispatch(replaceRoute({
        tag: 'viList',
        value: null
      }));
    }
    return invalid(undefined);
  }

});

export const update: Update<State, Msg> = ({ state, msg }) => {
  return [state];
};

interface DetailProps {
  title: string;
  values: Array<string | ReactElement<any>>;
  titleColWidthMd: number;
}

const Detail: View<DetailProps> = ({ title, values, titleColWidthMd }) => {
  values = values.map((v, i) => (<div key={`${title}-${i}`}>{v}</div>));
  return (
    <Row className='align-items-start mb-3'>
      <Col xs='12' md={titleColWidthMd} className='font-weight-bold text-secondary text-center text-md-right'>{title}</Col>
      <Col xs='12' md={12 - titleColWidthMd} className='text-center text-md-left'>{values}</Col>
    </Row>
  );
};

const Details: View<{ vi: VendorIdea }> = ({ vi }) => {
  const { attachments, description } = vi.latestVersion;
  const attachmentsValues = attachments.length
    ? [(<a href={`#${ATTACHMENTS_ID}`}>View Attachments</a>)]
    : ['No attachments'];
  return (
    <Row>
      <Col xs='12' md='7'>
        <Detail title='Industry Sector(s)' values={description.industrySectors} titleColWidthMd={4} />
        <Detail title='Commodity Code(s)' values={description.categories} titleColWidthMd={4} />
      </Col>
      <Col xs='12' md='5'>
        <Detail title='Submitted by' values={[vi.createdByName]} titleColWidthMd={5} />
        <Detail title='Attachments' values={attachmentsValues} titleColWidthMd={5} />
      </Col>
    </Row>
  );
}

const Summary: View<{ title: string, summary: string }> = ({ title, summary }) => {
  return (
    <div className='mt-5 pt-5 border-top'>
      <Row>
        <Col xs='12'>
          <FormSectionHeading text='Summary' />
          <p style={{ whiteSpace: 'pre-line' }}>{summary}</p>
          <p className='font-weight-bold'>
            If you are interested in this Vendor-Initiated Idea, please contact the Procurement Concierge Program's staff at <Link href={expressInterestHref(title)}>{CONTACT_EMAIL}</Link>.
          </p>
        </Col>
      </Row>
    </div>
  );
}

const Attachments: View<{ files: FileResource.PublicFile[] }> = ({ files }) => {
  if (!files.length) { return null; }
  const children = files.map((file, i) => {
    return (
      <div className='d-flex align-items-start mb-3' key={`view-vi-attachment-${i}`}>
        <Icon name='paperclip' color='secondary' className='mr-2 mt-1 flex-shrink-0' width={1.1} height={1.1} />
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

const viewBottomBar: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (state.tag !== 'valid') { return null; }
  return (
    <FixedBar>
      <Link href={expressInterestHref(state.value.vi.latestVersion.description.title)} button color='primary' className='text-nowrap'>
        Express Interest
      </Link>
      <div className='text-secondary font-weight-bold d-none d-md-block mr-auto'>I want to...</div>
    </FixedBar>
  );
};

const view: ComponentView<State, Msg> = props => {
  const { state } = props;
  if (state.tag !== 'valid') { return null; }
  const vi = state.value.vi;
  const { attachments, description } = vi.latestVersion;
  return (
    <div>
      <Row className='mb-5'>
        <Col xs='12' className='d-flex flex-column text-center align-items-center'>
          <h1 className='h4'>Vendor-Initiated Idea</h1>
          <h2 className='h1'>{description.title}</h2>
          <div className='text-secondary small'>
            Published on {formatDate(vi.createdAt)}
          </div>
        </Col>
      </Row>
      <Details vi={vi} />
      <Summary {...description} />
      <Attachments files={attachments} />
    </div>
  );
};

export const component: PageComponent<RouteParams, SharedState, State, Msg> = {
  init,
  update,
  view,
  viewBottomBar,
  getAlerts: emptyPageAlerts,
  getMetadata(state) {
    if (state.tag === 'valid') {
      return makePageMetadata(`${state.value.vi.latestVersion.description.title} — Vendor-Initiated Idea`);
    } else {
      return makePageMetadata('Vendor-Initiated Idea');
    }
  },
  getBreadcrumbs(state) {
    if (state.tag !== 'valid') { return []; }
    return [
      {
        text: 'Vendor-Initiated Ideas',
        onClickMsg: newRoute({
          tag: 'viList',
          value: null
        })
      },
      {
        text: state.tag === 'valid' ? state.value.vi.latestVersion.description.title : 'Vendor-Initiated Idea'
      }
    ];
  },
  getModal: noPageModal
};
