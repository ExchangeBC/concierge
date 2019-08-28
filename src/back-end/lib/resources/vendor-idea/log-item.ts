import { AvailableModels, Session, SupportedRequestBodies } from 'back-end/lib/app/types';
import * as crud from 'back-end/lib/crud';
import * as permissions from 'back-end/lib/permissions';
import * as ViSchema from 'back-end/lib/schemas/vendor-idea';
import { basicResponse, JsonResponseBody, makeJsonResponseBody, Response } from 'back-end/lib/server';
import { validateVendorIdeaId } from 'back-end/lib/validators';
import { get, isObject } from 'lodash';
import { getString } from 'shared/lib';
import { CreateRequestBody, CreateValidationErrors, PublicLogItem } from 'shared/lib/resources/vendor-idea/log-item';
import { validateLogItemNote, validateLogItemType } from 'shared/lib/validators/vendor-idea/log-item';

type RequiredModels = 'VendorIdea' | 'User';

export type Resource = crud.Resource<SupportedRequestBodies, JsonResponseBody, AvailableModels, RequiredModels, CreateRequestBody, null, Session>;

type CreateResponseBody = JsonResponseBody<PublicLogItem | CreateValidationErrors>;

const resource: Resource = {

  routeNamespace: 'vendorIdeaLogItems',

  create(Models) {
    const ViModel = Models.VendorIdea;
    const UserModel = Models.User;
    return {
      async transformRequest(request) {
        const body = request.body.tag === 'json' && isObject(request.body.value) ? request.body.value : {};
        return {
          vendorIdeaId: getString(body, 'vendorIdeaId'),
          type: getString(body, 'type'),
          note: get(body, 'note')
        };
      },
      async respond(request): Promise<Response<CreateResponseBody, Session>> {
        const respond = (code: number, body: PublicLogItem | CreateValidationErrors) => basicResponse(code, request.session, makeJsonResponseBody(body));
        if (!(await permissions.createVendorIdeaLogItem(UserModel, request.session)) || !request.session.user) {
          return respond(401, {
            permissions: [permissions.ERROR_MESSAGE]
          });
        }
        const validatedVendorIdea = await validateVendorIdeaId(ViModel, request.body.vendorIdeaId);
        if (validatedVendorIdea.tag === 'invalid') {
          return respond(400, {
            vendorIdeaId: validatedVendorIdea.value
          });
        }
        const vendorIdea = validatedVendorIdea.value;
        const validatedType = validateLogItemType(request.body.type);
        if (validatedType.tag === 'invalid') {
          return respond(400, {
            type: validatedType.value
          });
        }
        const validatedNote = validateLogItemNote(request.body.type);
        if (validatedNote.tag === 'invalid') {
          return respond(400, {
            type: validatedNote.value
          });
        }
        const logItem: ViSchema.LogItem = {
          createdAt: new Date(),
          createdBy: request.session.user.id,
          type: validatedType.value,
          note: validatedNote.value
        };
        vendorIdea.log.push(logItem);
        await vendorIdea.save();
        return respond(201, await ViSchema.makePublicLogItem(UserModel, logItem));
      }
    };
  }

};

export default resource;
