import { State } from 'front-end/lib/app/types';
import { Init } from 'front-end/lib/framework';

const init: Init<null, State> = async () => {
  return {
    ready: false,
    isNavOpen: false,
    transitionLoading: 0,
    shared: {
      session: undefined
    },
    activeRoute: { tag: 'landing', value: null },
    modal: {
      open: false,
      content: {
        title: '',
        body: '',
        onCloseMsg: { tag: 'noop', value: undefined },
        actions: []
      }
    },
    pages: {}
  };
};

export default init;
