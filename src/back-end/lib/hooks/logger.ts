import { Session } from 'back-end/lib/app/types';
import { RouteHook } from 'back-end/lib/server';
import chalk from 'chalk';

const hook: RouteHook<unknown, unknown, number, Session> = {
  async before(request) {
    request.logger.info(`${chalk.gray('->')} ${request.method} ${request.path}`, {
      sessionId: request.session.sessionId
    });
    return Date.now();
  },

  async after(startTime, request, response) {
    request.logger.info(`${chalk.gray('<-')} ${response.code} ${Date.now() - startTime}ms`);
  }
};

export default hook;
