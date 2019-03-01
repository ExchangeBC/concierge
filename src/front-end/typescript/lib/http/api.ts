import { AxiosResponse, default as axios } from 'axios';
import * as UserResource from 'shared/lib/resources/user';
import { HttpMethod, Profile, UserType } from 'shared/lib/types';
import { invalid, valid, ValidOrInvalid } from 'shared/lib/validators';

export function request(method: HttpMethod, path: string, data?: object): Promise<AxiosResponse<any>> {
  return axios({
    method,
    url: `/api/${path.replace(/^\/*/, '')}`,
    data,
    validateStatus(code) {
      return (code >= 200 && code < 300) || code === 400 || code === 401;
    }
  });
}

const fail = (value?: any) => invalid(value || null);

export interface CreateUserRequestBody {
  email: string;
  password: string;
  profile: Profile;
  acceptedTerms?: boolean;
}

export async function createUser(user: CreateUserRequestBody): Promise<ValidOrInvalid<UserResource.PublicUser, UserResource.CreateValidationErrors>> {
  try {
    const response = await request(HttpMethod.Post, 'users', user);
    switch (response.status) {
      case 201:
        return valid(response.data as UserResource.PublicUser);
      case 400:
        return invalid(response.data as UserResource.CreateValidationErrors);
      default:
        return fail({});
    }
  } catch (error) {
    // tslint:disable:next-line no-console
    console.error(error);
    return fail({});
  }
};

export interface UpdateUserRequestBody {
  _id: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  profile?: Profile;
  acceptedTerms?: boolean;
}

export async function updateUser(user: UpdateUserRequestBody): Promise<ValidOrInvalid<UserResource.PublicUser, UserResource.UpdateValidationErrors>> {
  try {
    const response = await request(HttpMethod.Put, `users/${user._id}`, user);
    switch (response.status) {
      case 200:
        return valid(response.data as UserResource.PublicUser);
      case 400:
      case 401:
        return invalid(response.data as UserResource.CreateValidationErrors);
      default:
        return fail({});
    }
  } catch (error) {
    // tslint:disable:next-line no-console
    console.error(error);
    return fail({});
  }
}

export interface Session {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  sessionId: string;
  user?: {
    id: string;
    type: UserType;
    email: string;
  }
}

export async function createSession(email: string, password: string): Promise<ValidOrInvalid<Session, string[]>> {
  try {
    const response = await request(HttpMethod.Post, 'sessions', { email, password });
    switch (response.status) {
      case 201:
        return valid(response.data as Session);
      case 401:
        return invalid(response.data as string[]);
      default:
        return fail({});
    }
  } catch (error) {
    // tslint:disable:next-line no-console
    console.error(error);
    return fail([]);
  }
}

function withCurrentSession(method: HttpMethod): () => Promise<ValidOrInvalid<Session, null>> {
  return async () => {
    try {
      const response = await request(method, 'sessions/current');
      switch (response.status) {
        case 200:
          return valid(response.data as Session);
        default:
          return fail();
      }
    } catch (error) {
      // tslint:disable:next-line no-console
      console.error(error);
      return fail();
    }
  }
}

export const getSession = withCurrentSession(HttpMethod.Get);

export const deleteSession = withCurrentSession(HttpMethod.Delete);
