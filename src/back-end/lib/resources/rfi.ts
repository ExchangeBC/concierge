import { AvailableModels, SupportedRequestBodies } from 'back-end/lib/app';
import * as crud from 'back-end/lib/crud';
import * as permissions from 'back-end/lib/permissions';
import * as FileSchema from 'back-end/lib/schemas/file';
import * as RfiSchema from 'back-end/lib/schemas/rfi';
import { AppSession } from 'back-end/lib/schemas/session';
import * as UserSchema from 'back-end/lib/schemas/user';
import { basicResponse, JsonResponseBody, makeJsonResponseBody, mapRequestBody, Response } from 'back-end/lib/server';
import { validateFileIdArray, validateObjectIdString, validateUserId } from 'back-end/lib/validators';
import { get, isObject } from 'lodash';
import * as mongoose from 'mongoose';
import { getString, getStringArray, identityAsync } from 'shared/lib';
import { CreateValidationErrors, PublicRfi, UpdateValidationErrors } from 'shared/lib/resources/rfi';
import { ADT, PaginatedList, UserType } from 'shared/lib/types';
import { allValid, getInvalidValue, invalid, valid, validateBoolean, validateCategories, ValidOrInvalid } from 'shared/lib/validators';
import { validateAddendumDescriptions, validateClosingAt, validateDescription, validatePublicSectorEntity, validateRfiNumber, validateTitle } from 'shared/lib/validators/rfi';

type CreateRequestBody
  = ADT<201, PublicRfi>
  | ADT<401, CreateValidationErrors>
  | ADT<400, CreateValidationErrors>;

async function validateCreateRequestBody(RfiModel: RfiSchema.Model, UserModel: UserSchema.Model, FileModel: FileSchema.Model, raw: object, session: AppSession): Promise<ValidOrInvalid<InstanceType<RfiSchema.Model>, CreateValidationErrors>> {
  // Get raw values.
  const createdBy = getString(session.user, 'id');
  const closingAt = getString(raw, 'closingAt');
  const rfiNumber = getString(raw, 'rfiNumber');
  const title = getString(raw, 'title');
  const description = getString(raw, 'description');
  const publicSectorEntity = getString(raw, 'publicSectorEntity');
  const categories = getStringArray(raw, 'categories');
  const discoveryDay = get(raw, 'discoveryDay');
  const addenda = getStringArray(raw, 'addenda');
  const attachments = getStringArray(raw, 'attachments');
  const buyerContact = getString(raw, 'buyerContact');
  const programStaffContact = getString(raw, 'programStaffContact');
  // Validate individual values.
  const validatedCreatedBy = validateObjectIdString(createdBy);
  const validatedClosingAt = validateClosingAt(closingAt);
  const validatedRfiNumber = validateRfiNumber(rfiNumber);
  const validatedTitle = validateTitle(title);
  const validatedDescription = validateDescription(description);
  const validatedPublicSectorEntity = validatePublicSectorEntity(publicSectorEntity);
  const validatedCategories = validateCategories(categories, 'Commodity Code');
  const validatedDiscoveryDay = validateBoolean(discoveryDay);
  const validatedAddenda = validateAddendumDescriptions(addenda);
  const validatedAttachments = await validateFileIdArray(FileModel, attachments);
  // TODO ensure buyer has accepted terms.
  const validatedBuyerContact = await validateUserId(UserModel, buyerContact, UserType.Buyer, true);
  const validatedProgramStaffContact = await validateUserId(UserModel, programStaffContact, UserType.ProgramStaff);
  // Check if the payload is valid.
  if (allValid([validatedCreatedBy, validatedClosingAt, validatedRfiNumber, validatedTitle, validatedDescription, validatedPublicSectorEntity, validatedCategories, validatedDiscoveryDay, validatedAddenda, validatedAttachments, validatedBuyerContact, validatedProgramStaffContact])) {
    // If everything is valid, return the model.
    const createdAt = new Date();
    const version: RfiSchema.Version = {
      createdAt,
      createdBy: validatedCreatedBy.value as mongoose.Types.ObjectId,
      closingAt: validatedClosingAt.value as Date,
      rfiNumber: validatedRfiNumber.value as string,
      title: validatedTitle.value as string,
      description: validatedDescription.value as string,
      publicSectorEntity: validatedPublicSectorEntity.value as string,
      categories: validatedCategories.value as string[],
      discoveryDay: validatedDiscoveryDay.value as boolean,
      addenda: (validatedAddenda.value as string[]).map((description: string) => {
        return {
          createdAt,
          updatedAt: createdAt,
          description
        };
      }),
      attachments: validatedAttachments.value as mongoose.Types.ObjectId[],
      buyerContact: validatedBuyerContact.value as mongoose.Types.ObjectId,
      programStaffContact: validatedProgramStaffContact.value as mongoose.Types.ObjectId
    };
    const rfi = new RfiModel({
      createdAt,
      // TODO publishedAt will need to change when we add drafts.
      publishedAt: createdAt,
      versions: [version],
      discoveryDayResponses: []
    });
    return valid(rfi);
  } else {
    // If anything is invalid, return the validation errors.
    return invalid({
      permissions: validatedCreatedBy.tag === 'invalid' ? [permissions.ERROR_MESSAGE] : undefined,
      closingAt: getInvalidValue(validatedClosingAt, undefined),
      rfiNumber: getInvalidValue(validatedRfiNumber, undefined),
      title: getInvalidValue(validatedTitle, undefined),
      description: getInvalidValue(validatedDescription, undefined),
      publicSectorEntity: getInvalidValue(validatedPublicSectorEntity, undefined),
      categories: getInvalidValue(validatedCategories, undefined),
      discoveryDay: getInvalidValue(validatedDiscoveryDay, undefined),
      addenda: getInvalidValue(validatedAddenda, undefined),
      attachments: getInvalidValue(validatedAttachments, undefined),
      buyerContact: getInvalidValue(validatedBuyerContact, undefined),
      programStaffContact: getInvalidValue(validatedProgramStaffContact, undefined)
    });
  }
}

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
    const RfiModel = Models.Rfi;
    const FileModel = Models.File;
    const UserModel = Models.User;
    return {
      async transformRequest(request) {
        if (!permissions.createRfi(request.session)) {
          return mapRequestBody(request, {
            tag: 401 as 401,
            value: {
              permissions: [permissions.ERROR_MESSAGE]
            }
          });
        }
        if (request.body.tag !== 'json') {
          return mapRequestBody(request, {
            tag: 400 as 400,
            value: {
              contentType: ['File must be uploaded in a multipart request.']
            }
          });
        }
        const rawBody = isObject(request.body.value) ? request.body.value : {};
        const validatedBody: ValidOrInvalid<InstanceType<RfiSchema.Model>, CreateValidationErrors> = await validateCreateRequestBody(RfiModel, UserModel, FileModel, rawBody, request.session);
        switch (validatedBody.tag) {
          case 'valid':
            await validatedBody.value.save();
            return mapRequestBody(request, {
              tag: 201 as 201,
              value: await RfiSchema.makePublicRfi(UserModel, FileModel, validatedBody.value, request.session)
            });
          case 'invalid':
            return mapRequestBody(request, {
              tag: 400 as 400,
              value: validatedBody.value
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
            const publicRfi = await RfiSchema.makePublicRfi(UserModel, FileModel, rfi, request.session);
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
          const publicRfis = await Promise.all(rfis.map(rfi => RfiSchema.makePublicRfi(UserModel, FileModel, rfi, request.session)));
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
