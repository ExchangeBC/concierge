import { AvailableModels, Session, SupportedRequestBodies } from 'back-end/lib/app/types';
import * as crud from 'back-end/lib/crud';
import * as permissions from 'back-end/lib/permissions';
import * as FileSchema from 'back-end/lib/schemas/file';
import { basicResponse, JsonResponseBody, makeJsonResponseBody, Response } from 'back-end/lib/server';
import { renameSync } from 'fs';
import { PublicFile } from 'shared/lib/resources/file';
import { AuthLevel, parseAuthLevel, parseUserType, UserType } from 'shared/lib/types';
import { validateFileName } from 'shared/lib/validators/file';

const DEFAULT_AUTH_LEVEL: AuthLevel<UserType> = {
  tag: 'any',
  value: undefined
};

type CreateResponseBody = JsonResponseBody<PublicFile | string[]>;

type ReadOneResponseBody = JsonResponseBody<PublicFile | string[]>;

type RequiredModels = 'File';

export type Resource = crud.Resource<SupportedRequestBodies, JsonResponseBody, AvailableModels, RequiredModels, SupportedRequestBodies, null, Session>;

export const resource: Resource = {

  routeNamespace: 'files',

  create(Models) {
    const FileModel = Models.File;
    return {
      async transformRequest({ body }) {
        return body;
      },
      async respond(request): Promise<Response<CreateResponseBody, Session>> {
        const respond = (code: number, body: PublicFile | string[]) => basicResponse(code, request.session, makeJsonResponseBody(body));
        if (!permissions.createFile(request.session)) {
          return respond(401, [permissions.ERROR_MESSAGE]);
        } else if (request.body.tag !== 'file') {
          return respond(400, ['File must be uploaded in a multipart request.']);
        } else {
          const rawFile = request.body.value;
          let authLevel: AuthLevel<UserType> = DEFAULT_AUTH_LEVEL;
          if (request.session.user && request.session.user.type !== UserType.ProgramStaff) {
            // Override the authLevel if the user is a Vendor or Buyer.
            // Only Program Staff should be able to view the files they upload.
            //
            // TODO we will eventually need to let the uploader access the
            // files they have uploaded. Under this scheme, they cannot
            // access the files they upload. This will require a database migration
            // when the time comes.
            authLevel = {
              tag: 'userType',
              value: [UserType.ProgramStaff]
            };
          } else {
            // Otherwise, if the user is a Program Staff, allow them to set the AuthLevel via the request body.
            const parsedAuthLevel: AuthLevel<UserType> | null  = rawFile.authLevel ? parseAuthLevel(rawFile.authLevel, parseUserType) : null;
            if (!parsedAuthLevel && rawFile.authLevel) {
              return respond(400, ['Invalid authLevel field.']);
            }
            authLevel = parsedAuthLevel || authLevel;
          }
          const validatedOriginalName = validateFileName(rawFile.name);
          if (validatedOriginalName.tag === 'invalid') {
            return respond(400, validatedOriginalName.value);
          }
          const originalName = validatedOriginalName.value;
          const hash = await FileSchema.hashFile(originalName, rawFile.path, authLevel);
          const existingFile = await FileModel.findOne({ hash });
          if (existingFile) {
            return respond(200, FileSchema.makePublicFile(existingFile));
          }
          const file = new FileModel({
            createdAt: new Date(),
            originalName,
            hash,
            authLevel
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
        const file = await FileModel.findById(request.params.id);
        if (!file) {
          return basicResponse(404, request.session, makeJsonResponseBody(['File not found']));
        } else if (!permissions.readOneFile(request.session, file.authLevel)) {
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
