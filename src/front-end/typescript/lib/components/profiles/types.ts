import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, Immutable } from 'front-end/lib/framework';
import { Profile as ProfileType, UserType } from 'shared/lib/types';
import { ProfileValidationErrors } from 'shared/lib/validators/profile';

export interface ProfileInitParams<Profile extends ProfileType> {
  profile?: Profile;
  disabled?: boolean;
}

export interface ProfileComponent<State, InnerMsg, Profile extends ProfileType> extends Component<ProfileInitParams<Profile>, State, ComponentMsg<InnerMsg, Page>> {
  userType: UserType;
  getName(state: Immutable<State>): string | null;
  getValues(state: Immutable<State>): Profile;
  setValues(state: Immutable<State>, profile: Profile): Immutable<State>;
  setErrors(state: Immutable<State>, errors: ProfileValidationErrors): Immutable<State>;
  isValid(state: Immutable<State>): boolean;
}

export interface ViewerUser {
  id: string;
  type: UserType;
}
