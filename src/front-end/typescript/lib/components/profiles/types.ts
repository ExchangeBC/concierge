import { ComponentViewProps, Immutable, Init, Update, View } from 'front-end/lib/framework';
import { Profile as ProfileType, UserType } from 'shared/lib/types';
import { ProfileValidationErrors } from 'shared/lib/validators/profile';

export interface ProfileParams<Profile extends ProfileType> {
  profile?: Profile;
  disabled?: boolean;
}

export interface ProfileViewProps<State, Msg> extends ComponentViewProps<State, Msg> {
  disabled?: boolean;
}

export type ProfileView<State, Msg> = View<ProfileViewProps<State, Msg>>;

export interface ProfileComponent<State, Msg, Profile extends ProfileType> {
  init: Init<ProfileParams<Profile>, State>;
  update: Update<State, Msg>;
  view: ProfileView<State, Msg>;
  userType: UserType;
  getValues(state: Immutable<State>): Profile;
  setValues(state: Immutable<State>, profile: Profile): Immutable<State>;
  setErrors(state: Immutable<State>, errors: ProfileValidationErrors): Immutable<State>;
  isValid(state: Immutable<State>): boolean;
}

export interface ViewerUser {
  id: string;
  type: UserType;
}
