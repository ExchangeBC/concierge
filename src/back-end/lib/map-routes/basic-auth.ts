import { authenticatePassword } from 'back-end/lib/security';
import { createMapRoute, JsonResponseBody, makeJsonResponseBody, MapHandler, MapHook, MapRoute } from 'back-end/lib/server';
import { ADT } from 'shared/lib/types';

type BasicAuthRequestBody<Body> = ADT<'authorized', Body> | ADT<'unauthorized'>;

type UnauthorizedResponseBody = JsonResponseBody<['Unauthorized']>;

function addBasicAuth<ReqBA, ReqBB, ResB, Session>(username: string, passwordHash: string): MapHandler<ReqBA, ReqBB, BasicAuthRequestBody<ReqBB>, ResB, ResB | UnauthorizedResponseBody, Session> {
  return (oldHandler) => ({
    async transformRequest(request) {
      const unauthorized: BasicAuthRequestBody<ReqBB> = { tag: 'unauthorized', value: undefined };
      let authHeader = request.headers.authorization;
      if (!authHeader) {
        return unauthorized;
      }
      authHeader = typeof authHeader === 'string' ? authHeader : authHeader[0];
      const basicAuthMatch = authHeader.match(/\s*Basic\s+(\S+)/);
      if (!basicAuthMatch) {
        return unauthorized;
      }
      const decoded = Buffer.from(basicAuthMatch[1], 'base64').toString('utf8');
      const [rawUsername = '', rawPassword = ''] = decoded.split(':');
      const authorized = rawUsername === username && (await authenticatePassword(rawPassword, passwordHash));
      if (!authorized) {
        return unauthorized;
      }
      return {
        tag: 'authorized',
        value: await oldHandler.transformRequest(request)
      } as BasicAuthRequestBody<ReqBB>;
    },

    async respond(request) {
      switch (request.body.tag) {
        case 'authorized':
          return await oldHandler.respond({
            ...request,
            body: request.body.value as ReqBB
          });
        case 'unauthorized':
          return {
            code: 401,
            headers: {
              'www-authenticate': 'Basic realm="Restricted website."'
            },
            session: request.session,
            body: makeJsonResponseBody(['Unauthorized'] as ['Unauthorized'])
          };
      }
    }
  });
}

interface Params<ReqB, ResB, HookState, Session> {
  username: string;
  passwordHash: string;
  mapHook: MapHook<ReqB, BasicAuthRequestBody<ReqB>, ResB, ResB | UnauthorizedResponseBody, HookState, HookState, Session>;
}

export default function <ReqBA, ReqBB, ResB, HookState, Session>(params: Params<ReqBB, ResB, HookState, Session>): MapRoute<ReqBA, ReqBB, BasicAuthRequestBody<ReqBB>, ResB, ResB | UnauthorizedResponseBody, HookState, HookState, Session> {
  return createMapRoute(addBasicAuth(params.username, params.passwordHash), params.mapHook);
}
