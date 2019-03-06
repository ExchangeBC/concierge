import { AvailableModels } from 'back-end/lib/app';
import * as crud from 'back-end/lib/crud';
import * as notifications from 'back-end/lib/mailer/notifications';
import * as permissions from 'back-end/lib/permissions';
import * as ForgotPasswordTokenSchema from 'back-end/lib/schemas/forgot-password-token';
import * as SessionSchema from 'back-end/lib/schemas/session';
import * as UserSchema from 'back-end/lib/schemas/user';
import { basicResponse, mapRequestBody } from 'back-end/lib/server';
import { validateObjectIdString, validatePassword } from 'back-end/lib/validators';
import { getString } from 'shared/lib';
import { UpdateValidationErrors } from 'shared/lib/resources/forgot-password-token';
import { invalid, valid, ValidOrInvalid } from 'shared/lib/validators';

type CreateRequestBody = InstanceType<UserSchema.Model> | null;

type CreateResponseBody = null;

interface ValidUpdateRequestBody {
  user: InstanceType<UserSchema.Model>;
  forgotPasswordToken: InstanceType<ForgotPasswordTokenSchema.Model>;
}

type UpdateRequestBody = ValidOrInvalid<ValidUpdateRequestBody, UpdateValidationErrors>;

type UpdateResponseBody = null | UpdateValidationErrors;

type RequiredModels = 'ForgotPasswordToken' | 'Session' | 'User';

export type Resource = crud.Resource<AvailableModels, RequiredModels, CreateRequestBody, CreateResponseBody, null, null, null, UpdateRequestBody, UpdateResponseBody, null, SessionSchema.AppSession>;

export const resource: Resource = {

  routeNamespace: 'forgot-password-tokens',

  create(Models) {
    const ForgotPasswordTokenModel = Models.ForgotPasswordToken as ForgotPasswordTokenSchema.Model;
    const UserModel = Models.User as UserSchema.Model;
    return {
      async transformRequest(request) {
        if (!permissions.createForgotPasswordToken(request.session)) {
          return mapRequestBody(request, null);
        } else {
          const email = getString(request.body, 'email');
          const user = await UserModel.findOne({ email, active: true }).exec();
          return mapRequestBody(request, user || null);
        }
      },
      async respond(request) {
        if (request.body) {
          const userId = request.body._id;
          const forgotPasswordToken = new ForgotPasswordTokenModel({
            createdAt: Date.now(),
            token: await ForgotPasswordTokenSchema.hashToken(userId),
            userId
          });
          await forgotPasswordToken.save();
          // Send notification email.
          try {
            await notifications.createForgotPasswordToken(request.body.email, forgotPasswordToken.token, userId);
          } catch (error) {
            request.logger.error('sending the createForgotPasswordToken notification email failed', error);
          }
          return basicResponse(201, request.session, null);
        } else {
          return basicResponse(400, request.session, null);
        }
      }
    };
  },

  update(Models) {
    const ForgotPasswordTokenModel = Models.ForgotPasswordToken as ForgotPasswordTokenSchema.Model;
    const UserModel = Models.User as UserSchema.Model;
    return {
      async transformRequest(request) {
        if (!permissions.createForgotPasswordToken(request.session)) {
          return mapRequestBody(request, invalid({
            permissions: [permissions.ERROR_MESSAGE]
          }));
        } else {
          const forgotPasswordToken = await ForgotPasswordTokenModel.findOne({ token: request.params.id }).exec();
          if (!forgotPasswordToken) {
            return mapRequestBody(request, invalid({
              forgotPasswordToken: ['Your link has expired, please try requesting a new one.']
            }));
          }
          const userId = getString(request.body, 'userId');
          const validatedUserId = validateObjectIdString(userId);
          if (validatedUserId.tag === 'invalid') {
            return mapRequestBody(request, invalid({
              userId: validatedUserId.value
            }));
          }
          const password = getString(request.body, 'password');
          const validatedPassword = await validatePassword(password);
          if (validatedPassword.tag === 'invalid') {
            return mapRequestBody(request, invalid({
              password: validatedPassword.value
            }));
          }
          const user = await UserModel.findOne({ _id: validatedUserId.value, active: true }).exec();
          if (!user) {
            return mapRequestBody(request, invalid({
              userId: ['Your user account is no longer active.']
            }));
          }
          const correctForgotPasswordToken = await ForgotPasswordTokenSchema.authenticateToken(forgotPasswordToken.token, validatedUserId.value);
          if (!correctForgotPasswordToken) {
            return mapRequestBody(request, invalid({
              forgotPasswordToken: ['Your link has expired, please try requesting a new one.']
            }));
          }
          user.passwordHash = validatedPassword.value;
          return mapRequestBody(request, valid({
            user,
            forgotPasswordToken
          }));
        }
      },
      async respond(request) {
        switch (request.body.tag) {
          case 'invalid':
            const invalidCode = request.body.value.permissions ? 401 : 400;
            return basicResponse(invalidCode, request.session, request.body.value);
          case 'valid':
            const { user, forgotPasswordToken } = request.body.value;
            await user.save();
            await ForgotPasswordTokenSchema.deleteToken(ForgotPasswordTokenModel, forgotPasswordToken.token);
            return basicResponse(200, request.session, null);
        }
      }
    };
  }

}

export default resource;
