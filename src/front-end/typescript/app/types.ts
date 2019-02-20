import { ADT, AppMsg, Immutable } from '../lib/framework';
import * as PageLanding from '../pages/landing';
import * as PageLoading from '../pages/loading';
import * as PageLoadingTwo from '../pages/loading-two';
import * as PageSay from '../pages/say';

export type Page = ADT<'landing', PageLanding.Params> | ADT<'loading', null> | ADT<'loadingTwo', null> | ADT<'say', PageSay.Params>;

export interface State {
  activePage: Page;
  pages: {
    landing?: Immutable<PageLanding.State>;
    loading?: Immutable<PageLoading.State>;
    loadingTwo?: Immutable<PageLoadingTwo.State>;
    say?: Immutable<PageSay.State>;
  };
}

type CustomMsg = ADT<'pageLandingMsg', PageLanding.Msg> | ADT<'pageLoadingMsg', PageLoading.Msg> | ADT<'pageLoadingTwoMsg', PageLoadingTwo.Msg> | ADT<'pageSayMsg', PageSay.Msg>;

export type Msg = AppMsg<CustomMsg, Page>;
