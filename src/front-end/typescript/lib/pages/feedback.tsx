import { makePageMetadata, makeStartLoading, makeStopLoading, UpdateState } from 'front-end/lib';
import { Route, SharedState } from 'front-end/lib/app/types';
import { ComponentView, emptyPageAlerts, emptyPageBreadcrumbs, GlobalComponentMsg, newRoute, noPageModal, PageComponent, PageInit, Update } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import { updateField, validateField } from 'front-end/lib/views/form-field/lib';
import * as LongText from 'front-end/lib/views/form-field/long-text';
import Icon from 'front-end/lib/views/icon';
import FixedBar from 'front-end/lib/views/layout/fixed-bar';
import Link from 'front-end/lib/views/link';
import LoadingButton from 'front-end/lib/views/loading-button';
import { default as React } from 'react';
import { Col, Row } from 'reactstrap';
import { ADT, Rating } from 'shared/lib/types';
import { validateFeedbackText, validateRating } from 'shared/lib/validators/feedback';

export interface State {
  loading: number;
  rating?: Rating;
  feedbackText: LongText.State
}

type InnerMsg
  = ADT<'onChangeRating', Rating>
  | ADT<'onChangeFeedbackText', string>
  | ADT<'validateFeedback'>
  | ADT<'submit'>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

export type RouteParams = null;

const init: PageInit<RouteParams, SharedState, State, Msg> = async () => {
  return {
    loading: 0,
    rating: undefined,
    feedbackText: LongText.init({
      id: 'feedback-text',
      required: true,
      placeholder: 'Describe your experience here.',
      label: 'Please describe your experience.'
    })
  };
};

const startLoading: UpdateState<State> = makeStartLoading('loading');
const stopLoading: UpdateState<State> = makeStopLoading('loading');

const update: Update<State, Msg> = ({ state, msg }) => {
  switch (msg.tag) {
    case 'onChangeRating':
      return [state.set('rating', msg.value)];
    case 'onChangeFeedbackText':
      return [updateField(state, 'feedbackText', msg.value)];
    case 'validateFeedback':
      return [validateField(state, 'feedbackText', validateFeedbackText)]
    case 'submit':
      state = startLoading(state);
      return [
        state,
        async (state, dispatch) => {
          const validatedRating = validateRating(state.rating);
          if (!isValid(state) || validatedRating.tag === 'invalid') {
            return stopLoading(state);
          }
          const result = await api.createFeedback({
            rating: validatedRating.value,
            text: state.feedbackText.value
          });

          switch (result.tag) {
            case 'valid':
              // Route to feedback submitted notice
              dispatch(newRoute({
                tag: 'notice' as const,
                value: {
                  noticeId: {
                    tag: 'feedbackSubmitted' as const,
                    value: undefined
                  }
                }
              }));
              return stopLoading(state);
            case 'invalid':
              state = state.setIn(['feedbackText', 'errors'], result.value.text || []);
              return stopLoading(state);
          }
        }
      ];
    default:
      return [state];
  }
}

function isValid(state: State): boolean {
  const validatedRating = validateRating(state.rating);
  const validatedFeedbackText = validateFeedbackText(state.feedbackText.value);
  return (validatedRating.tag === 'valid' && validatedFeedbackText.tag === 'valid');
}

const RatingSelector: ComponentView<State, Msg> = props => {
  const { state, dispatch } = props;
  const setRating = (value: Rating) => () => dispatch({ tag: 'onChangeRating', value });
  const isRating = (rating: Rating) => state.rating === rating;
  const iconProps = (rating: Rating, iconName: 'rating-good' | 'rating-neutral' | 'rating-bad', activeColor: 'success' | 'warning' | 'danger' | 'secondary') => {
    const isActive = isRating(rating);
    return {
      className: `${rating === 'good' || rating === 'neutral' ? 'mr-4' : ''} ${isActive ? '' : 'text-hover-gray-700'}`,
      width: 2.5,
      height: 2.5,
      onClick: isActive ? undefined : setRating(rating),
      color: isActive ? activeColor : 'secondary',
      name: iconName,
      style: {
        cursor: isActive ? 'default' : 'pointer'
      }
    };
  };
  return (
    <Row className='mb-4'>
      <Col xs='12' className='d-flex'>
        <Icon {...iconProps('good', 'rating-good', 'success')} />
        <Icon {...iconProps('neutral', 'rating-neutral', 'warning')} />
        <Icon {...iconProps('bad', 'rating-bad', 'danger')} />
      </Col>
    </Row>
  );
}

const viewBottomBar: ComponentView<State, Msg> = props => {
  const { state, dispatch } = props;
  const isLoading = state.loading > 0;
  const isDisabled = isLoading || !isValid(state);
  const cancelRoute: Route = { tag: 'landing', value: null };
  const submit = () => !isDisabled && dispatch({ tag: 'submit', value: undefined });
  return (
    <FixedBar>
      <LoadingButton color='primary' onClick={submit} loading={isLoading} disabled={isDisabled}>
        Send Feedback
      </LoadingButton>
      <Link route={cancelRoute} color='secondary' className='mx-3'>Cancel</Link>
    </FixedBar>
  )
}

const view: ComponentView<State, Msg> = props => {
  const { state, dispatch } = props;
  const onChangeFeedbackText = LongText.makeOnChange(dispatch, value => ({ tag: 'onChangeFeedbackText' as const, value }));
  const validate = () => dispatch({ tag: 'validateFeedback', value: undefined })
  return (
    <div>
      <Row>
        <Col xs='12'>
          <h1>Send Feedback</h1>
        </Col>
      </Row>
      <Row className='mb-3'>
        <Col xs='12' md='8'>
          <p>Your feedback is important to us. Please use this form to share your thoughts with the Procurement Concierge Program's staff.</p>
        </Col>
      </Row>
      <Row>
        <Col xs='12'>
          <label className='font-weight-bold'>How would you rate your experience?<span className='text-primary ml-1'>*</span></label>
          <RatingSelector {...props} />
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='10'>
          <LongText.view
            state={state.feedbackText}
            onChange={onChangeFeedbackText}
            onChangeDebounced={validate}
            style={{ width: '100%', height: '25vh', minHeight: '10rem' }} />
        </Col>
      </Row>
    </div>
  );
}

export const component: PageComponent<RouteParams, SharedState, State, Msg> = {
  init,
  update,
  view,
  viewBottomBar,
  getMetadata() {
    return makePageMetadata('Send Feedback');
  },
  getAlerts: emptyPageAlerts,
  getBreadcrumbs: emptyPageBreadcrumbs,
  getModal: noPageModal
};
