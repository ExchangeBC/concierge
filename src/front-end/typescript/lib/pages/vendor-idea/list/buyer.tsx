import router from 'front-end/lib/app/router';
import { Route } from 'front-end/lib/app/types';
import { ComponentView, Dispatch, GlobalComponentMsg, Immutable, immutable, Init, replaceRoute, Update } from 'front-end/lib/framework';
import { readManyVisForBuyers, readOneUser } from 'front-end/lib/http/api';
import { WarningId } from 'front-end/lib/pages/terms-and-conditions';
import { expressInterestHref } from 'front-end/lib/pages/vendor-idea/lib';
import * as Select from 'front-end/lib/views/form-field/select';
import * as ShortText from 'front-end/lib/views/form-field/short-text';
import Link from 'front-end/lib/views/link';
import { includes, truncate } from 'lodash';
import React from 'react';
import { Card, CardSubtitle, CardText, CardTitle, Col, Row } from 'reactstrap';
import AVAILABLE_CATEGORIES from 'shared/data/categories';
import AVAILABLE_INDUSTRY_SECTORS from 'shared/data/industry-sectors';
import { compareDates, formatRelativeTime } from 'shared/lib';
import { PublicSessionUser } from 'shared/lib/resources/session';
import { PublicVendorIdeaSlimForBuyers } from 'shared/lib/resources/vendor-idea';
import { ADT, UserType, VerificationStatus } from 'shared/lib/types';
import { invalid, valid } from 'shared/lib/validators';

type VendorIdea = PublicVendorIdeaSlimForBuyers;

interface ValidState {
  vis: VendorIdea[];
  visibleVis: VendorIdea[];
  categoryFilter: Select.State;
  industrySectorFilter: Select.State;
  searchFilter: ShortText.State;
};

export type State
  = ADT<'valid', Immutable<ValidState>>
  | ADT<'invalid'>;

type FormFieldKeys
  = 'categoryFilter'
  | 'industrySectorFilter'
  | 'searchFilter';

export interface Params {
  sessionUser: PublicSessionUser;
  dispatch: Dispatch<Msg>;
}

type InnerMsg
  = ADT<'categoryFilter', Select.Value>
  | ADT<'industrySectorFilter', Select.Value>
  | ADT<'searchFilter', string>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

export const init: Init<Params, State> = async ({ sessionUser, dispatch }) => {
  const userResult = await readOneUser(sessionUser.id);
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
  const result = await readManyVisForBuyers();
  let vis: VendorIdea[] = [];
  if (result.tag === 'valid') {
    // Sort vendor ideas by date submitted.
    vis = result.value.items
      .sort((a, b) => {
        return compareDates(a.createdAt, b.createdAt) * -1;
      });
  }
  return valid(immutable({
    vis,
    visibleVis: vis,
    categoryFilter: Select.init({
      id: 'vi-list-filter-category',
      required: false,
      label: 'Commodity Code',
      placeholder: 'All',
      options: {
        tag: 'options',
        value: AVAILABLE_CATEGORIES.toJS().map(value => ({ label: value, value }))
      }
    }),
    industrySectorFilter: Select.init({
      id: 'vi-list-filter-industry-sector',
      required: false,
      label: 'Industry Sector',
      placeholder: 'All',
      options: {
        tag: 'options',
        value: AVAILABLE_INDUSTRY_SECTORS.toJS().map(value => ({ label: value, value }))
      }
    }),
    searchFilter: ShortText.init({
      id: 'rfi-list-filter-search',
      type: 'text',
      required: false,
      placeholder: 'Search'
    })
  }));
};

function viMatchesCategory(vi: VendorIdea, filterCategory?: string | null): boolean {
  if (!filterCategory) { return false; }
  return includes(vi.latestVersion.description.categories, filterCategory);
}

function viMatchesIndustrySector(vi: VendorIdea, filterIndustrySector?: string | null): boolean {
  if (!filterIndustrySector) { return false; }
  return includes(vi.latestVersion.description.industrySectors, filterIndustrySector);
}

function viMatchesSearch(vi: VendorIdea, query: RegExp): boolean {
  return !!vi.latestVersion.description.title.match(query);
}

function updateAndQuery<K extends FormFieldKeys>(state: Immutable<ValidState>, key: K, value: ValidState[K]['value']): Immutable<ValidState> {
  // Update state with the filter value.
  state = state.setIn([key, 'value'], value);
  // Query the list of available RFIs based on all filters' state.
  const categoryQuery = state.categoryFilter.value && state.categoryFilter.value.value;
  const industrySectorQuery = state.industrySectorFilter.value && state.industrySectorFilter.value.value;
  const rawSearchQuery = state.searchFilter.value;
  const searchQuery = rawSearchQuery ? new RegExp(state.searchFilter.value.split(/\s+/).join('.*'), 'i') : null;
  const vis = state.vis.filter(vi => {
    let match = true;
    match = match && (!categoryQuery || viMatchesCategory(vi, categoryQuery));
    match = match && (!industrySectorQuery || viMatchesIndustrySector(vi, industrySectorQuery));
    match = match && (!searchQuery || viMatchesSearch(vi, searchQuery));
    return match;
  });
  return state.set('visibleVis', vis); ;
}

export const update: Update<State, Msg> = ({ state, msg }) => {
  if (state.tag === 'invalid') { return [state]; }
  switch (msg.tag) {
    case 'categoryFilter':
      return [state.update('value', v => v && updateAndQuery(v, 'categoryFilter', msg.value))];
    case 'industrySectorFilter':
      return [state.update('value', v => v && updateAndQuery(v, 'industrySectorFilter', msg.value))];
    case 'searchFilter':
      return [state.update('value', v => v && updateAndQuery(v, 'searchFilter', msg.value))];
    default:
      return [state];
  }
};

const Filters: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (state.tag === 'invalid') { return null; }
  const onChangeSelect = (tag: any) => Select.makeOnChange(dispatch, value => ({ tag, value }));
  const onChangeShortText = (tag: any) => ShortText.makeOnChange(dispatch, value => ({ tag, value }));
  return (
    <div className='mb-3'>
      <Row>
        <Col xs='12'>
          <h3 className='mb-3'>
            Submission(s)
          </h3>
        </Col>
      </Row>
      <Row className='d-none d-md-flex align-items-end'>
        <Col xs='12' md='4'>
          <Select.view
            state={state.value.categoryFilter}
            onChange={onChangeSelect('categoryFilter')} />
        </Col>
        <Col xs='12' md='4'>
          <Select.view
            state={state.value.industrySectorFilter}
            onChange={onChangeSelect('industrySectorFilter')} />
        </Col>
        <Col xs='12' md='4' className='ml-md-auto'>
          <ShortText.view
            state={state.value.searchFilter}
            onChange={onChangeShortText('searchFilter')} />
        </Col>
      </Row>
    </div>
  );
};

const makeCategoryString = (categories: string[]): string => {
  switch (categories.length) {
    case 0:
      return '';
    case 1:
      return categories[0];
    default:
      return `${categories[0]}; and more...`;
  }
};

const Results: ComponentView<State, Msg> = ({ state, dispatch }) => {
  if (state.tag === 'invalid') { return null; }
  if (!state.value.vis.length) { return (<div>There are currently no Vendor-Initiated Ideas available.</div>); }
  if (!state.value.visibleVis.length) { return (<div>There are no Vendor-Initiated Ideas that match the search criteria.</div>); }
  return (
    <div>
      <Row className='justify-content-md-center'>
        <Col xs='12' md='10' lg='12'>
          <Row className='align-items-stretch'>
            {state.value.visibleVis.map((vi, i) => (
              <Col xs='12' md='6' lg='4' key={`vi-list-result-buyer-${i}`} className='vi-card'>
                <Card body className='p-3 h-100'>
                  <CardTitle className='h5'>
                    <Link route={{ tag: 'viView', value: { viId: vi._id }}} color='body' className='text-hover-primary text-decoration-none'>
                      {vi.latestVersion.description.title}
                    </Link>
                  </CardTitle>
                  <CardSubtitle className='text-secondary font-weight-bold'>
                    {makeCategoryString(vi.latestVersion.description.categories)}
                  </CardSubtitle>
                  <CardText className='mt-3'>
                    {truncate(vi.latestVersion.description.summary, { length: 180, omission: '...', separator: /[.!?]/ })}
                  </CardText>
                  <CardText className='small text-secondary'>
                    Published {formatRelativeTime(vi.createdAt)}.
                  </CardText>
                  <div className='mt-md-auto w-100 d-flex flex-nowrap'>
                    <Link button outline route={{ tag: 'viView', value: { viId: vi._id }}} color='info' className='mr-2 text-nowrap' size='sm'>Learn More</Link>
                    <Link button href={expressInterestHref(vi.latestVersion.description.title)} color='primary' size='sm' className='text-nowrap'>Express Interest</Link>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export const view: ComponentView<State, Msg> = props => {
  return (
    <div>
      <Row className='mb-5'>
        <Col xs='12' md='9' lg='8'>
          <h1>Vendor-Initiated Ideas</h1>
          <p>
            The following list contains Vendor-Initiated Ideas (VIIs) that are eligible to be purchased by government.
          </p>
        </Col>
      </Row>
      <Filters {...props} />
      <Results {...props} />
    </div>
  );
};
