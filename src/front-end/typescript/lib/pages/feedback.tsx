import * as ShortText from 'front-end//lib/views/input/short-text';
import { makePageMetadata } from 'front-end/lib';
import { isSignedOut } from 'front-end/lib/access-control';
import { Route, SharedState } from 'front-end/lib/app/types';
import { ComponentView, emptyPageAlerts, GlobalComponentMsg, Immutable, PageComponent, PageInit, Update } from 'front-end/lib/framework';
// import * as api from 'front-end/lib/http/api';
import { updateField } from 'front-end/lib/views/form-field';
import * as LongText from 'front-end/lib/views/input/long-text';
import { default as React } from 'react';
import { Col, Row } from 'reactstrap';
import { ADT } from 'shared/lib/types';

export interface State {
  loading: number;
  rating: ShortText.State;
  feedbackText: LongText.State
}

type InnerMsg
  = ADT<'onChangeRating', string>
  | ADT<'onChangeFeedbackText', string>
  | ADT<'submit'>;

export type Msg = GlobalComponentMsg<InnerMsg, Route>;

export type RouteParams = null;

const initState: State = {
  loading: 0,
  // rating: RatingSelector.init({
  //   id: 'rating-selector',
  //   required: true
  // }),
  rating: ShortText.init({
    id: 'rating',
    required: true,
    label: 'Rating',
    placeholder: 'Rating',
    type: 'text'
  }),
  feedbackText: LongText.init({
    id: 'feedback-text',
    required: true,
    label: 'Please describe your experience',
    placeholder: 'Describe your experience here.'
  })
}

const init: PageInit<RouteParams, SharedState, State, Msg> = isSignedOut({
  async success() {
    return initState;
  },
  async fail() {
    return initState;
  }
});

function startLoading(state: Immutable<State>): Immutable<State> {
  return state.set('loading', state.loading + 1);
}

function stopLoading(state: Immutable<State>): Immutable<State> {
  return state.set('loading', Math.max(state.loading - 1, 0));
}

const update: Update<State, Msg> = ({state, msg }) => {
  switch (msg.tag) {
    case 'onChangeRating':
      return [updateField(state, 'rating', msg.value)];
    case 'onChangeFeedbackText':
      return [updateField(state, 'feedbackText', msg.value)];
    case 'submit':
      state = startLoading(state);
      return [
        state,
        async (state, dispatch) => {
          // await api.createFeedback({
          //   rating: state.rating.value,
          //   feedbackText: state.feedbackText.value
          // });

          // TODO: Redirect user to the 'feedback submitted' page

          return stopLoading(state);
        }
      ];
    default:
      return [state];
  }
}

const view: ComponentView<State, Msg> = props => {
  // const { state, dispatch } = props;

  return (
    <div>
      <Row>
        <Col xs='12'>
          <h1>Submit Feedback</h1>
        </Col>
      </Row>
      <Row>
        <Col xs='12' md='6' lg='5'>
          <Row className='mb-3 pb-3'>

          </Row>
        </Col>
      </Row>
    </div>
  );
}

export const component: PageComponent<RouteParams, SharedState, State, Msg> = {
  init,
  update,
  view,
  getMetadata() {
    return makePageMetadata('Submit Feedback');
  },
  getAlerts: emptyPageAlerts
};
