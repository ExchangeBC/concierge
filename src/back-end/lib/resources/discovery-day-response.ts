import { AvailableModels, SupportedRequestBodies } from 'back-end/lib/app';
import * as crud from 'back-end/lib/crud';
import * as permissions from 'back-end/lib/permissions';
import * as DiscoveryDayResponseSchema from 'back-end/lib/schemas/discovery-day-response';
import { AppSession } from 'back-end/lib/schemas/session';
import { basicResponse, JsonResponseBody, makeJsonResponseBody, mapRequestBody, Response } from 'back-end/lib/server';
import { CreateValidationErrors } from 'shared/lib/resources/discovery-day-response';
import { invalid, valid, ValidOrInvalid } from 'shared/lib/validators';

interface ValidCreateRequestBody {
  rfi: InstanceType<any>; // TODO: type this properly once RFI model/schema is created
}

type CreateRequestBody = ValidOrInvalid<ValidCreateRequestBody, CreateValidationErrors>;

type CreateResponseBody = JsonResponseBody<null>;

type RequiredModels = 'DiscoveryDayResponse';

export type Resource = crud.Resource<SupportedRequestBodies, JsonResponseBody, AvailableModels, RequiredModels, CreateRequestBody, null, AppSession>;

const resource: Resource = {
  routeNamespace: 'ddr',

  create(Models) {
    const DiscoveryDayResponseModel = Models.DiscoveryDayResponse as DiscoveryDayResponseSchema.Model;
    return {
      async transformRequest(request) {
        if (!permissions.createDiscoveryDayResponse(request.session)) {
          return mapRequestBody(request, invalid({
            permissions: [permissions.ERROR_MESSAGE]
          }));
        } else {
          if (request.body.value.rfi) {
            return mapRequestBody(request, valid({
              rfi: request.body.value.rfi.id
            }));
          } else {
            return mapRequestBody(request, invalid({
              rfi: ['An RFI was not specified, please try again with a valid RFI']
            }));
          }
        }
      },
      async respond(request): Promise<Response<CreateResponseBody, AppSession>> {
        if (request.body) {
          switch (request.body.tag) {
            case 'invalid':
              const invalidCode = request.body.value.permissions ? 401 : 400;
              return basicResponse(invalidCode, request.session, makeJsonResponseBody(null));
            case 'valid':
              // TODO: retrieve RFI for the passed id (once implemented) and check for publication status
              // Check for existing response on the RFI id and user id
              let ddr = await DiscoveryDayResponseModel.findOne({ rfiId: request.body.value.rfi.id, user: request.session.user});
              if (ddr) {
                // if already registered, no action to take, just respond
                return basicResponse(201, request.session, makeJsonResponseBody(null));
              } else {
                ddr = new DiscoveryDayResponseModel({
                  rfiId: request.body.value.rfi.id,
                  createdAt: new Date(),
                  user: request.session.user
                });
                ddr.save();
                return basicResponse(200, request.session, makeJsonResponseBody(null));
              }
          }
        }

        return basicResponse(400, request.session, makeJsonResponseBody(null));
      }
    }
  }
}

export default resource;
