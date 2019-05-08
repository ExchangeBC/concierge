import { AvailableModels, Session, SupportedRequestBodies } from 'back-end/lib/app/types';
import * as crud from 'back-end/lib/crud';
import * as notifications from 'back-end/lib/mailer/notifications';
import * as permissions from 'back-end/lib/permissions';
import * as FileSchema from 'back-end/lib/schemas/file';
import * as RfiSchema from 'back-end/lib/schemas/request-for-information';
import * as RfiResponseSchema from 'back-end/lib/schemas/request-for-information/response';
import * as UserSchema from 'back-end/lib/schemas/user';
import { basicResponse, JsonResponseBody, makeErrorResponseBody, makeJsonResponseBody, Response } from 'back-end/lib/server';
import { validateFileIdArray, validateRfiId, validateUserId } from 'back-end/lib/validators';
import { isObject } from 'lodash';
import { getString, getStringArray } from 'shared/lib';
import { CreateValidationErrors, PublicRfiResponse } from 'shared/lib/resources/request-for-information/response';
import { ADT, Omit, RfiStatus } from 'shared/lib/types';
import { getInvalidValue, invalid, valid, ValidOrInvalid } from 'shared/lib/validators';

type CreateRequestBody
  = ADT<201, PublicRfiResponse>
  | ADT<401, CreateValidationErrors>
  | ADT<400, CreateValidationErrors>;

async function validateCreateRequestBody(RfiResponseModel: RfiResponseSchema.Model, RfiModel: RfiSchema.Model, UserModel: UserSchema.Model, FileModel: FileSchema.Model, raw: object, session: Session): Promise<ValidOrInvalid<InstanceType<RfiResponseSchema.Model>, CreateValidationErrors>> {
  // Get raw values.
  const createdBy = getString(session.user, 'id');
  const rfiId = getString(raw, 'rfiId');
  const attachments = getStringArray(raw, 'attachments');
  // Validate individual values.
  const validatedCreatedBy = await validateUserId(UserModel, createdBy);
  const validatedRfi = await validateRfiId(RfiModel, rfiId, [RfiStatus.Open, RfiStatus.Closed], true);
  const validatedAttachments = await validateFileIdArray(FileModel, attachments);
  // Check if the payload is valid.
  if (validatedCreatedBy.tag === 'valid' && validatedRfi.tag === 'valid' && validatedAttachments.tag === 'valid') {
    // If everything is valid, return the model.
    const data: Omit<RfiResponseSchema.Data, '_id'> = {
      createdAt: new Date(),
      createdBy: validatedCreatedBy.value._id,
      rfi: validatedRfi.value._id,
      attachments: validatedAttachments.value.map(file => file._id)
    };
    return valid(new RfiResponseModel(data));
  } else {
    // If anything is invalid, return the validation errors.
    return invalid({
      permissions: validatedCreatedBy.tag === 'invalid' ? [permissions.ERROR_MESSAGE] : undefined,
      rfiId: getInvalidValue(validatedRfi, undefined),
      attachments: getInvalidValue(validatedAttachments, undefined)
    });
  }
}

type CreateResponseBody = JsonResponseBody<PublicRfiResponse | CreateValidationErrors>;

type RequiredModels = 'RfiResponse' | 'Rfi' | 'User' | 'File';

export type Resource = crud.Resource<SupportedRequestBodies, JsonResponseBody, AvailableModels, RequiredModels, CreateRequestBody, null, Session>;

export const resource: Resource = {

  routeNamespace: 'requestForInformationResponses',

  create(Models) {
    const RfiResponseModel = Models.RfiResponse;
    const RfiModel = Models.Rfi;
    const FileModel = Models.File;
    const UserModel = Models.User;
    return {
      async transformRequest(request) {
        if (!permissions.createRfiResponse(request.session)) {
          return {
            tag: 401 as 401,
            value: {
              permissions: [permissions.ERROR_MESSAGE]
            }
          };
        }
        if (request.body.tag !== 'json') {
          return {
            tag: 400 as 400,
            value: {
              contentType: ['Requests for Information must be created with a JSON request.']
            }
          };
        }
        const rawBody = isObject(request.body.value) ? request.body.value : {};
        const validatedVersion = await validateCreateRequestBody(RfiResponseModel, RfiModel, UserModel, FileModel, rawBody, request.session);
        switch (validatedVersion.tag) {
          case 'valid':
            const rfiResponse = validatedVersion.value;
            await rfiResponse.save();
            const publicRfiResponse = await RfiResponseSchema.makePublicRfiResponse(RfiModel, UserModel, FileModel, rfiResponse, request.session);
            // notify program staff
            try {
              const programStaffUsers = await UserSchema.findProgramStaff(UserModel);
              const programStaffEmails = programStaffUsers.map(user => user.email);
              await notifications.createRfiResponseProgramStaff({
                programStaffEmails,
                rfiResponse: publicRfiResponse
              });
            } catch (error) {
              request.logger.error('unable to send notification email to program staff for RFI response', {
                ...makeErrorResponseBody(error),
                rfiId: rfiResponse.rfi,
                rfiResponseId: rfiResponse._id
              });
            }
            return {
              tag: 201 as 201,
              value: publicRfiResponse
            };
          case 'invalid':
            return {
              tag: 400 as 400,
              value: validatedVersion.value
            };
        }
      },
      async respond(request): Promise<Response<CreateResponseBody, Session>> {
        return basicResponse(request.body.tag, request.session, makeJsonResponseBody(request.body.value));
      }
    };
  }

}

export default resource;
