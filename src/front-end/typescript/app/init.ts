import { immutable, Init } from '../lib/framework';
import * as PageLoading from '../pages/loading';
import { State } from './types';

const init: Init<null, State> = async () => {
  return {
    activePage: { tag: 'loading', data: null },
    pages: {
      loading: immutable(await PageLoading.init(null))
    }
  };
};

export default init;
