import * as ProgramStaffProfile from 'front-end/lib/pages/sign-up/components/program-staff-profile';
import * as SignUp from 'front-end/lib/pages/sign-up/components/sign-up';

export const component = SignUp.component(ProgramStaffProfile.component);

export type Msg = SignUp.Msg<ProgramStaffProfile.InnerMsg>;

export type State = SignUp.State<ProgramStaffProfile.State>;

export const init = component.init;

export const update = component.update;

export const view = component.view;
