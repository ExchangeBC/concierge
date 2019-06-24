import { AvailableModels, Session, SupportedRequestBodies } from 'back-end/lib/app/types';
import * as crud from 'back-end/lib/crud';
import * as mailer from 'back-end/lib/mailer';
import * as permissions from 'back-end/lib/permissions';
import * as FileSchema from 'back-end/lib/schemas/file';
import * as RfiSchema from 'back-end/lib/schemas/request-for-information';
import * as RfiResponseSchema from 'back-end/lib/schemas/request-for-information/response';
import * as UserSchema from 'back-end/lib/schemas/user';
import { basicResponse, JsonResponseBody, makeErrorResponseBody, makeJsonResponseBody, Response } from 'back-end/lib/server';
import { validateFileIdArray, validateRfiId, validateUserId } from 'back-end/lib/validators';
import { isObject } from 'lodash';
import { getString, getStringArray } from 'shared/lib';
import { CreateRequestBody, CreateValidationErrors, PublicRfiResponse } from 'shared/lib/resources/request-for-information/response';
import { Omit, RfiStatus } from 'shared/lib/types';
import { getInvalidValue, invalid, valid, ValidOrInvalid } from 'shared/lib/validators';

async function validateCreateRequestBody(RfiResponseModel: RfiResponseSchema.Model, RfiModel: RfiSchema.Model, UserModel: UserSchema.Model, FileModel: FileSchema.Model, body: CreateRequestBody, session: Session): Promise<ValidOrInvalid<InstanceType<RfiResponseSchema.Model>, CreateValidationErrors>> {
  // Get raw values.
  const createdBy = getString(session.user, 'id');
  const { rfiId, attachments } = body;
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
        const body = isObject(request.body.value) ? request.body.value : {};
        return {
          rfiId: getString(body, 'rfiId'),
          attachments: getStringArray(body, 'attachments')
        };
      },
      async respond(request): Promise<Response<CreateResponseBody, Session>> {
        const respond = (code: number, body: PublicRfiResponse | CreateValidationErrors) => basicResponse(code, request.session, makeJsonResponseBody(body));
        if (!permissions.createRfiResponse(request.session)) {
          return respond(401, {
            permissions: [permissions.ERROR_MESSAGE]
          });
        }
        const validatedVersion = await validateCreateRequestBody(RfiResponseModel, RfiModel, UserModel, FileModel, request.body, request.session);
        switch (validatedVersion.tag) {
          case 'valid':
            const rfiResponse = validatedVersion.value;
            await rfiResponse.save();
            const publicRfiResponse = await RfiResponseSchema.makePublicRfiResponse(RfiModel, UserModel, FileModel, rfiResponse, request.session);
            // notify program staff
            try {
              const programStaffUsers = await UserSchema.findProgramStaff(UserModel);
              const programStaffEmails = programStaffUsers.map(user => user.email);
              await mailer.createRfiResponseProgramStaff({
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
            return respond(201, publicRfiResponse);
          case 'invalid':
            return respond(400, validatedVersion.value);
        }
      }
    };
  }

}

export default resource;
