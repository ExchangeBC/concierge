import app from 'front-end/lib/app/index';
import { start } from 'front-end/lib/framework';

start(app, document.getElementById('main') || document.body, true);
