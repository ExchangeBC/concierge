import { RouteHook } from 'back-end/lib/server';
import chalk from 'chalk';

const hook: RouteHook<any, any, any, any, number, any>  = {

  async before(request) {
    request.logger.info(`${chalk.gray('->')} ${request.method} ${request.path}`, request.session);
    return Date.now();
  },

  async after(startTime, request, response) {
    request.logger.info(`${chalk.gray('<-')} ${response.code} ${Date.now() - startTime}ms`);
  }

}

export default hook;
