import { Page } from 'front-end/lib/app/types';
import { ComponentMsg, ComponentViewProps, Immutable, Init, Update, View } from 'front-end/lib/framework';
import { Profile as ProfileType, UserType } from 'shared/lib/types';
import { ProfileValidationErrors } from 'shared/lib/validators/profile';

export interface ProfileParams<Profile extends ProfileType> {
  profile?: Profile;
  disabled?: boolean;
}

export type ProfileMsg<InnerMsg> = ComponentMsg<InnerMsg, Page>;

export interface ProfileViewProps<State, InnerMsg> extends ComponentViewProps<State, ProfileMsg<InnerMsg>> {
  disabled?: boolean;
}

export type ProfileView<State, InnerMsg> = View<ProfileViewProps<State, InnerMsg>>;

export interface ProfileComponent<State, InnerMsg, Profile extends ProfileType> {
  init: Init<ProfileParams<Profile>, State>;
  update: Update<State, ProfileMsg<InnerMsg>>;
  view: ProfileView<State, InnerMsg>;
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
