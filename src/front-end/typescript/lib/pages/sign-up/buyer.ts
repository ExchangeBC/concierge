import * as BuyerProfile from 'front-end/lib/pages/sign-up/components/buyer-profile';
import * as SignUp from 'front-end/lib/pages/sign-up/components/sign-up';

export const component = SignUp.component(BuyerProfile.component);

export type Msg = SignUp.Msg<BuyerProfile.InnerMsg>;

export type State = SignUp.State<BuyerProfile.State>;

export const init = component.init;

export const update = component.update;

export const view = component.view;
