import { RouteHook } from 'back-end/lib/server';
import chalk from 'chalk';

const hook: RouteHook<any, any, any, any, number, any>  = {

  async before(request) {
    const authenticated = request.session.user ? ' authenticated' : '';
    request.logger.debug('session', request.session.toJSON());
    request.logger.info(`${chalk.gray('->')} ${request.method} ${request.path}${authenticated}`);
    return Date.now();
  },

  async after(startTime, request, response) {
    request.logger.info(`${chalk.gray('<-')} ${response.code} ${Date.now() - startTime}ms`);
  }

}

export default hook;
