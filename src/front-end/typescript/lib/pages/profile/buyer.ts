import * as BuyerProfile from 'front-end/lib/components/profiles/buyer-profile';
import * as Profile from 'front-end/lib/pages/profile/components/profile';
import { BuyerProfile as BuyerProfileType } from 'shared/lib/types';

export const component = Profile.component(BuyerProfile.component);

export type Params = Profile.Params<BuyerProfileType>;

export type Msg = Profile.Msg<BuyerProfile.InnerMsg>;

export type State = Profile.State<BuyerProfile.State>;

export const init = component.init;

export const update = component.update;

export const view = component.view;
