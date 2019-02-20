import app from './app';
import { start } from './lib/framework';

start(app, document.getElementById('main') || document.body, true);
