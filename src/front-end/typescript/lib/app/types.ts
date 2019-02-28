import { AppMsg, Immutable } from 'front-end/lib/framework';
import { Session } from 'front-end/lib/http/api';
import * as PageLanding from 'front-end/lib/pages/landing';
import * as PageLoading from 'front-end/lib/pages/loading';
import * as PageSay from 'front-end/lib/pages/say';
import * as PageSignOut from 'front-end/lib/pages/sign-out';
import * as PageSignUpBuyer from 'front-end/lib/pages/sign-up/buyer';
import * as PageSignUpProgramStaff from 'front-end/lib/pages/sign-up/program-staff';
import * as PageSignUpVendor from 'front-end/lib/pages/sign-up/vendor';
import { ADT } from 'shared/lib/types';

export type Page
  = ADT<'landing', PageLanding.Params>
  | ADT<'loading', null>
  | ADT<'signUpBuyer', null>
  | ADT<'signUpVendor', null>
  | ADT<'signUpProgramStaff', null>
  | ADT<'signOut', null>
  | ADT<'settings', null>
  | ADT<'userList', null>
  | ADT<'requestForInformationList', null>
  | ADT<'say', PageSay.Params>;

export interface State {
  ready: boolean;
  session?: Session;
  activePage: Page;
  pages: {
    landing?: Immutable<PageLanding.State>;
    loading?: Immutable<PageLoading.State>;
    signUpBuyer?: Immutable<PageSignUpBuyer.State>;
    signUpVendor?: Immutable<PageSignUpVendor.State>;
    signUpProgramStaff?: Immutable<PageSignUpProgramStaff.State>;
    signOut?: Immutable<PageSignOut.State>;
    say?: Immutable<PageSay.State>;
  };
}

type InnerMsg
  = ADT<'pageLanding', PageLanding.Msg>
  | ADT<'pageLoading', PageLoading.Msg>
  | ADT<'pageSignUpBuyer', PageSignUpBuyer.Msg>
  | ADT<'pageSignUpVendor', PageSignUpVendor.Msg>
  | ADT<'pageSignUpProgramStaff', PageSignUpProgramStaff.Msg>
  | ADT<'pageSignOut', PageSignOut.Msg>
  | ADT<'pageSay', PageSay.Msg>;

export type Msg = AppMsg<InnerMsg, Page>;
