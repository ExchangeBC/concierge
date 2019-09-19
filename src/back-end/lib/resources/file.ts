import { AvailableModels, Session, SupportedRequestBodies } from 'back-end/lib/app/types';
import * as crud from 'back-end/lib/crud';
import * as permissions from 'back-end/lib/permissions';
import * as FileSchema from 'back-end/lib/schemas/file';
import { basicResponse, JsonResponseBody, makeJsonResponseBody, Response } from 'back-end/lib/server';
import { renameSync } from 'fs';
import { PublicFile } from 'shared/lib/resources/file';
import { AuthLevel, UserType } from 'shared/lib/types';
import { validateFileName } from 'shared/lib/validators/file';

const DEFAULT_AUTH_LEVEL: AuthLevel<UserType> = {
  tag: 'any',
  value: undefined
};

type CreateResponseBody = JsonResponseBody<PublicFile | string[]>;

type ReadOneResponseBody = JsonResponseBody<PublicFile | string[]>;

type RequiredModels = 'File' | 'User';

export type Resource = crud.Resource<SupportedRequestBodies, JsonResponseBody, AvailableModels, RequiredModels, SupportedRequestBodies, null, Session>;

export const resource: Resource = {

  routeNamespace: 'files',

  create(Models) {
    const FileModel = Models.File;
    const UserModel = Models.User;
    return {
      async transformRequest({ body }) {
        return body;
      },
      async respond(request): Promise<Response<CreateResponseBody, Session>> {
        const respond = (code: number, body: PublicFile | string[]) => basicResponse(code, request.session, makeJsonResponseBody(body));
        if (!(await permissions.createFile(UserModel, request.session)) || !request.session.user) {
          return respond(401, [permissions.ERROR_MESSAGE]);
        } else if (request.body.tag !== 'file') {
          return respond(400, ['File must be uploaded in a multipart request.']);
        } else {
          const rawFile = request.body.value;
          let authLevel: AuthLevel<UserType> = DEFAULT_AUTH_LEVEL;
          let alias: string | undefined;
          if (rawFile.metadata) {
            const validatedAuthLevel = rawFile.metadata.authLevel;
            if (validatedAuthLevel.tag === 'invalid') {
              return respond(400, ['Invalid metadata.authLevel field.']);
            }
            authLevel = validatedAuthLevel.value || authLevel;
            alias = rawFile.metadata.alias;
          }
          // Only program staff can upload files with aliases.
          if (alias && request.session.user.type !== UserType.ProgramStaff) {
            return respond(401, [permissions.ERROR_MESSAGE, 'Only Program Staff can create files with aliases.']);
          }
          const validatedOriginalName = validateFileName(rawFile.name);
          if (validatedOriginalName.tag === 'invalid') {
            return respond(400, validatedOriginalName.value);
          }
          const originalName = validatedOriginalName.value;
          const createdBy = request.session.user.id;
          let hash = await FileSchema.hashFile(originalName, rawFile.path, authLevel, createdBy);
          // We only avoid storing a new file if no alias was specified.
          // The alias system runs into problems with hash-based file deduplication.
          if (!alias) {
            const existingFile = await FileModel.findOne({ hash });
            if (existingFile) {
              return respond(200, FileSchema.makePublicFile(existingFile));
            }
          }
          // Include the current time in the hash if an alias is provided
          // to support the database's unique hash index.
          const now = new Date();
          if (alias) {
            hash = await FileSchema.hashFile(originalName, rawFile.path, authLevel, createdBy, now);
          }
          const file = new FileModel({
            createdAt: now,
            createdBy: request.session.user.id,
            originalName,
            hash,
            authLevel,
            alias
          });
          await file.save();
          const storageName = FileSchema.getStorageName(file);
          renameSync(rawFile.path, storageName);
          return respond(201, FileSchema.makePublicFile(file));
        }
      }
    };
  },

  readOne(Models) {
    const FileModel = Models.File;
    return {
      async transformRequest({ body }) {
        return body;
      },
      async respond(request): Promise<Response<ReadOneResponseBody, Session>> {
        const file = await FileSchema.findFileByIdOrAlias(FileModel, request.params.id);
        if (!file) {
          return basicResponse(404, request.session, makeJsonResponseBody(['File not found']));
        } else if (!permissions.readOneFile(request.session, file.authLevel, file.createdBy && file.createdBy.toString())) {
          return basicResponse(401, request.session, makeJsonResponseBody([permissions.ERROR_MESSAGE]));
        } else {
          const publicFile = FileSchema.makePublicFile(file);
          return basicResponse(200, request.session, makeJsonResponseBody(publicFile));
        }
      }
    };
  }

}

export default resource;
