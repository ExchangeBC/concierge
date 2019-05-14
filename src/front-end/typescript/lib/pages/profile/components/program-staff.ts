import * as ProgramStaffProfile from 'front-end/lib/components/profiles/program-staff-profile';
import * as Profile from 'front-end/lib/pages/profile/components/profile';

export const component = Profile.component(ProgramStaffProfile.component);

export type Params = Profile.Params;

export type Msg = Profile.Msg<ProgramStaffProfile.Msg>;

export type State = Profile.State<ProgramStaffProfile.State>;

export const init = component.init;

export const update = component.update;

export const view = component.view;
