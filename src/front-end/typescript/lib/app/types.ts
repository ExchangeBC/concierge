import { AppMsg, Immutable } from 'front-end/lib/framework';
import * as PageLanding from 'front-end/lib/pages/landing';
import * as PageLoading from 'front-end/lib/pages/loading';
import * as PageSay from 'front-end/lib/pages/say';
import * as PageSignUp from 'front-end/lib/pages/sign-up';
import { ADT } from 'shared/lib/types';

export type Page
  = ADT<'landing', PageLanding.Params>
  | ADT<'loading', null>
  | ADT<'signUp', null>
  | ADT<'say', PageSay.Params>;

export interface State {
  activePage: Page;
  pages: {
    landing?: Immutable<PageLanding.State>;
    loading?: Immutable<PageLoading.State>;
    signUp?: Immutable<PageSignUp.State>;
    say?: Immutable<PageSay.State>;
  };
}

type InnerMsg
  = ADT<'pageLandingMsg', PageLanding.Msg>
  | ADT<'pageLoadingMsg', PageLoading.Msg>
  | ADT<'pageSignUpMsg', PageSignUp.Msg>
  | ADT<'pageSayMsg', PageSay.Msg>;

export type Msg = AppMsg<InnerMsg, Page>;
