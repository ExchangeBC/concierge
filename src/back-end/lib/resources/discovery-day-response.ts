import { AvailableModels, Session, SupportedRequestBodies } from 'back-end/lib/app/types';
import * as crud from 'back-end/lib/crud';
import * as mailer from 'back-end/lib/mailer';
import * as permissions from 'back-end/lib/permissions';
import * as RfiSchema from 'back-end/lib/schemas/request-for-information';
import * as UserSchema from 'back-end/lib/schemas/user';
import { basicResponse, JsonResponseBody, makeErrorResponseBody, makeJsonResponseBody, Response } from 'back-end/lib/server';
import { validateRfiId, validateUserId } from 'back-end/lib/validators';
import { get } from 'lodash';
import * as mongoose from 'mongoose';
import { getString } from 'shared/lib';
import { CreateRequestBody, CreateValidationErrors, PublicDiscoveryDayResponse, UpdateRequestBody, UpdateValidationErrors } from 'shared/lib/resources/discovery-day-response';
import { PaginatedList, profileToName } from 'shared/lib/types';
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
    if (ddr.vendor.toString() === vendor.toString()) { return ddr; }
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
        if (!permissions.createDiscoveryDayResponse(request.session, request.body.vendorId)) {
          return respond(401, {
            permissions: [permissions.ERROR_MESSAGE]
          })
        }
        // Validate the RFI ID and session user ID.
        const validatedRfi = await validateRfiId(RfiModel, request.body.rfiId, [RfiStatus.Open, RfiStatus.Closed], true);
        if (validatedRfi.tag === 'invalid') {
          return respond(400, {
            rfiId: validatedRfi.value
          });
        }
        const validatedVendor = await validateUserId(UserModel, request.body.vendorId, UserType.Vendor, true);
        if (validatedVendor.tag === 'invalid') {
          return respond(400, {
            vendorId: validatedVendor.value
          });
        }
        const rfi = validatedRfi.value;
        const latestVersion = RfiSchema.getLatestVersion(rfi);
        if (!latestVersion || !latestVersion.discoveryDay) {
          return respond(500, {
            rfiId: ['RFI does not have a discovery day.']
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
        const publicDdr = await RfiSchema.makePublicDiscoveryDayResponse(UserModel, ddr)
        await rfi.save();
        // notify program staff
        try {
          const latestVersion = RfiSchema.getLatestVersion(rfi);
          await mailer.discoveryDayResponseReceived({
            // TODO make these default string values constants somewhere
            // to stay DRY.
            rfiName: latestVersion ? latestVersion.rfiNumber : '[Undefined RFI Number]',
            rfiId: rfi._id,
            vendorName: profileToName(vendor.profile) || '[Undefined Vendor Name]',
            vendorId
          });
        } catch (error) {
          request.logger.error('unable to send notification email to program staff for discovery day response', {
            ...makeErrorResponseBody(error),
            rfiId: rfi._id,
            vendorId
          });
        }
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
        if (!permissions.readManyDiscoveryDayResponses(request.session) || !request.session.user) {
          return basicResponse(401, request.session, makeJsonResponseBody([permissions.ERROR_MESSAGE]));
        }
        const validatedRfi = await validateRfiId(RfiModel, request.query.rfiId || '', undefined, true);
        if (validatedRfi.tag === 'invalid') {
          return basicResponse(400, request.session, makeJsonResponseBody(validatedRfi.value));
        }
        const rfi = validatedRfi.value;
        const publicDdrs = await RfiSchema.getPublicDiscoveryDayResponses(UserModel, rfi);
        return basicResponse(200, request.session, makeJsonResponseBody({
          total: publicDdrs.length,
          count: publicDdrs.length,
          offset: 0,
          items: publicDdrs
        }));
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
        if (!permissions.readOneDiscoveryDayResponse(request.session, vendorId)) {
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
        const vendorId = request.params.id;
        if (!permissions.updateDiscoveryDayResponse(request.session, vendorId)) {
          return respond(401, {
            permissions: [permissions.ERROR_MESSAGE]
          })
        }
        // Get the RFI.
        const validatedRfi = await validateRfiId(RfiModel, request.query.rfiId || '', [RfiStatus.Open, RfiStatus.Closed], true);
        if (validatedRfi.tag === 'invalid') {
          return respond(400, {
            rfiId: validatedRfi.value
          });
        }
        // Validate the new attendees.
        const rfi = validatedRfi.value;
        const latestVersion = RfiSchema.getLatestVersion(rfi);
        if (!latestVersion || !latestVersion.discoveryDay) {
          return respond(500, {
            rfiId: ['RFI does not have a discovery day.']
          });
        }
        const existingDdr = await findDiscoveryDayResponse(UserModel, rfi, vendorId);
        const validatedAttendees = validateAttendees(request.body.attendees, latestVersion.discoveryDay.occurringAt, get(existingDdr, 'attendees'));
        if (validatedAttendees.tag === 'invalid') {
          return respond(400, {
            attendees: validatedAttendees.value
          });
        }
        let updatedDdr: RfiSchema.DiscoveryDayResponse | undefined;
        rfi.discoveryDayResponses = rfi.discoveryDayResponses.map(ddr => {
          if (ddr.vendor.toString() !== vendorId) {
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
        if (!updatedDdr) {
          return basicResponse(404, request.session, makeJsonResponseBody({
            permissions: ['You have not responded to this Discovery Day Session.']
          }));
        }
        await rfi.save();
        const publicDdr = await RfiSchema.makePublicDiscoveryDayResponse(UserModel, updatedDdr)
        // TODO email notification
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
    return {
      async transformRequest(request) {
        return request.body;
      },
      async respond(request) {
        const vendorId = request.params.id;
        if (!permissions.deleteDiscoveryDayResponse(request.session, vendorId)) {
          return basicResponse(401, request.session, makeJsonResponseBody([permissions.ERROR_MESSAGE]));
        }
        const validatedRfi = await validateRfiId(RfiModel, request.query.rfiId || '', undefined, true);
        if (validatedRfi.tag === 'invalid') {
          return basicResponse(400, request.session, makeJsonResponseBody(validatedRfi.value));
        }
        const rfi = validatedRfi.value;
        const oldResponses = rfi.discoveryDayResponses;
        rfi.discoveryDayResponses = oldResponses.filter(ddr => {
          return ddr.vendor.toString() !== vendorId;
        });
        if (rfi.discoveryDayResponses.length === oldResponses.length) {
          return basicResponse(404, request.session, makeJsonResponseBody(['You have not responded to this Discovery Day Session.']));
        }
        await rfi.save();
        return basicResponse(200, request.session, makeJsonResponseBody(null));
      }
    };
  }

}

export default resource;
