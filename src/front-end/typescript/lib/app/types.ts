import { AppMsg, Immutable } from 'front-end/lib/framework';
import { Session } from 'front-end/lib/http/api';
import * as PageLanding from 'front-end/lib/pages/landing';
import * as PageLoading from 'front-end/lib/pages/loading';
import * as PageSay from 'front-end/lib/pages/say';
import * as PageSignOut from 'front-end/lib/pages/sign-out';
import * as PageSignUpVendor from 'front-end/lib/pages/sign-up/vendor';
import { ADT } from 'shared/lib/types';

export type Page
  = ADT<'landing', PageLanding.Params>
  | ADT<'loading', null>
  | ADT<'signUpVendor', null>
  | ADT<'signOut', null>
  | ADT<'say', PageSay.Params>;

export interface State {
  ready: boolean;
  session?: Session;
  activePage: Page;
  pages: {
    landing?: Immutable<PageLanding.State>;
    loading?: Immutable<PageLoading.State>;
    signUpVendor?: Immutable<PageSignUpVendor.State>;
    signOut?: Immutable<PageSignOut.State>;
    say?: Immutable<PageSay.State>;
  };
}

type InnerMsg
  = ADT<'pageLanding', PageLanding.Msg>
  | ADT<'pageLoading', PageLoading.Msg>
  | ADT<'pageSignUpVendor', PageSignUpVendor.Msg>
  | ADT<'pageSignOut', PageSignOut.Msg>
  | ADT<'pageSay', PageSay.Msg>;

export type Msg = AppMsg<InnerMsg, Page>;
