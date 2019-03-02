import { State } from 'front-end/lib/app/types';
import { immutable, Init } from 'front-end/lib/framework';
import { getSession } from 'front-end/lib/http/api';
import * as PageLanding from 'front-end/lib/pages/landing';

const init: Init<null, State> = async () => {
  const sessionResult = await getSession();
  return {
    ready: false,
    isNavOpen: false,
    session: sessionResult.tag === 'valid' ? sessionResult.value : undefined,
    activePage: { tag: 'landing', value: null },
    pages: {
      landing: immutable(await PageLanding.init(null))
    }
  };
};

export default init;
