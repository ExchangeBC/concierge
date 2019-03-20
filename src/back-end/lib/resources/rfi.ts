import { AvailableModels, SupportedRequestBodies } from 'back-end/lib/app';
import * as crud from 'back-end/lib/crud';
import * as permissions from 'back-end/lib/permissions';
// import * as FileSchema from 'back-end/lib/schemas/file';
import * as RfiSchema from 'back-end/lib/schemas/rfi';
import { AppSession } from 'back-end/lib/schemas/session';
import { basicResponse, JsonResponseBody, makeJsonResponseBody, mapRequestBody, Response } from 'back-end/lib/server';
import { get } from 'lodash';
import { identityAsync } from 'shared/lib';
import { PublicRfi } from 'shared/lib/resources/rfi';
import { PaginatedList } from 'shared/lib/types';
import { ADT } from 'shared/lib/types';

interface CreateValidationErrors {
  permissions?: string[];
  contentType?: string[];
  closingAt?: string[];
  rfiNumber?: string[];
  title?: string[];
  description?: string[];
  publicSectorEntity?: string[];
  categories?: string[];
  discoveryDay?: string[];
  addenda?: string[][];
  attachments?: string[][];
  buyerContact?: string[];
  programStaffContact?: string[];
}

interface UpdateValidationErrors extends CreateValidationErrors {
  rfiId?: string[];
}

type CreateRequestBody
  = ADT<200, PublicRfi>
  | ADT<401, CreateValidationErrors>
  | ADT<400, CreateValidationErrors>;

type CreateResponseBody = JsonResponseBody<PublicRfi | CreateValidationErrors>;

type ReadOneResponseBody = JsonResponseBody<PublicRfi | string[]>;

type ReadManyResponseBody = JsonResponseBody<PaginatedList<PublicRfi> | string[]>;

type UpdateRequestBody
  = ADT<200, PublicRfi>
  | ADT<401, UpdateValidationErrors>
  | ADT<400, UpdateValidationErrors>;

type UpdateResponseBody = JsonResponseBody<PublicRfi | UpdateValidationErrors>;

type RequiredModels = 'Rfi' | 'User' | 'File';

export type Resource = crud.Resource<SupportedRequestBodies, JsonResponseBody, AvailableModels, RequiredModels, CreateRequestBody, UpdateRequestBody, AppSession>;

export const resource: Resource = {

  routeNamespace: 'rfis',

  create(Models) {
    // const RfiModel = Models.Rfi;
    // const FileModel = Models.File;
    // const UserModel = Models.User;
    return {
      async transformRequest(request) {
        if (!permissions.createRfi(request.session)) {
          return mapRequestBody(request, {
            tag: 401 as 401,
            value: {
              permissions: [permissions.ERROR_MESSAGE]
            }
          });
        } else if (request.body.tag !== 'json') {
          return mapRequestBody(request, {
            tag: 400 as 400,
            value: {
              contentType: ['File must be uploaded in a multipart request.']
            }
          });
        } else {
          // TODO business logic
          return mapRequestBody(request, {
            tag: 400 as 400,
            value: {
              contentType: ['File must be uploaded in a multipart request.']
            }
          });
        }
      },
      async respond(request): Promise<Response<CreateResponseBody, AppSession>> {
        return basicResponse(request.body.tag, request.session, makeJsonResponseBody(request.body.value));
      }
    };
  },

  readOne(Models) {
    const RfiModel = Models.Rfi;
    const FileModel = Models.File;
    const UserModel = Models.User;
    return {
      transformRequest: identityAsync,
      async respond(request): Promise<Response<ReadOneResponseBody, AppSession>> {
        if (!permissions.readOneRfi()) {
          return basicResponse(401, request.session, makeJsonResponseBody([permissions.ERROR_MESSAGE]));
        } else {
          const rfi = await RfiModel.findById(request.params.id);
          if (!rfi) {
            return basicResponse(404, request.session, makeJsonResponseBody(['RFI not found']));
          } else {
            const publicRfi = await RfiSchema.makePublicRfi(UserModel, FileModel, rfi, get(request.session.user, 'type'));
            return basicResponse(200, request.session, makeJsonResponseBody(publicRfi));
          }
        }
      }
    };
  },

  // TODO pagination.
  readMany(Models) {
    const RfiModel = Models.Rfi;
    const FileModel = Models.File;
    const UserModel = Models.User;
    return {
      transformRequest: identityAsync,
      async respond(request): Promise<Response<ReadManyResponseBody, AppSession>> {
        if (!permissions.readManyRfis()) {
          return basicResponse(401, request.session, makeJsonResponseBody([permissions.ERROR_MESSAGE]));
        } else {
          const rfis = await RfiModel.find().exec();
          const publicRfis = await Promise.all(rfis.map(rfi => RfiSchema.makePublicRfi(UserModel, FileModel, rfi, get(request.session.user, 'type'))));
          return basicResponse(200, request.session, makeJsonResponseBody({
            total: publicRfis.length,
            offset: 0,
            count: publicRfis.length,
            items: publicRfis
          }));
        }
      }
    };
  },

  update(Models) {
    // const RfiModel = Models.Rfi;
    // const FileModel = Models.File;
    // const UserModel = Models.User;
    return {
      async transformRequest(request) {
        if (!permissions.createRfi(request.session)) {
          return mapRequestBody(request, {
            tag: 401 as 401,
            value: {
              permissions: [permissions.ERROR_MESSAGE]
            }
          });
        } else if (request.body.tag !== 'json') {
          return mapRequestBody(request, {
            tag: 400 as 400,
            value: {
              contentType: ['File must be uploaded in a multipart request.']
            }
          });
        } else {
          // TODO business logic
          return mapRequestBody(request, {
            tag: 400 as 400,
            value: {
              contentType: ['File must be uploaded in a multipart request.']
            }
          });
        }
      },
      async respond(request): Promise<Response<UpdateResponseBody, AppSession>> {
        return basicResponse(request.body.tag, request.session, makeJsonResponseBody(request.body.value));
      }
    };
  }

}

export default resource;
