import { State } from 'front-end/lib/app/types';
import { immutable, Init } from 'front-end/lib/framework';
import * as PageLanding from 'front-end/lib/pages/landing';

const init: Init<null, State> = async () => {
  return {
    ready: false,
    isNavOpen: false,
    session: undefined,
    activePage: { tag: 'landing', value: null },
    pages: {
      landing: immutable(await PageLanding.init(null))
    }
  };
};

export default init;
