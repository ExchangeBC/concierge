import { State } from 'front-end/lib/app/types';
import * as Nav from 'front-end/lib/app/view/nav';
import { immutable, Init } from 'front-end/lib/framework';
import * as PageLoading from 'front-end/lib/pages/loading';

const init: Init<null, State> = async () => {
  return {
    nav: immutable(await Nav.init(undefined)),
    activePage: { tag: 'loading', value: null },
    pages: {
      loading: immutable(await PageLoading.init(null))
    }
  };
};

export default init;
