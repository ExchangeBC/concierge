import { CONTACT_EMAIL } from 'back-end/config';
import { AvailableModels, Session, SupportedRequestBodies } from 'back-end/lib/app/types';
import * as crud from 'back-end/lib/crud';
import * as mailer from 'back-end/lib/mailer';
import * as FeedbackSchema from 'back-end/lib/schemas/feedback';
import { basicResponse, JsonResponseBody, makeJsonResponseBody, Response } from 'back-end/lib/server';
import { getString } from 'shared/lib';
import { CreateRequestBody, CreateValidationErrors, PublicFeedback } from 'shared/lib/resources/feedback';
import { validateFeedbackText, validateRating } from 'shared/lib/validators/feedback';

type CreateResponseBody = JsonResponseBody<PublicFeedback | CreateValidationErrors>;

type RequiredModels = 'Feedback';

export type Resource = crud.Resource<SupportedRequestBodies, JsonResponseBody, AvailableModels, RequiredModels, CreateRequestBody, null, Session>;

export const resource: Resource = {

  routeNamespace: 'feedback',

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
        const respond = (code: number, body: PublicFeedback | CreateValidationErrors) => basicResponse(code, request.session, makeJsonResponseBody(body));

        // Validate feedback text
        const validatedFeedbackText = validateFeedbackText(request.body.text);
        if (validatedFeedbackText.tag === 'invalid') {
          return respond(400, { text: validatedFeedbackText.value });
        }

        // Validate rating
        const validatedRating = validateRating(request.body.rating);
        if (validatedRating.tag === 'invalid') {
          return respond(400, { rating: validatedRating.value });
        }

        // Create feedback object
        const feedback = new FeedbackModel({
          createdAt: new Date(),
          text: validatedFeedbackText.value,
          rating: validatedRating.value
        });

        // If we have an authenticated user, store the type with the feedback
        if (request.session && request.session.user) {
          feedback.userType = request.session.user.type;
        }

        await feedback.save();

        // Send email to configured CONTACT_EMAIL
        mailer.createFeedback({
          feedbackEmail: CONTACT_EMAIL,
          feedbackResponse: FeedbackSchema.makePublicFeedback(feedback)
        });

        return respond(201, FeedbackSchema.makePublicFeedback(feedback));
      }
    }
  }
}

export default resource;
