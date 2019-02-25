import { ADT, AppMsg, Immutable } from 'front-end/lib/framework';
import * as PageLanding from 'front-end/lib/pages/landing';
import * as PageLoading from 'front-end/lib/pages/loading';
import * as PageSay from 'front-end/lib/pages/say';

export type Page = ADT<'landing', PageLanding.Params> | ADT<'loading', null> | ADT<'say', PageSay.Params>;

export interface State {
  activePage: Page;
  pages: {
    landing?: Immutable<PageLanding.State>;
    loading?: Immutable<PageLoading.State>;
    say?: Immutable<PageSay.State>;
  };
}

type CustomMsg = ADT<'pageLandingMsg', PageLanding.Msg> | ADT<'pageLoadingMsg', PageLoading.Msg> | ADT<'pageSayMsg', PageSay.Msg>;

export type Msg = AppMsg<CustomMsg, Page>;
