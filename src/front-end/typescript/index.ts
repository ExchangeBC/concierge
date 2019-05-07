import app from 'front-end/lib/app/index';
import { start } from 'front-end/lib/framework';
import { set } from 'lodash';

const element = document.getElementById('main') || document.body;
// TODO use environment variables.
const debug = true;
start(app, element, debug)
  .then(stateManager => {
    // Store stateManager on the window in development.
    if (debug) { set(window, 'stateManager', stateManager); }
  });
