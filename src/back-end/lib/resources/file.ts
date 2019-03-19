import { AvailableModels, SupportedRequestBodies } from 'back-end/lib/app';
import * as crud from 'back-end/lib/crud';
import * as permissions from 'back-end/lib/permissions';
import * as FileSchema from 'back-end/lib/schemas/file';
import * as SessionSchema from 'back-end/lib/schemas/session';
import { basicResponse, mapRequestBody } from 'back-end/lib/server';
import { renameSync } from 'fs';
import { get } from 'lodash';
import { identityAsync } from 'shared/lib';
import { ADT } from 'shared/lib/types';

type CreateRequestBody
  = ADT<201, FileSchema.Data>
  | ADT<401, string[]>
  | ADT<400, string[]>;

type CreateResponseBody = FileSchema.Data | string[];

type ReadOneResponseBody = FileSchema.Data | string[];

type RequiredModels = 'File';

export type Resource = crud.Resource<SupportedRequestBodies, AvailableModels, RequiredModels, CreateRequestBody, CreateResponseBody, ReadOneResponseBody, null, null, null, null, null, SessionSchema.AppSession>;

export const resource: Resource = {

  routeNamespace: 'files',

  create(Models) {
    const FileModel = Models.File;
    return {
      async transformRequest(request) {
        if (false && !permissions.createFile(request.session)) {
          return mapRequestBody(request, {
            tag: 401 as 401,
            value: [permissions.ERROR_MESSAGE]
          });
        } else if (request.body.tag !== 'multipart') {
          return mapRequestBody(request, {
            tag: 400 as 400,
            value: ['Files must be uploaded in a multipart request.']
          });
        } else {
          const rawFile = get(request.body.value.files, ['file', '0']);
          if (!rawFile) {
            return mapRequestBody(request, {
              tag: 400 as 400,
              value: ['No file was provided to upload.']
            });
          }
          const originalName = rawFile.originalFilename;
          const hash = await FileSchema.hashFile(rawFile.path);
          const file = new FileModel({
            originalName,
            hash,
            createdAt: new Date()
          });
          const storageName = FileSchema.getStorageName(file);
          renameSync(rawFile.path, storageName);
          await file.save();
          return mapRequestBody(request, {
            tag: 201 as 201,
            value: file
          });
        }
      },
      async respond(request) {
        return basicResponse(request.body.tag, request.session, request.body.value);
      }
    };
  },

  readOne(Models) {
    const FileModel = Models.File;
    return {
      transformRequest: identityAsync,
      async respond(request) {
        if (!permissions.readOneFile()) {
          return basicResponse(401, request.session, [permissions.ERROR_MESSAGE]);
        } else {
          const file = await FileModel.findById(request.params.id);
          if (!file) {
            return basicResponse(404, request.session, ['File not found']);
          } else {
            return basicResponse(200, request.session, file);
          }
        }
      }
    };
  }

}

export default resource;
