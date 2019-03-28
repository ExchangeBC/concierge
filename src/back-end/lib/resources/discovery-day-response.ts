import { AvailableModels, SupportedRequestBodies } from 'back-end/lib/app';
import * as crud from 'back-end/lib/crud';
import * as permissions from 'back-end/lib/permissions';
import * as RfiSchema from 'back-end/lib/schemas/request-for-information';
import { AppSession } from 'back-end/lib/schemas/session';
import { basicResponse, JsonResponseBody, makeJsonResponseBody, mapRequestBody, Response } from 'back-end/lib/server';
import { validateObjectIdString, validateRfiId, validateUserId } from 'back-end/lib/validators';
import * as mongoose from 'mongoose';
import { getString, identityAsync } from 'shared/lib';
import { CreateValidationErrors, PublicDiscoveryDayResponse } from 'shared/lib/resources/discovery-day-response';
import { ADT, UserType } from 'shared/lib/types';
import { getInvalidValue } from 'shared/lib/validators';

type CreateRequestBody
  = ADT<201, PublicDiscoveryDayResponse>
  | ADT<200, PublicDiscoveryDayResponse>
  | ADT<401, CreateValidationErrors>
  | ADT<400, CreateValidationErrors>;

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

export type Resource = crud.Resource<SupportedRequestBodies, JsonResponseBody, AvailableModels, RequiredModels, CreateRequestBody, null, AppSession>;

export const resource: Resource = {

  routeNamespace: 'discoveryDayResponses',

  create(Models) {
    const RfiModel = Models.Rfi;
    const UserModel = Models.User;
    return {
      async transformRequest(request) {
        if (!permissions.createDiscoveryDayResponse(request.session) || !request.session.user) {
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
              contentType: ['Discovery Day Responses must be created with a JSON request.']
            }
          });
        }
        // Validate the RFI ID and session user ID.
        const rawRfiId = getString(request.body.value, 'rfiId');
        const validatedRfiId = validateObjectIdString(rawRfiId);
        const validatedVendor = await validateUserId(UserModel, request.session.user.id, UserType.Vendor, true);
        if (validatedRfiId.tag === 'invalid' || validatedVendor.tag === 'invalid') {
          return mapRequestBody(request, {
            tag: 400 as 400,
            value: {
              rfiId: getInvalidValue(validatedRfiId, undefined),
              vendor: getInvalidValue(validatedVendor, undefined)
            }
          });
        }
        // Find the relevant RFI.
        const now = new Date();
        const rfi = await RfiModel.findById(validatedRfiId.value);
        // RFI doesn't exist or it isn't published yet.
        if (!rfi || !RfiSchema.hasBeenPublished(rfi)) {
          return mapRequestBody(request, {
            tag: 400 as 400,
            value: {
              rfiId: [`RFI with ID "${validatedRfiId.value}" doesn't exist`]
            }
          });
        }
        // Do not store duplicate responses.
        const vendorId = validatedVendor.value._id;
        const existingDdr = findDiscoveryDayResponse(rfi, vendorId);
        if (existingDdr) {
          return mapRequestBody(request, {
            tag: 200 as 200,
            value: RfiSchema.makePublicDiscoveryDayResponse(existingDdr)
          });
        }
        // Create the DDR.
        const ddr = {
          createdAt: now,
          vendor: vendorId
        };
        // Update the RFI with the response.
        rfi.discoveryDayResponses.push(ddr);
        await rfi.save();
        return mapRequestBody(request, {
          tag: 201 as 201,
          value: RfiSchema.makePublicDiscoveryDayResponse(ddr)
        });
      },
      async respond(request): Promise<Response<CreateResponseBody, AppSession>> {
        return basicResponse(request.body.tag, request.session, makeJsonResponseBody(request.body.value));
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
    return {
      transformRequest: identityAsync,
      async respond(request): Promise<Response<ReadOneResponseBody, AppSession>> {
        if (!permissions.readOneDiscoveryDayResponse(request.session) || !request.session.user) {
          return basicResponse(401, request.session, makeJsonResponseBody([permissions.ERROR_MESSAGE]));
        }
        const validatedRfi = await validateRfiId(RfiModel, request.params.id);
        if (validatedRfi.tag === 'invalid') {
          return basicResponse(400, request.session, makeJsonResponseBody(validatedRfi.value));
        }
        const rfi = validatedRfi.value;
        const ddr = findDiscoveryDayResponse(rfi, request.session.user.id);
        if (!ddr) {
          return basicResponse(404, request.session, makeJsonResponseBody(['You have not responded to this Discovery Day Session.']));
        }
        const publicDdr = await RfiSchema.makePublicDiscoveryDayResponse(ddr);
        return basicResponse(200, request.session, makeJsonResponseBody(publicDdr));
      }
    };
  }

}

export default resource;
