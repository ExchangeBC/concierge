import { AvailableModels, Session, SupportedRequestBodies } from 'back-end/lib/app/types';
import * as crud from 'back-end/lib/crud';
import * as mailer from 'back-end/lib/mailer';
import * as permissions from 'back-end/lib/permissions';
import * as ForgotPasswordTokenSchema from 'back-end/lib/schemas/forgot-password-token';
import * as UserSchema from 'back-end/lib/schemas/user';
import { basicResponse, JsonResponseBody, makeJsonResponseBody, Response } from 'back-end/lib/server';
import { validateObjectIdString, validatePassword } from 'back-end/lib/validators';
import { getString } from 'shared/lib';
import { CreateRequestBody, UpdateRequestBody, UpdateValidationErrors } from 'shared/lib/resources/forgot-password-token';

type CreateResponseBody = JsonResponseBody<null>;

type UpdateResponseBody = JsonResponseBody<null | UpdateValidationErrors>;

type RequiredModels = 'ForgotPasswordToken' | 'Session' | 'User';

export type Resource = crud.Resource<SupportedRequestBodies, JsonResponseBody, AvailableModels, RequiredModels, CreateRequestBody, UpdateRequestBody, Session>;

export const resource: Resource = {
  routeNamespace: 'forgot-password-tokens',

  create(Models) {
    const ForgotPasswordTokenModel = Models.ForgotPasswordToken as ForgotPasswordTokenSchema.Model;
    const UserModel = Models.User as UserSchema.Model;
    return {
      async transformRequest(request) {
        // TODO bad request response if body is not json
        const body = request.body.tag === 'json' ? request.body.value : {};
        return {
          email: getString(body, 'email')
        };
      },
      async respond(request): Promise<Response<CreateResponseBody, Session>> {
        const respond = (code: number) => basicResponse(code, request.session, makeJsonResponseBody(null));
        if (!permissions.createForgotPasswordToken(request.session)) {
          return respond(401);
        }
        const user = await UserModel.findOne({ email: request.body.email }).exec();
        // We respond with a 201 so we don't give away any information about
        // which users do and don't have accounts.
        if (!user) {
          return respond(201);
        }
        const userId = user._id;
        const forgotPasswordToken = new ForgotPasswordTokenModel({
          createdAt: Date.now(),
          token: await ForgotPasswordTokenSchema.hashToken(userId),
          userId
        });
        await forgotPasswordToken.save();
        // Send notification email.
        mailer.createForgotPasswordToken(request.body.email, forgotPasswordToken.token, userId);
        return respond(201);
      }
    };
  },

  update(Models) {
    const ForgotPasswordTokenModel = Models.ForgotPasswordToken as ForgotPasswordTokenSchema.Model;
    const UserModel = Models.User as UserSchema.Model;
    return {
      async transformRequest(request) {
        // TODO bad request response if body is not json
        const body = request.body.tag === 'json' ? request.body.value : {};
        return {
          token: request.params.id,
          userId: getString(body, 'userId'),
          password: getString(body, 'password')
        };
      },
      async respond(request): Promise<Response<UpdateResponseBody, Session>> {
        const respond = (code: number, body: UpdateValidationErrors | null) => basicResponse(code, request.session, makeJsonResponseBody(body));
        if (!permissions.createForgotPasswordToken(request.session)) {
          return respond(401, {
            permissions: [permissions.ERROR_MESSAGE]
          });
        }
        const { token, userId, password } = request.body;
        const forgotPasswordToken = await ForgotPasswordTokenModel.findOne({ token }).exec();
        if (!forgotPasswordToken) {
          return respond(400, {
            forgotPasswordToken: ['Your link has expired, please try requesting a new one.']
          });
        }
        const validatedUserId = validateObjectIdString(userId);
        if (validatedUserId.tag === 'invalid') {
          return respond(400, {
            userId: validatedUserId.value
          });
        }
        const validatedPassword = await validatePassword(password);
        if (validatedPassword.tag === 'invalid') {
          return respond(400, {
            password: validatedPassword.value
          });
        }
        const user = await UserModel.findOne({ _id: validatedUserId.value }).exec();
        if (!user) {
          return respond(400, {
            userId: ['User does not exist']
          });
        }
        const correctForgotPasswordToken = await ForgotPasswordTokenSchema.authenticateToken(forgotPasswordToken.token, validatedUserId.value);
        if (!correctForgotPasswordToken) {
          return respond(400, {
            forgotPasswordToken: ['Your link has expired, please try requesting a new one.']
          });
        }
        user.passwordHash = validatedPassword.value;
        await user.save();
        await ForgotPasswordTokenSchema.deleteToken(ForgotPasswordTokenModel, forgotPasswordToken.token);
        return basicResponse(200, request.session, makeJsonResponseBody(null));
      }
    };
  }
};

export default resource;
