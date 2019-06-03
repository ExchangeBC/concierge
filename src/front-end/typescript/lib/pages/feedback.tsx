import { makePageMetadata, makeStartLoading, makeStopLoading, UpdateState } from 'front-end/lib';
import { Route, SharedState } from 'front-end/lib/app/types';
import { ComponentView, emptyPageAlerts, emptyPageBreadcrumbs, GlobalComponentMsg, newRoute, noPageModal, PageComponent, PageInit, Update } from 'front-end/lib/framework';
import * as api from 'front-end/lib/http/api';
import { updateField, validateField } from 'front-end/lib/views/form-field';
import Icon from 'front-end/lib/views/icon';
import * as LongText from 'front-end/lib/views/input/long-text';
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
      required: false,
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
          if (validatedRating.tag === 'invalid') {
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
                tag: 'notice' as 'notice',
                value: {
                  noticeId: {
                    tag: 'feedbackSubmitted' as 'feedbackSubmitted',
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
  const isGood = state.rating === 'good';
  const isMeh = state.rating === 'meh';
  const isBad = state.rating === 'bad';
  return (
    <Row className='mb-4'>
      <Col xs='12' className='d-flex'>
        <Icon className='mr-4' name='good-rating' color={isGood ? 'success' : 'secondary'} width={2.5} height={2.5} onClick={setRating('good')} />
        <Icon className='mr-4' name='bad-rating' color={isBad ? 'danger' : 'secondary'} width={2.5} height={2.5} onClick={setRating('bad')} />
        <Icon name='meh-rating' color={isMeh ? 'warning' : 'secondary'} width={2.5} height={2.5} onClick={setRating('meh')} />
      </Col>
    </Row>
  );
}

const viewBottomBar: ComponentView<State, Msg> = props => {
  const { state, dispatch } = props;
  const isLoading = state.loading > 0;
  const isDisabled = isLoading || !isValid(state);
  const cancelRoute: Route = { tag: 'landing' as 'landing', value: null };
  const submit = () => !isDisabled && dispatch({ tag: 'submit', value: undefined });
  return (
    <FixedBar>
      <LoadingButton color='secondary' onClick={submit} loading={isLoading} disabled={isDisabled}>
        Send Feedback
      </LoadingButton>
      <Link route={cancelRoute} color='secondary' className='mx-3'>Cancel</Link>
    </FixedBar>
  )
}

const view: ComponentView<State, Msg> = props => {
  const { state, dispatch } = props;
  const onChange = (tag: any) => LongText.makeOnChange(dispatch, e => ({ tag, value: e.currentTarget.value }));
  const validate = () => dispatch({ tag: 'validateFeedback', value: undefined })
  return (
    <div>
      <Row>
        <Col xs='12'>
          <h1>Send Feedback</h1>
          <label>How would you rate your experience?</label>
        </Col>
      </Row>
      <RatingSelector {...props} />
      <Row>
        <Col xs='12'>
          <LongText.view
            state={state.feedbackText}
            onChange={onChange('onChangeFeedbackText')}
            onChangeDebounced={validate}
            style={{ width: '50vw', height: '25vh', minHeight: '150px' }} />
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
