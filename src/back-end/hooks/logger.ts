import chalk from 'chalk';
import { RouteHook } from '../lib/server';

const hook: RouteHook<any, any, any, any, number>  = {

  async before(request) {
    request.logger.info(`${chalk.gray('->')} ${request.method} ${request.path}`);
    return Date.now();
  },

  async after(startTime, request, response) {
    request.logger.info(`${chalk.gray('<-')} ${response.code} ${Date.now() - startTime}ms`);
  }

}

export default hook;
