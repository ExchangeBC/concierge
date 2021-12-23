import { AvailableModels, Session, SupportedRequestBodies } from 'back-end/lib/app/types';
import * as crud from 'back-end/lib/crud';
import * as mailer from 'back-end/lib/mailer';
import * as permissions from 'back-end/lib/permissions';
import * as FileSchema from 'back-end/lib/schemas/file';
import * as RfiSchema from 'back-end/lib/schemas/request-for-information';
import * as UserSchema from 'back-end/lib/schemas/user';
import { basicResponse, JsonResponseBody, makeErrorResponseBody, makeJsonResponseBody, Response } from 'back-end/lib/server';
import { validateFileIdArray, validateUserId } from 'back-end/lib/validators';
import { get, isObject } from 'lodash';
import { getNumber, getString, getStringArray } from 'shared/lib';
import { Attendee, vendorIsSoloAttendee } from 'shared/lib/resources/discovery-day-response';
import { CreateDiscoveryDayBody, CreateRequestBody, CreateValidationErrors, DELETE_ADDENDUM_TOKEN, PublicDiscoveryDay, PublicRfi, UpdateRequestBody, UpdateValidationErrors } from 'shared/lib/resources/request-for-information';
import { PaginatedList, UserType, adt, VendorProfile } from 'shared/lib/types';
import { allValid, getInvalidValue, getValidValue, invalid, valid, validateCategories, ValidOrInvalid } from 'shared/lib/validators';
import { validateAddendumDescriptions, validateClosingDate, validateClosingTime, validateDescription, validateDiscoveryDay, validateGracePeriodDays, validatePublicSectorEntity, validateRfiNumber, validateTitle } from 'shared/lib/validators/request-for-information';
import { Model, Document } from 'mongoose';

async function validateCreateRequestBody(UserModel: UserSchema.Model, FileModel: FileSchema.Model, body: CreateRequestBody, session: Session): Promise<ValidOrInvalid<RfiSchema.Version, CreateValidationErrors>> {
  // Get raw values.
  const createdBy = getString(session.user, 'id');
  const { rfiNumber, title, publicSectorEntity, description, discoveryDay, closingDate, closingTime, gracePeriodDays, buyerContact, programStaffContact, categories, attachments, addenda } = body;
  // Validate individual values.
  const validatedCreatedBy = await validateUserId(UserModel, createdBy, [UserType.ProgramStaff]);
  const validatedClosingDate = validateClosingDate(closingDate);
  const validatedClosingTime = validateClosingTime(closingTime, getValidValue(validatedClosingDate, ''));
  const validatedGracePeriodDays = validateGracePeriodDays(gracePeriodDays);
  const validatedRfiNumber = validateRfiNumber(rfiNumber);
  const validatedTitle = validateTitle(title);
  const validatedDescription = validateDescription(description);
  const validatedPublicSectorEntity = validatePublicSectorEntity(publicSectorEntity);
  const validatedNumCategories = !categories.length ? invalid(['Please select at least one Commodity Code.']) : valid(null);
  const validatedCategories = validateCategories(categories, 'Commodity Code');
  const validatedDiscoveryDay = validateDiscoveryDay(discoveryDay);
  const validatedAddenda = validateAddendumDescriptions(addenda);
  const validatedAttachments = await validateFileIdArray(FileModel, attachments);
  const validatedBuyerContact = await validateUserId(UserModel, buyerContact, [UserType.Buyer], true, true);
  const validatedProgramStaffContact = await validateUserId(UserModel, programStaffContact, [UserType.ProgramStaff], true);
  // Check if the payload is valid.
  if (allValid([validatedCreatedBy, validatedClosingDate, validatedClosingTime, validatedGracePeriodDays, validatedRfiNumber, validatedTitle, validatedDescription, validatedPublicSectorEntity, validatedNumCategories, validatedCategories, validatedDiscoveryDay, validatedAddenda, validatedAttachments, validatedBuyerContact, validatedProgramStaffContact])) {
    // If everything is valid, return the version.
    const createdAt = new Date();
    const version: RfiSchema.Version = {
      createdAt,
      createdBy: (validatedCreatedBy.value as InstanceType<UserSchema.Model>)._id,
      closingAt: new Date(`${validatedClosingDate.value} ${validatedClosingTime.value}`),
      gracePeriodDays: validatedGracePeriodDays.value as number,
      rfiNumber: validatedRfiNumber.value as string,
      title: validatedTitle.value as string,
      description: validatedDescription.value as string,
      publicSectorEntity: validatedPublicSectorEntity.value as string,
      categories: validatedCategories.value as string[],
      discoveryDay: validatedDiscoveryDay.value as PublicDiscoveryDay | undefined,
      addenda: (validatedAddenda.value as string[]).map((description: string) => {
        return {
          createdAt,
          updatedAt: createdAt,
          description
        };
      }),
      attachments: (validatedAttachments.value as Array<InstanceType<FileSchema.Model>>).map((file) => file._id),
      buyerContact: (validatedBuyerContact.value as InstanceType<UserSchema.Model>)._id,
      programStaffContact: (validatedProgramStaffContact.value as InstanceType<UserSchema.Model>)._id
    };
    return valid(version);
  } else {
    // If anything is invalid, return the validation errors.
    return invalid({
      permissions: validatedCreatedBy.tag === 'invalid' ? [permissions.ERROR_MESSAGE] : undefined,
      closingDate: getInvalidValue(validatedClosingDate, undefined),
      closingTime: getInvalidValue(validatedClosingTime, undefined),
      gracePeriodDays: getInvalidValue(validatedGracePeriodDays, undefined),
      rfiNumber: getInvalidValue(validatedRfiNumber, undefined),
      title: getInvalidValue(validatedTitle, undefined),
      description: getInvalidValue(validatedDescription, undefined),
      publicSectorEntity: getInvalidValue(validatedPublicSectorEntity, undefined),
      numCategories: getInvalidValue(validatedNumCategories, undefined),
      categories: getInvalidValue(validatedCategories, undefined),
      discoveryDay: getInvalidValue(validatedDiscoveryDay, undefined),
      addenda: getInvalidValue(validatedAddenda, undefined),
      attachments: getInvalidValue(validatedAttachments, undefined),
      buyerContact: getInvalidValue(validatedBuyerContact, undefined),
      programStaffContact: getInvalidValue(validatedProgramStaffContact, undefined)
    });
  }
}

function getDiscoveryDayBody(raw: any): CreateDiscoveryDayBody | undefined {
  const body = get(raw, 'discoveryDay');
  return body
    ? {
        description: get(body, 'description', undefined),
        date: get(body, 'date', ''),
        time: get(body, 'time', ''),
        location: get(body, 'location', ''),
        venue: get(body, 'venue', ''),
        remoteAccess: get(body, 'remoteAccess', '')
      }
    : undefined;
}

function getImpactedAttendeesWhenDiscoveryDayHasChanged(attendees: Attendee[], oldRfiVersion?: RfiSchema.Version, newRfiVersion?: RfiSchema.Version): Attendee[] {
  if (!oldRfiVersion || !newRfiVersion || !oldRfiVersion.discoveryDay || !newRfiVersion.discoveryDay) {
    return [];
  }
  const oldDiscoveryDay = oldRfiVersion.discoveryDay;
  const newDiscoveryDay = newRfiVersion.discoveryDay;
  if (oldDiscoveryDay.occurringAt.toString() !== newDiscoveryDay.occurringAt.toString()) {
    return attendees;
  }
  let impactedAttendees: Attendee[] = [];
  if (oldDiscoveryDay.venue !== newDiscoveryDay.venue) {
    impactedAttendees = [...impactedAttendees, ...attendees.filter(({ remote }) => !remote)];
  }
  if (oldDiscoveryDay.remoteAccess !== newDiscoveryDay.remoteAccess) {
    impactedAttendees = [...impactedAttendees, ...attendees.filter(({ remote }) => remote)];
  }
  return impactedAttendees;
}

function hasDiscoveryDayBeenUpdated(oldRfiVersion?: RfiSchema.Version, newRfiVersion?: RfiSchema.Version): boolean {
  if (!oldRfiVersion || !newRfiVersion || !oldRfiVersion.discoveryDay || !newRfiVersion.discoveryDay) {
    return false;
  }
  const oldDiscoveryDay = oldRfiVersion.discoveryDay;
  const newDiscoveryDay = newRfiVersion.discoveryDay;
  return oldDiscoveryDay.occurringAt.toString() !== newDiscoveryDay.occurringAt.toString() || oldDiscoveryDay.venue !== newDiscoveryDay.venue || oldDiscoveryDay.remoteAccess !== newDiscoveryDay.remoteAccess;
}

function hasDiscoveryDayBeenDeleted(oldRfiVersion?: RfiSchema.Version, newRfiVersion?: RfiSchema.Version): boolean {
  return !!(oldRfiVersion && oldRfiVersion.discoveryDay && newRfiVersion && !newRfiVersion.discoveryDay);
}

type CreateResponseBody = JsonResponseBody<PublicRfi | CreateValidationErrors>;

type ReadOneResponseBody = JsonResponseBody<PublicRfi | string[]>;

type ReadManyResponseBody = JsonResponseBody<PaginatedList<PublicRfi> | string[]>;

type UpdateResponseBody = JsonResponseBody<PublicRfi | UpdateValidationErrors>;

export type Resource<RequiredModels extends keyof AvailableModels> = crud.Resource<SupportedRequestBodies, JsonResponseBody, AvailableModels, RequiredModels, CreateRequestBody, UpdateRequestBody | null, Session>;

type GetRfiModel<RfiModelName extends keyof AvailableModels> = (Models: Pick<AvailableModels, RfiModelName>) => RfiSchema.Model;

type GlobalPermissions = (session: Session) => boolean;

export function makeResource<RfiModelName extends keyof AvailableModels>(routeNamespace: string, getRfiModel: GetRfiModel<RfiModelName>, globalPermissions: GlobalPermissions): Resource<RfiModelName | 'User' | 'File'> {
  return {
    routeNamespace,

    create(Models) {
      const RfiModel = getRfiModel(Models);
      const FileModel = Models.File;
      const UserModel = Models.User;
      return {
        async transformRequest(request) {
          const body = request.body.tag === 'json' && isObject(request.body.value) ? request.body.value : {};
          return {
            closingDate: getString(body, 'closingDate'),
            closingTime: getString(body, 'closingTime'),
            gracePeriodDays: getNumber(body, 'gracePeriodDays', undefined),
            rfiNumber: getString(body, 'rfiNumber'),
            title: getString(body, 'title'),
            description: getString(body, 'description'),
            publicSectorEntity: getString(body, 'publicSectorEntity'),
            categories: getStringArray(body, 'categories'),
            discoveryDay: getDiscoveryDayBody(body),
            addenda: getStringArray(body, 'addenda'),
            attachments: getStringArray(body, 'attachments'),
            buyerContact: getString(body, 'buyerContact'),
            programStaffContact: getString(body, 'programStaffContact')
          };
        },
        async respond(request): Promise<Response<CreateResponseBody, Session>> {
          const respond = (code: number, body: PublicRfi | CreateValidationErrors) => basicResponse(code, request.session, makeJsonResponseBody(body));
          if (!globalPermissions(request.session) || !(await permissions.createRfi(UserModel, request.session))) {
            return respond(401, {
              permissions: [permissions.ERROR_MESSAGE]
            });
          }
          const validatedVersion = await validateCreateRequestBody(UserModel, FileModel, request.body, request.session);
          switch (validatedVersion.tag) {
            case 'valid':
              const version = validatedVersion.value;
              // Remove addenda matching the DELETE_ADDENDUM_TOKEN
              version.addenda = version.addenda.filter((addendum) => {
                return addendum.description !== DELETE_ADDENDUM_TOKEN;
              });
              const rfi = new RfiModel({
                createdAt: version.createdAt,
                // TODO publishedAt will need to change if drafts are added.
                publishedAt: null,
                versions: [version],
                discoveryDayResponses: []
              });
              await rfi.save();
              return respond(201, await RfiSchema.makePublicRfi(UserModel, FileModel, rfi, request.session));
            case 'invalid':
              return respond(400, validatedVersion.value);
          }
        }
      };
    },

    readOne(Models) {
      const RfiModel = getRfiModel(Models);
      const FileModel = Models.File;
      const UserModel = Models.User;
      return {
        async transformRequest({ body }) {
          return body;
        },
        async respond(request): Promise<Response<ReadOneResponseBody, Session>> {
          if (!globalPermissions(request.session) || !permissions.readOneRfi()) {
            return basicResponse(401, request.session, makeJsonResponseBody([permissions.ERROR_MESSAGE]));
          } else {
            let rfi: InstanceType<RfiSchema.Model> | null = null;
            try {
              rfi = await RfiModel.findById(request.params.id);
            } catch (error) {
              request.logger.error('unable to find RFI', makeErrorResponseBody(error).value);
            }
            if (!rfi || (!permissions.isProgramStaff(request.session) && !RfiSchema.hasBeenPublished(rfi))) {
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
      const RfiModel = getRfiModel(Models);
      const FileModel = Models.File;
      const UserModel = Models.User;
      return {
        async transformRequest({ body }) {
          return body;
        },
        async respond(request): Promise<Response<ReadManyResponseBody, Session>> {
          if (!globalPermissions(request.session) || !permissions.readManyRfis()) {
            return basicResponse(401, request.session, makeJsonResponseBody([permissions.ERROR_MESSAGE]));
          }
          // Depending on user type, we may need to return draft RFIs.
          // Only Program Staff can view draft RFIs
          let query;
          switch ((request.session.user && request.session.user.type) || '') {
            case UserType.ProgramStaff:
              query = {};
              break;
            default:
              query = { publishedAt: { $ne: null } };
              break;
          }
          let rfis = await RfiModel.find(query).exec();
          if (!permissions.isProgramStaff(request.session)) {
            rfis = rfis.filter((rfi) => {
              return RfiSchema.hasBeenPublished(rfi);
            });
          }
          const publicRfis = await Promise.all(rfis.map((rfi) => RfiSchema.makePublicRfi(UserModel, FileModel, rfi, request.session)));
          return basicResponse(
            200,
            request.session,
            makeJsonResponseBody({
              total: publicRfis.length,
              offset: 0,
              count: publicRfis.length,
              items: publicRfis
            })
          );
        }
      };
    },

    update(Models) {
      const RfiModel = getRfiModel(Models);
      const FileModel = Models.File;
      const UserModel = Models.User;
      return {
        async transformRequest(request) {
          const body = request.body.tag === 'json' && isObject(request.body.value) ? request.body.value : {};
          const tag = get(body, 'tag');
          const value = get(body, 'value');
          switch (tag) {
            case 'edit':
              return adt('edit', {
                closingDate: getString(value, 'closingDate'),
                closingTime: getString(value, 'closingTime'),
                gracePeriodDays: getNumber(value, 'gracePeriodDays', -1),
                rfiNumber: getString(value, 'rfiNumber'),
                title: getString(value, 'title'),
                description: getString(value, 'description'),
                publicSectorEntity: getString(value, 'publicSectorEntity'),
                categories: getStringArray(value, 'categories'),
                discoveryDay: getDiscoveryDayBody(value),
                addenda: getStringArray(value, 'addenda'),
                attachments: getStringArray(value, 'attachments'),
                buyerContact: getString(value, 'buyerContact'),
                programStaffContact: getString(value, 'programStaffContact')
              });
            case 'publish':
              return adt('publish');
            default:
              return null;
          }
        },
        async respond(request): Promise<Response<UpdateResponseBody, Session>> {
          const respond = (code: number, body: PublicRfi | UpdateValidationErrors) => basicResponse(code, request.session, makeJsonResponseBody(body));
          if (!globalPermissions(request.session) || !(await permissions.updateRfi(UserModel, request.session))) {
            return respond(401, {
              permissions: [permissions.ERROR_MESSAGE]
            });
          }
          if (!request || !request.body) {
            return respond(400, {
              rfi: adt('parseFailure')
            });
          }
          const rfi = await RfiModel.findById(request.params.id);
          if (!rfi) {
            return respond(404, {
              notFound: ['RFI not found']
            });
          }
          switch (request.body.tag) {
            case 'edit':
              const validatedVersion = await validateCreateRequestBody(UserModel, FileModel, request.body.value, request.session);
              switch (validatedVersion.tag) {
                case 'valid':
                  const currentVersion = RfiSchema.getLatestVersion(rfi);
                  const newVersion = validatedVersion.value;
                  // Update the addenda correctly (support deleting, updating and adding new addenda).
                  const now = new Date();
                  const newAddenda = newVersion.addenda.map((newAddendum, index) => {
                    const currentAddendum = get(currentVersion, ['addenda', index]);
                    if (currentAddendum && newAddendum.description !== currentAddendum.description) {
                      // Addendum has changed.
                      return {
                        createdAt: currentAddendum.createdAt,
                        updatedAt: now,
                        description: newAddendum.description
                      };
                    } else if (currentAddendum && newAddendum.description === currentAddendum.description) {
                      // The addendum has not changed, so we return the current addendum,
                      // which has the correct `updatedAt` date.
                      return currentAddendum;
                    } else {
                      // Return the addendum if it is new, unchanged or flagged for deletion.
                      // Re: flagged for deletion, we will remove it later in this function.
                      return newAddendum;
                    }
                  });
                  newVersion.addenda = newAddenda.filter((addendum) => {
                    return addendum.description !== DELETE_ADDENDUM_TOKEN;
                  });
                  // Persist the new version
                  rfi.versions.push(newVersion);
                  const publicRfi = await RfiSchema.makePublicRfi(UserModel, FileModel, rfi, request.session);
                  const existingDdrs = publicRfi.discoveryDayResponses || [];
                  const discoveryDayHasBeenUpdated = hasDiscoveryDayBeenUpdated(currentVersion, newVersion);
                  const discoveryDayHasBeenDeleted = hasDiscoveryDayBeenDeleted(currentVersion, newVersion);
                  if (discoveryDayHasBeenDeleted) {
                    // Remove existing discovery day responses if discovery day has been deleted.
                    rfi.discoveryDayResponses = [];
                  }
                  await rfi.save();
                  // Notifications.
                  for (const ddr of existingDdrs) {
                    // Discovery day has been updated
                    const impactedAttendeesByDiscoveryDayUpdate = getImpactedAttendeesWhenDiscoveryDayHasChanged(ddr.attendees, currentVersion, newVersion);
                    if (discoveryDayHasBeenUpdated && vendorIsSoloAttendee(ddr.vendor.email, ddr.attendees) && ddr.attendees[0] && impactedAttendeesByDiscoveryDayUpdate.length) {
                      mailer.updateDiscoveryDayToVendorSolo({
                        rfi,
                        to: ddr.vendor.email,
                        remote: ddr.attendees[0].remote
                      });
                    } else if (discoveryDayHasBeenUpdated) {
                      mailer.updateDiscoveryDayToVendor({ rfi, to: ddr.vendor.email });
                      if (impactedAttendeesByDiscoveryDayUpdate.length) {
                        mailer.updateDiscoveryDayToAttendees({
                          rfi,
                          vendor: ddr.vendor,
                          attendees: impactedAttendeesByDiscoveryDayUpdate
                        });
                      }
                    } else if (discoveryDayHasBeenDeleted) {
                      mailer.deleteDiscoveryDayToVendor({ rfi, to: ddr.vendor.email });
                      mailer.deleteDiscoveryDayToAttendees({
                        rfi,
                        vendor: ddr.vendor,
                        attendees: ddr.attendees
                      });
                    }
                  }
                  return respond(200, publicRfi);
                case 'invalid':
                  return respond(400, { rfi: adt('edit', validatedVersion.value) });
                default:
                  return respond(400, { rfi: adt('parseFailure') });
              }
            case 'publish':
              if (rfi.publishedAt) {
                return respond(400, { rfi: adt('publish', ['RFI has already been published']) });
              }
              // Update the RFI with a published date and respond with updates PublicRFI
              // RFI has already been validated at this point
              rfi.publishedAt = new Date();
              await rfi.save();
              const publicRfi = await RfiSchema.makePublicRfi(UserModel, FileModel, rfi, request.session);
              // Notify Vendors that have selected Areas of Interest that overlap with the RFI categories
              // We take the first match only to avoid sending multiple emails to a single vendor
              notifyMatchingVendors(UserModel, rfi);
              return respond(200, publicRfi);
            default:
              return respond(400, { rfi: adt('parseFailure') });
          }
        }
      };
    }
  };
}

export const resource = makeResource(
  'requestsForInformation',
  (Models) => Models.Rfi,
  () => true
);

const notifyMatchingVendors = async (UserModel: Model<UserSchema.Data & Document>, rfi: RfiSchema.Data & Document) => {
  const latestRfiVersion = RfiSchema.getLatestVersion(rfi);
  if (!latestRfiVersion) return;
  const matchingVendors = await UserModel.find({ 'profile.type': UserType.Vendor, 'profile.categories': { $in: latestRfiVersion.categories } });
  const vendorsAlreadyNotified: string[] = [];
  matchingVendors.forEach((vendor: UserSchema.Data & Document) => {
    if (!vendorsAlreadyNotified.includes(vendor._id)) {
      const match = getFirstMatch(latestRfiVersion.categories, (vendor.profile as VendorProfile).categories);
      mailer.rfiMatchingVendorSkills({ rfi, matchingCategory: match || '', vendor: vendor });
    }
  });
};

const getFirstMatch = (rfiCategories: string[], vendorInterests: string[]) => {
  const matches = rfiCategories.filter((category) => vendorInterests.includes(category));
  if (matches.length > 0) {
    return matches[0];
  }
  return null;
};

export default resource;
