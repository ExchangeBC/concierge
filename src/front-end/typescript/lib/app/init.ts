import { State } from 'front-end/lib/app/types';
import { Init } from 'front-end/lib/framework';
import { getFeatureFlags } from 'front-end/lib/http/api';

const init: Init<null, State> = async () => {
  const featureFlags = await getFeatureFlags();
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
    featureFlags,
    pages: {}
  };
};

export default init;
