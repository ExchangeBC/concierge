import { AvailableModels, Session, SupportedRequestBodies } from 'back-end/lib/app/types';
import * as crud from 'back-end/lib/crud';
import * as mailer from 'back-end/lib/mailer';
import * as permissions from 'back-end/lib/permissions';
import * as FileSchema from 'back-end/lib/schemas/file';
import { SessionUser } from 'back-end/lib/schemas/session';
import * as UserSchema from 'back-end/lib/schemas/user';
import * as ViSchema from 'back-end/lib/schemas/vendor-idea';
import { basicResponse, JsonResponseBody, makeErrorResponseBody, makeJsonResponseBody, Response } from 'back-end/lib/server';
import { validateFileIdArray, validateUserId, validateVendorIdeaId } from 'back-end/lib/validators';
import { get, isObject } from 'lodash';
import { getString, getStringArray } from 'shared/lib';
import { CreateRequestBody, CreateValidationErrors, PublicVendorIdea, PublicVendorIdeaSlim, UpdateRequestBody, UpdateValidationErrors } from 'shared/lib/resources/vendor-idea';
import { getLatestStatus, LogItemType } from 'shared/lib/resources/vendor-idea/log-item';
import { PaginatedList, profileToName, UserType } from 'shared/lib/types';
import { allValid, getInvalidValue, invalid, valid, ValidOrInvalid } from 'shared/lib/validators';
import { validateContact, validateDescription, validateEligibility } from 'shared/lib/validators/vendor-idea';

type RequiredModels = 'VendorIdea' | 'User' | 'File';

export type Resource = crud.Resource<SupportedRequestBodies, JsonResponseBody, AvailableModels, RequiredModels, CreateRequestBody, UpdateRequestBody, Session>;

type CreateResponseBody = JsonResponseBody<PublicVendorIdea | CreateValidationErrors>;

type ReadOneResponseBody = JsonResponseBody<PublicVendorIdea | string[]>;

type ReadManyResponseBody = JsonResponseBody<PaginatedList<PublicVendorIdeaSlim> | string[]>;

type UpdateResponseBody = JsonResponseBody<PublicVendorIdea | UpdateValidationErrors>;

function makeCreateRequestBody(body: object): CreateRequestBody {
  return {
    description: {
      title: getString(body, ['description', 'title']),
      summary: getString(body, ['description', 'summary']),
      industrySectors: getStringArray(body, ['description', 'industrySectors']),
      categories: getStringArray(body, ['description', 'categories'])
    },
    eligibility: {
      existingPurchase: get(body, ['eligibility', 'existingPurchase']),
      productOffering: getString(body, ['eligibility', 'productOffering']),
      innovationDefinitions: get(body, ['eligibility', 'innovationDefinitions'], [])
    },
    contact: {
      name: getString(body, ['contact', 'name']),
      email: getString(body, ['contact', 'email']),
      phoneNumber: get(body, ['contact', 'phoneNumber'])
    },
    attachments: getStringArray(body, 'attachments')
  };
}

function makeUpdateRequestBody(body: object): UpdateRequestBody {
  return makeCreateRequestBody(body);
}

async function validateCreateRequestBody(UserModel: UserSchema.Model, FileModel: FileSchema.Model, body: CreateRequestBody, sessionUser: SessionUser): Promise<ValidOrInvalid<ViSchema.Version, CreateValidationErrors>> {
  const validatedCreatedBy = await validateUserId(UserModel, sessionUser.id, [UserType.Vendor], true);
  const validatedAttachments = await validateFileIdArray(FileModel, body.attachments);
  const validatedEligibility = validateEligibility(body.eligibility);
  const validatedContact = validateContact(body.contact);
  const validatedDescription = validateDescription(body.description);
  if (allValid([validatedCreatedBy, validatedAttachments, validatedEligibility, validatedContact, validatedDescription])) {
    return valid({
      createdAt: new Date(),
      createdBy: (validatedCreatedBy.value as InstanceType<UserSchema.Model>)._id,
      attachments: (validatedAttachments.value as Array<InstanceType<FileSchema.Model>>).map(file => file._id),
      eligibility: validatedEligibility.value,
      contact: validatedContact.value,
      description: validatedDescription.value
    } as ViSchema.Version);
  } else {
    return invalid({
      createdBy: getInvalidValue(validatedCreatedBy, undefined),
      description: getInvalidValue(validatedDescription, undefined),
      eligibility: getInvalidValue(validatedEligibility, undefined),
      contact: getInvalidValue(validatedContact, undefined),
      attachments: getInvalidValue(validatedAttachments, undefined)
    });
  }
}

async function validateUpdateRequestBody(UserModel: UserSchema.Model, FileModel: FileSchema.Model, body: CreateRequestBody, sessionUser: SessionUser): Promise<ValidOrInvalid<ViSchema.Version, CreateValidationErrors>> {
  const validatedCreatedBy = await validateUserId(UserModel, sessionUser.id, [UserType.ProgramStaff, UserType.Vendor], true);
  const validatedAttachments = await validateFileIdArray(FileModel, body.attachments);
  const validatedEligibility = validateEligibility(body.eligibility);
  const validatedContact = validateContact(body.contact);
  const validatedDescription = validateDescription(body.description);
  if (allValid([validatedCreatedBy, validatedAttachments, validatedEligibility, validatedContact, validatedDescription])) {
    return valid({
      createdAt: new Date(),
      createdBy: (validatedCreatedBy.value as InstanceType<UserSchema.Model>)._id,
      attachments: (validatedAttachments.value as Array<InstanceType<FileSchema.Model>>).map(file => file._id),
      eligibility: validatedEligibility.value,
      contact: validatedContact.value,
      description: validatedDescription.value
    } as ViSchema.Version);
  } else {
    return invalid({
      createdBy: getInvalidValue(validatedCreatedBy, undefined),
      description: getInvalidValue(validatedDescription, undefined),
      eligibility: getInvalidValue(validatedEligibility, undefined),
      contact: getInvalidValue(validatedContact, undefined),
      attachments: getInvalidValue(validatedAttachments, undefined)
    });
  }
}

const resource: Resource = {

  routeNamespace: 'vendorIdeas',

  create(Models) {
    const ViModel = Models.VendorIdea;
    const UserModel = Models.User;
    const FileModel = Models.File;
    return {
      async transformRequest(request) {
        const body = request.body.tag === 'json' && isObject(request.body.value) ? request.body.value : {};
        return makeCreateRequestBody(body);
      },
      async respond(request): Promise<Response<CreateResponseBody, Session>> {
        const respond = (code: number, body: PublicVendorIdea | CreateValidationErrors) => basicResponse(code, request.session, makeJsonResponseBody(body));
        if (!(await permissions.createVendorIdea(UserModel, request.session)) || !request.session.user) {
          return respond(401, {
            permissions: [permissions.ERROR_MESSAGE]
          });
        }
        const validatedVersion = await validateCreateRequestBody(UserModel, FileModel, request.body, request.session.user);
        if (validatedVersion.tag === 'invalid') {
          return respond(400, validatedVersion.value);
        }
        const version = validatedVersion.value;
        const vendorIdea = new ViModel({
          createdAt: version.createdAt,
          createdBy: version.createdBy,
          versions: [version],
          log: [{
            createdAt: version.createdAt,
            type: LogItemType.ApplicationSubmitted,
            note: 'The vendor submitted this application.'
          }]
        });
        await vendorIdea.save();
        const user = await UserModel.findById(version.createdBy);
        if (user) {
          mailer.createViToProgramStaff({
            title: version.description.title,
            createdAt: version.createdAt,
            id: vendorIdea._id,
            vendorName: profileToName(user.profile)
          });
        }
        return respond(201, await ViSchema.makePublicVendorIdea(UserModel, FileModel, vendorIdea, request.session.user.type));
      }
    };
  },

  readOne(Models) {
    const ViModel = Models.VendorIdea;
    const UserModel = Models.User;
    const FileModel = Models.File;
    return {
      async transformRequest({ body }) {
        return body;
      },
      async respond(request): Promise<Response<ReadOneResponseBody, Session>> {
        if (!(await permissions.readOneVendorIdea(UserModel, request.session)) || !request.session.user) {
          return basicResponse(401, request.session, makeJsonResponseBody([permissions.ERROR_MESSAGE]));
        }
        try {
          const publicVendorIdea = await ViSchema.findPublicVendorIdeaByIdUnsafely(ViModel, UserModel, FileModel, request.params.id, request.session.user.type);
          switch (request.session.user.type) {
            case UserType.ProgramStaff:
              return basicResponse(200, request.session, makeJsonResponseBody(publicVendorIdea));
            default:
              // Only return vendor idea if its a vendor's own idea
              // or if a buyer has accepted the terms and is verified.
              const isVendorsOwnIdea = publicVendorIdea.userType === UserType.Vendor && publicVendorIdea.createdBy._id === request.session.user.id.toString();
              if (isVendorsOwnIdea || await validateUserId(UserModel, request.session.user.id, [UserType.Buyer], true, true)) {
                return basicResponse(200, request.session, makeJsonResponseBody(publicVendorIdea));
              }
              return basicResponse(404, request.session, makeJsonResponseBody(['Not Found']));
          }
        } catch (error) {
          error = makeErrorResponseBody(error);
          request.logger.error('unable to find vendor idea', error.value);
          return basicResponse(500, request.session, error);
        }
      }
    };
  },

  readMany(Models) {
    const ViModel = Models.VendorIdea;
    const UserModel = Models.User;
    return {
      async transformRequest({ body }) {
        return body;
      },
      async respond(request): Promise<Response<ReadManyResponseBody, Session>> {
        if (!(await permissions.readManyVendorIdeas(UserModel, request.session)) || !request.session.user) {
          return basicResponse(401, request.session, makeJsonResponseBody([permissions.ERROR_MESSAGE]));
        }
        try {
          const query = await ViModel.find();
          const items: PublicVendorIdeaSlim[] = [];
          for await (const idea of query) {
            const isVendorsOwnIdea = request.session.user.type === UserType.Vendor && idea.createdBy.toString() === request.session.user.id.toString();
            const isBuyerEligibleIdea = request.session.user.type === UserType.Buyer && getLatestStatus(idea.log) === LogItemType.Eligible;
            const isProgramStaff = request.session.user.type === UserType.ProgramStaff;
            if (isVendorsOwnIdea || isBuyerEligibleIdea || isProgramStaff) {
              items.push(await ViSchema.makePublicVendorIdeaSlim(UserModel, idea, request.session.user.type));
            }
          }
          return basicResponse(200, request.session, makeJsonResponseBody({
            total: items.length,
            offset: 0,
            count: items.length,
            items
          }));
        } catch (error) {
          error = makeErrorResponseBody(error);
          request.logger.error('Unable to read many vendor ideas.', error.value);
          return basicResponse(500, request.session, error);
        }
      }
    };
  },

  update(Models) {
    const ViModel = Models.VendorIdea;
    const UserModel = Models.User;
    const FileModel = Models.File;
    return {
      async transformRequest(request) {
        const body = request.body.tag === 'json' && isObject(request.body.value) ? request.body.value : {};
        return makeUpdateRequestBody(body);
      },
      async respond(request): Promise<Response<UpdateResponseBody, Session>> {
        const respond = (code: number, body: PublicVendorIdea | UpdateValidationErrors) => basicResponse(code, request.session, makeJsonResponseBody(body));
        if (!(await permissions.updateVendorIdea(UserModel, request.session)) || !request.session.user) {
          return respond(401, {
            permissions: [permissions.ERROR_MESSAGE]
          });
        }
        const validatedVendorIdea = await validateVendorIdeaId(
          ViModel,
          request.params.id,
          // Vendors can only edit their own ideas that have the "EditsRequired" status.
          request.session.user.type === UserType.Vendor ? [LogItemType.EditsRequired] : undefined
        );
        if (validatedVendorIdea.tag === 'invalid') {
          return respond(404, {
            vendorIdeaId: validatedVendorIdea.value
          });
        }
        const vendorIdea = validatedVendorIdea.value;
        const validatedVersion = await validateUpdateRequestBody(UserModel, FileModel, request.body, request.session.user);
        if (validatedVersion.tag === 'invalid') {
          return respond(400, validatedVersion.value);
        }
        const version = validatedVersion.value;
        vendorIdea.versions.push(version);
        if (request.session.user.type === UserType.Vendor) {
          vendorIdea.log.push({
            createdAt: version.createdAt,
            type: LogItemType.EditsSubmitted,
            note: 'The vendor has submitted changes to their application.'
          });
        }
        await vendorIdea.save();
        if (request.session.user.type === UserType.Vendor) {
          const user = await UserModel.findById(version.createdBy);
          if (user) {
            mailer.updateViToProgramStaffByVendor({
              title: version.description.title,
              editsReceivedAt: version.createdAt,
              id: vendorIdea._id,
              vendorName: profileToName(user.profile)
            });
          }
        }
        return respond(200, await ViSchema.makePublicVendorIdea(UserModel, FileModel, vendorIdea, request.session.user.type));
      }
    };
  }

};

export default resource;
