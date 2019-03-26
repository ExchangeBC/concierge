import { State } from 'front-end/lib/app/types';
import { Init } from 'front-end/lib/framework';

const init: Init<null, State> = async () => {
  return {
    ready: false,
    isNavOpen: false,
    inTransition: false,
    fixedBarBottom: 0,
    session: undefined,
    activePage: { tag: 'landing', value: {} },
    pages: {}
  };
};

export default init;
