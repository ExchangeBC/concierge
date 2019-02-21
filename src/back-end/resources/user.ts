import bcrypt from 'bcrypt';
import * as crud from '../lib/crud';
import { ValidOrInvalid } from '../lib/server';
import * as UserSchema from '../schemas/user';

interface ValidCreateRequestBody {
  email: string;
  passwordHash: string;
  userType: UserSchema.UserType;
}

interface CreateErrorResponseBody {
  email: string[];
  password: string[];
  userType: string[];
}

export type CreateRequestBody = ValidOrInvalid<ValidCreateRequestBody, CreateErrorResponseBody>;

export interface UpdateRequestBody {
  email: string;
}

function stubUser(Model: UserSchema.Model): UserSchema.Document {
  return new Model({
    name: 'Stub User',
    age: 22
  });
};

async function parseEmail(Model: UserSchema.Model, email: string): Promise<ValidOrInvalid<string, string[]>> {
  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/i)) {
    return {
      tag: 'invalid',
      value: [ 'Please enter a valid email.' ]
    };
  } else {
    return {
      tag: 'valid',
      value: email
    };
  }
}

async function parsePassword(Model: UserSchema.Model, password: string): Promise<ValidOrInvalid<string, string[]>> {
  const hasNumber = !!password.match(/[0-9]/);
  const hasLowercaseLetter = !!password.match(/[a-z]/);
  const hasUppercaseLetter = !!password.match(/[A-Z]/);
  const errors: string[] = [];
  if (password.length < 8) { errors.push('Passwords must be at least 8 characters long.'); }
  if (!hasNumber || !hasLowercaseLetter || !hasUppercaseLetter) { errors.push('Passwords must contain at least one number, lowercase letter and uppercase letter.'); }
  if (errors.length) {
    return {
      tag: 'invalid',
      value: errors
    };
  } else {
    return {
      tag: 'valid',
      value: await bcrypt.hash(password, 10)
    };
  }
}

async function parseUserType(Model: UserSchema.Model, userType: string): Promise<ValidOrInvalid<UserSchema.UserType, string[]>> {
  const parsedUserType = UserSchema.parseUserType(userType);
  if (!parsedUserType) {
    return {
      tag: 'invalid',
      value: [ 'Please select a valid User Type; either "buyer", "vendor" or "program_staff".' ]
    };
  } else {
    return {
      tag: 'valid',
      value: parsedUserType
    };
  }
}

async function parseCreateRequestBody(Model: UserSchema.Model, email: string, password: string, userType: string): Promise<CreateRequestBody> {
  const parsedEmail = await parseEmail(Model, email);
  const parsedPassword = await parsePassword(Model, password);
  const parsedUserType = await parseUserType(Model, userType);
  if (parsedEmail.tag === 'invalid' || parsedPassword.tag === 'invalid' || parsedUserType.tag === 'invalid') {
    return {
      tag: 'invalid',
      value: {
        email: parsedEmail.tag === 'invalid' ? parsedEmail.value : [],
        password: parsedPassword.tag === 'invalid' ? parsedPassword.value : [],
        userType: parsedUserType.tag === 'invalid' ? parsedUserType.value : []
      }
    };
  } else {
    return {
      tag: 'valid',
      value: {
        email: parsedEmail.value,
        passwordHash: parsedPassword.value,
        userType: parsedUserType.value
      }
    };
  }
}

export type Resource = crud.Resource<UserSchema.Document, CreateRequestBody, UpdateRequestBody, CreateErrorResponseBody, null, null, null, null>;

const resource: Resource = {

  ROUTE_NAMESPACE: 'users',
  MODEL_NAME: UserSchema.NAME,

  create: {

    async transformRequestBody(Model, body, logger) {
      const email = body.email ? String(body.email) : '';
      const password = body.password ? String(body.password) : '';
      const userType = body.userType ? String(body.userType) : '';
      logger.debug('create user', { email, password, userType });
      return await parseCreateRequestBody(Model, email, password, userType);
    },

    run(Model) {
      return async request => {
        switch (request.body.tag) {
          case 'invalid':
            return {
              code: 400,
              headers: {},
              body: request.body.value
            };
          case 'valid':
            const user = new Model(request.body.value);
            await user.save();
            return {
              code: 201,
              headers: {},
              body: user
            };
        }
      };
    }

  },

  readOne(Model) {
    return async request => {
      return {
        code: 200,
        headers: {},
        body: stubUser(Model)
      };
    }
  },

  delete(Model) {
    return async request => {
      return {
        code: 200,
        headers: {},
        body: null
      };
    };
  }

};

export default resource;
