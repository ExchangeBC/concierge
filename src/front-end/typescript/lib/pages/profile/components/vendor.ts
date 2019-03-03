import * as VendorProfile from 'front-end/lib/components/profiles/vendor-profile';
import * as Profile from 'front-end/lib/pages/profile/components/profile';
import { VendorProfile as VendorProfileType } from 'shared/lib/types';

export const component = Profile.component(VendorProfile.component);

export type Params = Profile.Params<VendorProfileType>;

export type Msg = Profile.Msg<VendorProfile.InnerMsg>;

export type State = Profile.State<VendorProfile.State>;

export const init = component.init;

export const update = component.update;

export const view = component.view;
