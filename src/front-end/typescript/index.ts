import app from 'front-end/lib/app/index';
import { start } from 'front-end/lib/framework';
import { set } from 'lodash';

const element = document.getElementById('main') || document.body;
const debug = process.env.NODE_ENV === 'development';
start(app, element, debug)
  .then(stateManager => {
    // Store stateManager on the window in development.
    if (debug) { set(window, 'stateManager', stateManager); }
  });
