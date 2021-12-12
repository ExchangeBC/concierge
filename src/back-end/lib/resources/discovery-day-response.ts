import { AvailableModels, Session, SupportedRequestBodies } from 'back-end/lib/app/types';
import * as crud from 'back-end/lib/crud';
import * as mailer from 'back-end/lib/mailer';
import * as permissions from 'back-end/lib/permissions';
import * as RfiSchema from 'back-end/lib/schemas/request-for-information';
import * as UserSchema from 'back-end/lib/schemas/user';
import { basicResponse, JsonResponseBody, makeJsonResponseBody, Response } from 'back-end/lib/server';
import { validateRfiId, validateUserId } from 'back-end/lib/validators';
import { get } from 'lodash';
import * as mongoose from 'mongoose';
import { getString } from 'shared/lib';
import { CreateRequestBody, CreateValidationErrors, diffAttendees, PublicDiscoveryDayResponse, UpdateRequestBody, UpdateValidationErrors, vendorIsSoloAttendee } from 'shared/lib/resources/discovery-day-response';
import { discoveryDayHasPassed } from 'shared/lib/resources/request-for-information';
import { PaginatedList } from 'shared/lib/types';
import { RfiStatus, UserType } from 'shared/lib/types';
import { validateAttendees } from 'shared/lib/validators/discovery-day-response';

type CreateResponseBody = JsonResponseBody<PublicDiscoveryDayResponse | CreateValidationErrors>;

type UpdateResponseBody = JsonResponseBody<PublicDiscoveryDayResponse | UpdateValidationErrors>;

type ReadOneResponseBody = JsonResponseBody<PublicDiscoveryDayResponse | string[]>;

type ReadManyResponseBody = JsonResponseBody<PaginatedList<PublicDiscoveryDayResponse> | string[]>;

/**
 * Helper to find a Vendor's Discovery Day Response to an RFI.
 */

async function findDiscoveryDayResponse(UserModel: UserSchema.Model, rfi: RfiSchema.Data, vendor: mongoose.Types.ObjectId | string): Promise<RfiSchema.DiscoveryDayResponse | null> {
  const responses = await RfiSchema.getDiscoveryDayResponses(UserModel, rfi);
  for await (const ddr of responses) {
    if (ddr.vendor.toString() === vendor.toString()) {
      return ddr;
    }
  }
  return null;
}

type RequiredModels = 'Rfi' | 'User';

export type Resource = crud.Resource<SupportedRequestBodies, JsonResponseBody, AvailableModels, RequiredModels, CreateRequestBody, UpdateRequestBody, Session>;

export const resource: Resource = {
  routeNamespace: 'discoveryDayResponses',

  create(Models) {
    const RfiModel = Models.Rfi;
    const UserModel = Models.User;
    return {
      async transformRequest(request) {
        return {
          rfiId: getString(request.body.value, 'rfiId'),
          vendorId: getString(request.body.value, 'vendorId'),
          attendees: get(request.body.value, 'attendees', [])
        };
      },
      async respond(request): Promise<Response<CreateResponseBody, Session>> {
        const respond = (code: number, body: PublicDiscoveryDayResponse | CreateValidationErrors) => basicResponse(code, request.session, makeJsonResponseBody(body));
        if (!(await permissions.createDiscoveryDayResponse(UserModel, request.session, request.body.vendorId))) {
          return respond(401, {
            permissions: [permissions.ERROR_MESSAGE]
          });
        }
        // Validate the RFI ID and session user ID.
        const validatedRfi = await validateRfiId(RfiModel, request.body.rfiId, [RfiStatus.Open, RfiStatus.Closed], true);
        if (validatedRfi.tag === 'invalid') {
          return respond(400, {
            rfiId: validatedRfi.value
          });
        }
        const rfi = validatedRfi.value;
        const latestVersion = RfiSchema.getLatestVersion(rfi);
        if (!latestVersion || !latestVersion.discoveryDay) {
          return respond(500, {
            rfiId: ['RFI does not have a discovery day.']
          });
        }
        // Validate the discovery day.
        if (discoveryDayHasPassed(latestVersion.discoveryDay.occurringAt)) {
          return respond(400, {
            discoveryDay: ['Discovery Day has already taken place.']
          });
        }
        // Validate the vendor.
        const validatedVendor = await validateUserId(UserModel, request.body.vendorId, [UserType.Vendor], true);
        if (validatedVendor.tag === 'invalid') {
          return respond(400, {
            vendorId: validatedVendor.value
          });
        }
        const validatedAttendees = validateAttendees(request.body.attendees, latestVersion.discoveryDay.occurringAt);
        if (validatedAttendees.tag === 'invalid') {
          return respond(400, {
            attendees: validatedAttendees.value
          });
        }
        // Do not store duplicate responses.
        const vendor = validatedVendor.value;
        const vendorId = vendor._id;
        const existingDdr = await findDiscoveryDayResponse(UserModel, rfi, vendorId);
        if (existingDdr) {
          return respond(200, await RfiSchema.makePublicDiscoveryDayResponse(UserModel, existingDdr));
        }
        // Create the DDR.
        const createdAt = new Date();
        const ddr = {
          createdAt,
          updatedAt: createdAt,
          vendor: vendorId,
          attendees: validatedAttendees.value
        };
        // Update the RFI with the response.
        rfi.discoveryDayResponses.push(ddr);
        await rfi.save();
        // Notify program staff
        mailer.createDdrToProgramStaff({ rfi, vendor });
        // Notify vendor and attendees
        if (vendorIsSoloAttendee(vendor.email, ddr.attendees) && ddr.attendees[0]) {
          mailer.createDdrToVendorSolo({
            rfi,
            to: vendor.email,
            remote: ddr.attendees[0].remote
          });
        } else {
          mailer.createDdrToVendor({ rfi, to: vendor.email });
          mailer.createDdrToAttendees({
            rfi,
            vendor,
            attendees: ddr.attendees
          });
        }
        const publicDdr = await RfiSchema.makePublicDiscoveryDayResponse(UserModel, ddr);
        return respond(201, publicDdr);
      }
    };
  },

  /**
   * Only Program Staff can read many discovery day responses.
   * The `rfiId` query parameter must be supplied, clamping the list
   * of discovery day responses in the response to the supplied RFI.
   */

  readMany(Models) {
    const RfiModel = Models.Rfi;
    const UserModel = Models.User;
    return {
      async transformRequest(request) {
        return request.body;
      },
      async respond(request): Promise<Response<ReadManyResponseBody, Session>> {
        if (!(await permissions.readManyDiscoveryDayResponses(UserModel, request.session)) || !request.session.user) {
          return basicResponse(401, request.session, makeJsonResponseBody([permissions.ERROR_MESSAGE]));
        }
        const validatedRfi = await validateRfiId(RfiModel, request.query.rfiId || '', undefined, true);
        if (validatedRfi.tag === 'invalid') {
          return basicResponse(400, request.session, makeJsonResponseBody(validatedRfi.value));
        }
        const rfi = validatedRfi.value;
        const publicDdrs = await RfiSchema.getPublicDiscoveryDayResponses(UserModel, rfi);
        return basicResponse(
          200,
          request.session,
          makeJsonResponseBody({
            total: publicDdrs.length,
            count: publicDdrs.length,
            offset: 0,
            items: publicDdrs
          })
        );
      }
    };
  },

  /**
   * Reading one Disovery Day Response corresponds to reading
   * a vendor's response specified by the `rfiId` query parameter, and
   * the `id` URL parameter (which corresponds to the vendor's ID).
   */

  readOne(Models) {
    const RfiModel = Models.Rfi;
    const UserModel = Models.User;
    return {
      async transformRequest(request) {
        return request.body;
      },
      async respond(request): Promise<Response<ReadOneResponseBody, Session>> {
        const vendorId = request.params.id;
        if (!(await permissions.readOneDiscoveryDayResponse(UserModel, request.session, vendorId))) {
          return basicResponse(401, request.session, makeJsonResponseBody([permissions.ERROR_MESSAGE]));
        }
        const validatedRfi = await validateRfiId(RfiModel, request.query.rfiId || '', undefined, true);
        if (validatedRfi.tag === 'invalid') {
          return basicResponse(400, request.session, makeJsonResponseBody(validatedRfi.value));
        }
        const rfi = validatedRfi.value;
        const ddr = await findDiscoveryDayResponse(UserModel, rfi, vendorId);
        if (!ddr) {
          return basicResponse(404, request.session, makeJsonResponseBody(['You have not responded to this Discovery Day Session.']));
        }
        const publicDdr = await RfiSchema.makePublicDiscoveryDayResponse(UserModel, ddr);
        return basicResponse(200, request.session, makeJsonResponseBody(publicDdr));
      }
    };
  },

  /**
   * Updating a Disovery Day Response corresponds to updating
   * a vendor's response specified by the `rfiId` query parameter, and
   * the `id` URL parameter (which corresponds to the vendor's ID).
   * It is only possible to update the attendees for a response.
   */

  update(Models) {
    const RfiModel = Models.Rfi;
    const UserModel = Models.User;
    return {
      async transformRequest(request) {
        return {
          attendees: get(request.body.value, 'attendees', [])
        };
      },
      async respond(request): Promise<Response<UpdateResponseBody, Session>> {
        const respond = (code: number, body: PublicDiscoveryDayResponse | UpdateValidationErrors) => basicResponse(code, request.session, makeJsonResponseBody(body));
        const validatedVendor = await validateUserId(UserModel, request.params.id, [UserType.Vendor], true);
        if (validatedVendor.tag === 'invalid' || !(await permissions.updateDiscoveryDayResponse(UserModel, request.session, validatedVendor.value._id))) {
          return respond(401, {
            permissions: [permissions.ERROR_MESSAGE]
          });
        }
        const vendor = validatedVendor.value;
        // Get the RFI.
        const validatedRfi = await validateRfiId(RfiModel, request.query.rfiId || '', [RfiStatus.Open, RfiStatus.Closed], true);
        if (validatedRfi.tag === 'invalid') {
          return respond(400, {
            rfiId: validatedRfi.value
          });
        }
        const rfi = validatedRfi.value;
        const latestVersion = RfiSchema.getLatestVersion(rfi);
        if (!latestVersion || !latestVersion.discoveryDay) {
          return respond(500, {
            rfiId: ['RFI does not have a discovery day.']
          });
        }
        // Validate the discovery day.
        if (discoveryDayHasPassed(latestVersion.discoveryDay.occurringAt)) {
          return respond(400, {
            discoveryDay: ['Discovery Day has already taken place.']
          });
        }
        // Validate the new attendees.
        const existingDdr = await findDiscoveryDayResponse(UserModel, rfi, vendor._id);
        const validatedAttendees = validateAttendees(request.body.attendees, latestVersion.discoveryDay.occurringAt, get(existingDdr, 'attendees'));
        if (validatedAttendees.tag === 'invalid') {
          return respond(400, {
            attendees: validatedAttendees.value
          });
        }
        let updatedDdr: RfiSchema.DiscoveryDayResponse | undefined;
        rfi.discoveryDayResponses = rfi.discoveryDayResponses.map((ddr) => {
          if (ddr.vendor.toString() !== vendor._id.toString()) {
            return ddr;
          } else {
            updatedDdr = {
              ...ddr,
              updatedAt: new Date(),
              attendees: validatedAttendees.value
            };
            return updatedDdr;
          }
        });
        if (!existingDdr || !updatedDdr) {
          return basicResponse(
            404,
            request.session,
            makeJsonResponseBody({
              permissions: ['You have not responded to this Discovery Day Session.']
            })
          );
        }
        await rfi.save();
        const existingAttendees = existingDdr.attendees;
        const newAttendees = validatedAttendees.value;
        const soloVendor: boolean = vendorIsSoloAttendee(vendor.email, newAttendees);
        // Notifications
        if (permissions.isOwnAccount(request.session, vendor._id)) {
          // Vendor is updating their own DDR.
          if (soloVendor && newAttendees[0]) {
            mailer.updateDdrToVendorSoloByVendor({
              rfi,
              to: vendor.email,
              remote: newAttendees[0].remote
            });
          } else {
            mailer.updateDdrToVendorByVendor({ rfi, to: vendor.email });
          }
          mailer.updateDdrToProgramStaffByVendor({ rfi, vendor });
        } else if (permissions.isProgramStaff(request.session)) {
          // Program Staff are updating this DDR.
          if (soloVendor && newAttendees[0]) {
            mailer.updateDdrToVendorSoloByProgramStaff({
              rfi,
              to: vendor.email,
              remote: newAttendees[0].remote
            });
          } else {
            mailer.updateDdrToVendorByProgramStaff({ rfi, to: vendor.email });
          }
        }
        // Notify attendees
        const attendeeDiff = diffAttendees(existingAttendees, newAttendees);
        // Always notify deleted attendees.
        mailer.deleteDdrToAttendees({ rfi, vendor, attendees: attendeeDiff.deleted });
        // Only notify creates/updates for non-solo vendors' attendees.
        if (!soloVendor) {
          mailer.createDdrToAttendees({ rfi, vendor, attendees: attendeeDiff.created });
          mailer.updateDdrToAttendees({ rfi, vendor, attendees: attendeeDiff.updated });
        }
        const publicDdr = await RfiSchema.makePublicDiscoveryDayResponse(UserModel, updatedDdr);
        return respond(200, publicDdr);
      }
    };
  },

  /**
   * Deleting a Disovery Day Response corresponds to deleting
   * a vendor's response specified by the `rfiId` query parameter, and
   * the `id` URL parameter (which corresponds to the vendor's ID).
   */

  delete(Models) {
    const RfiModel = Models.Rfi;
    const UserModel = Models.User;
    return {
      async transformRequest(request) {
        return request.body;
      },
      async respond(request) {
        const validatedVendor = await validateUserId(UserModel, request.params.id, [UserType.Vendor], true);
        if (validatedVendor.tag === 'invalid' || !(await permissions.deleteDiscoveryDayResponse(UserModel, request.session, validatedVendor.value._id))) {
          return basicResponse(401, request.session, makeJsonResponseBody([permissions.ERROR_MESSAGE]));
        }
        const vendor = validatedVendor.value;
        const validatedRfi = await validateRfiId(RfiModel, request.query.rfiId || '', undefined, true);
        if (validatedRfi.tag === 'invalid') {
          return basicResponse(400, request.session, makeJsonResponseBody(validatedRfi.value));
        }
        const rfi = validatedRfi.value;
        const latestVersion = RfiSchema.getLatestVersion(rfi);
        if (!latestVersion || !latestVersion.discoveryDay) {
          return basicResponse(500, request.session, makeJsonResponseBody(['RFI does not have a discovery day.']));
        }
        // Validate the discovery day.
        if (discoveryDayHasPassed(latestVersion.discoveryDay.occurringAt)) {
          return basicResponse(400, request.session, makeJsonResponseBody(['Discovery Day has already taken place.']));
        }
        let deletedDdr: RfiSchema.DiscoveryDayResponse | undefined;
        const oldResponses = rfi.discoveryDayResponses;
        rfi.discoveryDayResponses = oldResponses.filter((ddr) => {
          if (ddr.vendor.toString() === vendor._id.toString()) {
            deletedDdr = ddr;
            return false;
          } else {
            return true;
          }
        });
        if (!deletedDdr) {
          return basicResponse(404, request.session, makeJsonResponseBody(['You have not responded to this Discovery Day Session.']));
        }
        await rfi.save();
        // Notifications
        const soloVendor = vendorIsSoloAttendee(vendor.email, deletedDdr.attendees);
        if (permissions.isOwnAccount(request.session, vendor._id)) {
          // Vendor is deleting their own DDR.
          if (soloVendor) {
            mailer.deleteDdrToVendorSoloByVendor({
              rfi,
              to: vendor.email
            });
          } else {
            mailer.deleteDdrToVendorByVendor({ rfi, to: vendor.email });
          }
          mailer.deleteDdrToProgramStaffByVendor({ rfi, vendor });
        } else if (permissions.isProgramStaff(request.session)) {
          // Program Staff are deleting this DDR.
          if (soloVendor) {
            mailer.deleteDdrToVendorSoloByProgramStaff({
              rfi,
              to: vendor.email
            });
          } else {
            mailer.deleteDdrToVendorByProgramStaff({ rfi, to: vendor.email });
          }
        }
        if (!soloVendor) {
          // Notify attendees
          mailer.deleteDdrToAttendees({
            rfi,
            vendor,
            attendees: deletedDdr.attendees
          });
        }
        return basicResponse(200, request.session, makeJsonResponseBody(null));
      }
    };
  }
};

export default resource;
