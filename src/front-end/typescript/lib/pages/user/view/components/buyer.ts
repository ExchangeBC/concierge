import * as BuyerProfile from 'front-end/lib/components/profiles/buyer-profile';
import * as Profile from 'front-end/lib/pages/user/view/components/profile';

export const component = Profile.component(BuyerProfile.component);

export type Params = Profile.Params;

export type Msg = Profile.Msg<BuyerProfile.Msg>;

export type State = Profile.State<BuyerProfile.State>;

export const init = component.init;

export const update = component.update;

export const view = component.view;
