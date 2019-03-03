import * as ProgramStaffProfile from 'front-end/lib/components/profiles/program-staff-profile';
import * as Profile from 'front-end/lib/pages/profile/components/profile';
import { ProgramStaffProfile as ProgramStaffProfileType } from 'shared/lib/types';

export const component = Profile.component(ProgramStaffProfile.component);

export type Params = Profile.Params<ProgramStaffProfileType>;

export type Msg = Profile.Msg<ProgramStaffProfile.InnerMsg>;

export type State = Profile.State<ProgramStaffProfile.State>;

export const init = component.init;

export const update = component.update;

export const view = component.view;
