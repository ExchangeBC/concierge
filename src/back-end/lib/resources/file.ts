import { AvailableModels, SupportedRequestBodies } from 'back-end/lib/app';
import * as crud from 'back-end/lib/crud';
import * as permissions from 'back-end/lib/permissions';
import * as FileSchema from 'back-end/lib/schemas/file';
import { AppSession } from 'back-end/lib/schemas/session';
import { basicResponse, JsonResponseBody, makeJsonResponseBody, mapRequestBody, Response } from 'back-end/lib/server';
import { renameSync, unlinkSync } from 'fs';
import { identityAsync } from 'shared/lib';
import { ADT } from 'shared/lib/types';

type CreateRequestBody
  = ADT<201, FileSchema.Data> // File uploaded and stored.
  | ADT<200, FileSchema.Data> // File already exists.
  | ADT<401, string[]>
  | ADT<400, string[]>;

type CreateResponseBody = JsonResponseBody<FileSchema.Data | string[]>;

type ReadOneResponseBody = JsonResponseBody<FileSchema.Data | string[]>;

type RequiredModels = 'File';

export type Resource = crud.Resource<SupportedRequestBodies, JsonResponseBody, AvailableModels, RequiredModels, CreateRequestBody, null, AppSession>;

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
        } else if (request.body.tag !== 'file') {
          return mapRequestBody(request, {
            tag: 400 as 400,
            value: ['File must be uploaded in a multipart request.']
          });
        } else {
          const rawFile = request.body.value;
          const originalName = rawFile.name;
          const hash = await FileSchema.hashFile(originalName, rawFile.path);
          const existingFile = await FileModel.findOne({ hash });
          if (existingFile) {
            // Delete the temporarily-stored file.
            unlinkSync(rawFile.path);
            return mapRequestBody(request, {
              tag: 200 as 200,
              value: existingFile
            });
          }
          const file = new FileModel({
            originalName,
            hash,
            createdAt: new Date()
          });
          await file.save();
          const storageName = FileSchema.getStorageName(file);
          renameSync(rawFile.path, storageName);
          return mapRequestBody(request, {
            tag: 201 as 201,
            value: file
          });
        }
      },
      async respond(request): Promise<Response<CreateResponseBody, AppSession>> {
        return basicResponse(request.body.tag, request.session, makeJsonResponseBody(request.body.value));
      }
    };
  },

  readOne(Models) {
    const FileModel = Models.File;
    return {
      transformRequest: identityAsync,
      async respond(request): Promise<Response<ReadOneResponseBody, AppSession>> {
        if (!permissions.readOneFile()) {
          return basicResponse(401, request.session, makeJsonResponseBody([permissions.ERROR_MESSAGE]));
        } else {
          const file = await FileModel.findById(request.params.id);
          if (!file) {
            return basicResponse(404, request.session, makeJsonResponseBody(['File not found']));
          } else {
            return basicResponse(200, request.session, makeJsonResponseBody(file));
          }
        }
      }
    };
  }

}

export default resource;
