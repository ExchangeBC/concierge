import * as VendorProfile from 'front-end/lib/components/profiles/vendor-profile';
import * as SignUp from 'front-end/lib/pages/sign-up/components/sign-up';

export const component = SignUp.component(VendorProfile.component);

export type RouteParams = SignUp.RouteParams;

export type Msg = SignUp.Msg<VendorProfile.InnerMsg>;

export type State = SignUp.State<VendorProfile.State>;
