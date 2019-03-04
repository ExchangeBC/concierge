import app from 'front-end/lib/app/index';
import { start } from 'front-end/lib/framework';

start(app, document.getElementById('main') || document.body, true)
  .then(stateManager => {
    window.addEventListener('scroll', event => {
      const footer = document.querySelector('footer');
      if (!footer) { return; }
      // Update the bottom CSS position of fixed bars.
      const fixedBarBottom = Math.max(0, window.innerHeight - (footer.offsetTop - window.scrollY));
      stateManager.dispatch({
        tag: 'updateFixedBarBottom',
        value: fixedBarBottom
      });
    })
  });
