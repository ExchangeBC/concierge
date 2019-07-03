import { AvailableModels, Session, SupportedRequestBodies } from 'back-end/lib/app/types';
import * as crud from 'back-end/lib/crud';
import * as mailer from 'back-end/lib/mailer';
import * as permissions from 'back-end/lib/permissions';
import * as RfiSchema from 'back-end/lib/schemas/request-for-information';
import { basicResponse, JsonResponseBody, makeErrorResponseBody, makeJsonResponseBody, Response } from 'back-end/lib/server';
import { validateRfiId, validateUserId } from 'back-end/lib/validators';
import { get } from 'lodash';
import * as mongoose from 'mongoose';
import { getString } from 'shared/lib';
import { CreateRequestBody, CreateValidationErrors, PublicDiscoveryDayResponse } from 'shared/lib/resources/discovery-day-response';
import { profileToName } from 'shared/lib/types';
import { RfiStatus, UserType } from 'shared/lib/types';
import { validateAttendees } from 'shared/lib/validators/discovery-day-response';

type CreateResponseBody = JsonResponseBody<PublicDiscoveryDayResponse | CreateValidationErrors>;

type ReadOneResponseBody = JsonResponseBody<PublicDiscoveryDayResponse | string[]>;

/**
 * Helper to find a Vendor's Discovery Day Response
 * to an RFI.
 */

function findDiscoveryDayResponse(rfi: RfiSchema.Data, vendor: mongoose.Types.ObjectId): RfiSchema.DiscoveryDayResponse | null {
  return rfi.discoveryDayResponses.filter(ddr => {
    return ddr.vendor.toString() === vendor.toString();
  })[0] || null;
}

type RequiredModels = 'Rfi' | 'User';

export type Resource = crud.Resource<SupportedRequestBodies, JsonResponseBody, AvailableModels, RequiredModels, CreateRequestBody, null, Session>;

export const resource: Resource = {

  routeNamespace: 'discoveryDayResponses',

  create(Models) {
    const RfiModel = Models.Rfi;
    const UserModel = Models.User;
    return {
      async transformRequest(request) {
        return {
          rfiId: getString(request.body.value, 'rfiId'),
          attendees: get(request.body.value, 'attendees', [])
        };
      },
      async respond(request): Promise<Response<CreateResponseBody, Session>> {
        const respond = (code: number, body: PublicDiscoveryDayResponse | CreateValidationErrors) => basicResponse(code, request.session, makeJsonResponseBody(body));
        if (!permissions.createDiscoveryDayResponse(request.session) || !request.session.user) {
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
        const validatedVendor = await validateUserId(UserModel, request.session.user.id, UserType.Vendor, true);
        if (validatedVendor.tag === 'invalid') {
          return respond(400, {
            vendor: validatedVendor.value
          });
        }
        const validatedAttendees = validateAttendees(request.body.attendees);
        if (validatedAttendees.tag === 'invalid') {
          return respond(400, {
            attendees: validatedAttendees.value
          });
        }
        const rfi = validatedRfi.value;
        // Do not store duplicate responses.
        const vendor = validatedVendor.value;
        const vendorId = vendor._id;
        const existingDdr = findDiscoveryDayResponse(rfi, vendorId);
        if (existingDdr) {
          return respond(200, await RfiSchema.makePublicDiscoveryDayResponse(UserModel, existingDdr));
        }
        // Create the DDR.
        const ddr = {
          createdAt: new Date(),
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
   * Reading one Disovery Day Response corresponds to reading
   * the authenticated user's response to the RFI specified
   * by the ID URL parameter.
   */

  readOne(Models) {
    const RfiModel = Models.Rfi;
    const UserModel = Models.User;
    return {
      async transformRequest(request) {
        return request.body;
      },
      async respond(request): Promise<Response<ReadOneResponseBody, Session>> {
        if (!permissions.readOneDiscoveryDayResponse(request.session) || !request.session.user) {
          return basicResponse(401, request.session, makeJsonResponseBody([permissions.ERROR_MESSAGE]));
        }
        const validatedRfi = await validateRfiId(RfiModel, request.params.id, undefined, true);
        if (validatedRfi.tag === 'invalid') {
          return basicResponse(400, request.session, makeJsonResponseBody(validatedRfi.value));
        }
        const rfi = validatedRfi.value;
        const ddr = findDiscoveryDayResponse(rfi, request.session.user.id);
        if (!ddr) {
          return basicResponse(404, request.session, makeJsonResponseBody(['You have not responded to this Discovery Day Session.']));
        }
        const publicDdr = await RfiSchema.makePublicDiscoveryDayResponse(UserModel, ddr);
        return basicResponse(200, request.session, makeJsonResponseBody(publicDdr));
      }
    };
  }

}

export default resource;
