import * as BuyerProfile from 'front-end/lib/components/profiles/buyer-profile';
import * as SignUp from 'front-end/lib/pages/sign-up/components/sign-up';

export const component = SignUp.component(BuyerProfile.component);

export type RouteParams = SignUp.RouteParams;

export type Msg = SignUp.Msg<BuyerProfile.InnerMsg>;

export type State = SignUp.State<BuyerProfile.State>;
