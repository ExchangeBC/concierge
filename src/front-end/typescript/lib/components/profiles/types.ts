import { Page } from 'front-end/lib/app/types';
import { Component, ComponentMsg, Immutable } from 'front-end/lib/framework';
import { UserType } from 'shared/lib/types';
import { ProfileValidationErrors } from 'shared/lib/validators/profile';

export interface ProfileInitParams<Profile> {
  profile?: Profile;
  disabled?: boolean;
}

export interface ProfileComponent<State, InnerMsg, Profile> extends Component<ProfileInitParams<Profile>, State, ComponentMsg<InnerMsg, Page>> {
  userType: UserType;
  getName(state: Immutable<State>): string | null;
  getValues(state: Immutable<State>): Profile;
  setValues(state: Immutable<State>, profile: Profile): Immutable<State>;
  setErrors(state: Immutable<State>, errors: ProfileValidationErrors): Immutable<State>;
  isValid(state: Immutable<State>): boolean;
}

export type ProfileViewerMode = 'guest' | 'owner';
