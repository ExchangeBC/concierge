import { getString } from 'back-end/../shared/lib';
import { AvailableModels, Session, SupportedRequestBodies } from 'back-end/lib/app/types';
import * as crud from 'back-end/lib/crud';
import { basicResponse, JsonResponseBody, makeJsonResponseBody, Response } from 'back-end/lib/server';
import { CreateRequestBody, CreateValidationErrors } from 'shared/lib/resources/feedback';

type CreateResponseBody = JsonResponseBody<null | CreateValidationErrors>;

type RequiredModels = 'Feedback' | 'User';

export type Resource = crud.Resource<SupportedRequestBodies, JsonResponseBody, AvailableModels, RequiredModels, CreateRequestBody, null, Session>;

export const resource: Resource = {

  routeNamespace: 'feedbackResponse',

  create(Models) {
    const FeedbackModel = Models.Feedback;
    return {
      async transformRequest(request) {
        return {
          rating: getString(request.body.value, 'rating'),
          text: getString(request.body.value, 'text')
        }
      },
      async respond(request): Promise<Response<CreateResponseBody, Session>> {
        const respond = (code: number, body: null | CreateValidationErrors) => basicResponse(code, request.session, makeJsonResponseBody(body));

        // Create feedback object
        const feedback = new FeedbackModel({
          createdAt: new Date(),
          text: request.body.text,
          rating: request.body.rating
        });

        // If we have an authenticated user, store the type with the feedback
        if (request.session && request.session.user) {
          feedback.userType = request.session.user.type;
        }

        await feedback.save();

        return respond(200, null);
      }
    }
  }
}

export default resource;
