import { AvailableModels, SupportedRequestBodies } from 'back-end/lib/app';
import * as crud from 'back-end/lib/crud';
import * as permissions from 'back-end/lib/permissions';
import * as FileSchema from 'back-end/lib/schemas/file';
import { AppSession } from 'back-end/lib/schemas/session';
import { basicResponse, FileResponseBody, JsonResponseBody, makeJsonResponseBody, Response, tryMakeFileResponseBody } from 'back-end/lib/server';

type ReadOneResponseBody = FileResponseBody | JsonResponseBody<string[]>;

type RequiredModels = 'File';

export type Resource = crud.Resource<SupportedRequestBodies, JsonResponseBody | FileResponseBody, AvailableModels, RequiredModels, null, null, AppSession>;

export const resource: Resource = {

  routeNamespace: 'fileBlobs',

  readOne(Models) {
    const FileModel = Models.File;
    return {
      async transformRequest({ body }) {
        return body;
      },
      async respond(request): Promise<Response<ReadOneResponseBody, AppSession>> {
        const notFound = () => basicResponse(404, request.session, makeJsonResponseBody(['File not found']));
        const file = await FileModel.findById(request.params.id);
        if (!file) {
          return notFound();
        } else if (!permissions.readOneFileBlob(request.session, file.authLevel)) {
          return basicResponse(401, request.session, makeJsonResponseBody([permissions.ERROR_MESSAGE]));
        } else {
          const filePath = FileSchema.getStorageName(file);
          const contentDisposition = `attachment; filename="${file.originalName}"`;
          const body = tryMakeFileResponseBody(filePath, undefined, undefined, contentDisposition);
          if (!body) {
            return notFound();
          } else {
            return basicResponse(200, request.session, body);
          }
        }
      }
    };
  }

}

export default resource;
