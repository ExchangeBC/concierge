import * as ProgramStaffProfile from 'front-end/lib/components/profiles/program-staff-profile';
import * as SignUp from 'front-end/lib/pages/sign-up/components/sign-up';
import StepOne from 'front-end/lib/pages/sign-up/program-staff/steps/one';

export const component = SignUp.component(ProgramStaffProfile.component);

export type RouteParams = SignUp.RouteParams;

export type Msg = SignUp.Msg<ProgramStaffProfile.Msg>;

export type State = SignUp.State<ProgramStaffProfile.State>;
