import { State } from 'front-end/lib/app/types';
import { immutable, Init } from 'front-end/lib/framework';
import * as PageLoading from 'front-end/lib/pages/loading';

const init: Init<null, State> = async () => {
  return {
    ready: false,
    session: undefined,
    activePage: { tag: 'loading', value: null },
    pages: {
      loading: immutable(await PageLoading.init(null))
    }
  };
};

export default init;
