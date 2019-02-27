import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, Immutable } from 'front-end/lib/framework';
import { Profile } from 'shared/lib/types';
import { ProfileValidationErrors } from 'shared/lib/validators/profile';

export interface ProfileComponent<State, InnerMsg> extends Component<null, State, ComponentMsg<InnerMsg, Page>> {
  getValues(state: Immutable<State>): Profile;
  setErrors(state: Immutable<State>, errors: ProfileValidationErrors): Immutable<State>;
  isValid(state: Immutable<State>): boolean;
}
