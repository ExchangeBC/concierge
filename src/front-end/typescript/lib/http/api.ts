import { prefixRequest } from 'front-end/lib/http';
import shajs from 'sha.js';
import * as DdrResource from 'shared/lib/resources/discovery-day-response';
import * as FileResource from 'shared/lib/resources/file';
import * as ForgotPasswordTokenResource from 'shared/lib/resources/forgot-password-token';
import * as RfiResource from 'shared/lib/resources/request-for-information';
import * as RfiResponseResource from 'shared/lib/resources/request-for-information-response';
import * as UserResource from 'shared/lib/resources/user';
import { HttpMethod, Omit, PaginatedList, Profile, UserType } from 'shared/lib/types';
import { invalid, valid, ValidOrInvalid } from 'shared/lib/validators';

const request = prefixRequest('api');

// Use this function to hash passwords before sending them to the server.
// It's important not to send plaintext passwords to the back-end.
export function hashPassword(plaintext: string): string {
  return shajs('sha256').update(plaintext).digest('base64');
}

export interface RawUser extends Omit<UserResource.PublicUser, 'createdAt' | 'updatedAt' | 'acceptedTermsAt'> {
  createdAt: string;
  updatedAt: string;
  acceptedTermsAt?: string;
}

function rawUserToPublicUser(raw: RawUser): UserResource.PublicUser {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
    acceptedTermsAt: raw.acceptedTermsAt === undefined ? undefined : new Date(raw.acceptedTermsAt)
  };
}

export interface CreateUserRequestBody {
  email: string;
  password: string;
  profile: Profile;
  acceptedTerms?: boolean;
}

export async function createUser(user: CreateUserRequestBody): Promise<ValidOrInvalid<UserResource.PublicUser, UserResource.CreateValidationErrors>> {
  try {
    user.password = hashPassword(user.password);
    const response = await request(HttpMethod.Post, 'users', user);
    switch (response.status) {
      case 201:
        const rawUser = response.data as RawUser;
        return valid(rawUserToPublicUser(rawUser));
      case 400:
        return invalid(response.data as UserResource.CreateValidationErrors);
      default:
        return invalid({});
    }
  } catch (error) {
    // tslint:disable:next-line no-console
    console.error(error);
    return invalid({});
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
    user.currentPassword = user.currentPassword ? hashPassword(user.currentPassword) : undefined;
    user.newPassword = user.newPassword ? hashPassword(user.newPassword) : undefined;
    const response = await request(HttpMethod.Put, `users/${user._id}`, user);
    switch (response.status) {
      case 200:
        const rawUser = response.data as RawUser;
        return valid(rawUserToPublicUser(rawUser));
      case 400:
      case 401:
        return invalid(response.data as UserResource.CreateValidationErrors);
      default:
        return invalid({});
    }
  } catch (error) {
    // tslint:disable:next-line no-console
    console.error(error);
    return invalid({});
  }
}

export type RawReadManyUserResponseBody = PaginatedList<RawUser>;
export type ReadManyUserResponseBody = PaginatedList<UserResource.PublicUser>;

export async function readManyUsers(): Promise<ValidOrInvalid<ReadManyUserResponseBody, null>> {
  try {
    const response = await request(HttpMethod.Get, 'users');
    switch (response.status) {
      case 200:
        const rawResponseBody = response.data as RawReadManyUserResponseBody;
        const responseBody: ReadManyUserResponseBody = {
          ...rawResponseBody,
          items: rawResponseBody.items.map(user => rawUserToPublicUser(user))
        };
        return valid(responseBody);
      default:
        return invalid(null);
    }
  } catch (error) {
    // tslint:disable:next-line no-console
    console.error(error);
    return invalid(null);
  }
}

export async function readOneUser(userId: string): Promise<ValidOrInvalid<UserResource.PublicUser, null>> {
  try {
    const response = await request(HttpMethod.Get, `users/${userId}`);
    switch (response.status) {
      case 200:
        const rawUser = response.data as RawUser;
        return valid(rawUserToPublicUser(rawUser));
      default:
        return invalid(null);
    }
  } catch (error) {
    // tslint:disable:next-line no-console
    console.error(error);
    return invalid(null);
  }
}

export async function deleteUser(userId: string): Promise<ValidOrInvalid<null, null>> {
  try {
    await request(HttpMethod.Delete, `users/${userId}`);
    return valid(null);
  } catch (error) {
    // tslint:disable:next-line no-console
    console.error(error);
    return invalid(null);
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

export interface RawSession extends Omit<Session, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

function rawSessionToSession(raw: RawSession): Session {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt)
  };
}

export async function createSession(email: string, password: string): Promise<ValidOrInvalid<Session, string[]>> {
  try {
    password = hashPassword(password);
    const response = await request(HttpMethod.Post, 'sessions', { email, password });
    switch (response.status) {
      case 201:
        const rawSession = response.data as RawSession;
        return valid(rawSessionToSession(rawSession));
      case 401:
        return invalid(response.data as string[]);
      default:
        return invalid([]);
    }
  } catch (error) {
    // tslint:disable:next-line no-console
    console.error(error);
    return invalid([]);
  }
}

function withCurrentSession(method: HttpMethod): () => Promise<ValidOrInvalid<Session, null>> {
  return async () => {
    try {
      const response = await request(method, 'sessions/current');
      switch (response.status) {
        case 200:
          const rawSession = response.data as RawSession;
          return valid(rawSessionToSession(rawSession));
        default:
          return invalid(null);
      }
    } catch (error) {
      // tslint:disable:next-line no-console
      console.error(error);
      return invalid(null);
    }
  }
}

export const getSession = withCurrentSession(HttpMethod.Get);

export const deleteSession = withCurrentSession(HttpMethod.Delete);

export async function createForgotPasswordToken(email: string): Promise<ValidOrInvalid<null, null>> {
  try {
    const response = await request(HttpMethod.Post, 'forgot-password-tokens', { email });
    switch (response.status) {
      case 201:
        return valid(null);
      default:
        return invalid(null);
    }
  } catch (error) {
    // tslint:disable:next-line no-console
    console.error(error);
    return invalid(null);
  }
}

// i.e. Reset password using forgot-password token.
export async function updateForgotPasswordToken(token: string, userId: string, password: string): Promise<ValidOrInvalid<null, ForgotPasswordTokenResource.UpdateValidationErrors>> {
  try {
    password = hashPassword(password);
    const response = await request(HttpMethod.Put, `forgot-password-tokens/${token}`, { userId, password });
    switch (response.status) {
      case 200:
        return valid(null);
      default:
        return invalid(response.data as ForgotPasswordTokenResource.UpdateValidationErrors);
    }
  } catch (error) {
    // tslint:disable:next-line no-console
    console.error(error);
    return invalid({});
  }
}

export interface RawFile extends Omit<FileResource.PublicFile, 'createdAt'> {
  createdAt: string;
}

function rawFileToPublicFile(raw: RawFile): FileResource.PublicFile {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt)
  };
}

export interface CreateFileRequestBody {
  name: string;
  file: File;
}

export async function createFile(file: CreateFileRequestBody): Promise<ValidOrInvalid<FileResource.PublicFile, string[]>> {
  try {
    const requestBody = new FormData();
    requestBody.append('file', file.file);
    requestBody.append('name', file.name);
    const response = await request(HttpMethod.Post, 'files', requestBody);
    switch (response.status) {
      case 200:
      case 201:
        const rawFile = response.data as RawFile;
        return valid(rawFileToPublicFile(rawFile));
      case 401:
      case 400:
        return invalid(response.data as string[]);
      default:
        return invalid([]);
    }
  } catch (error) {
    // tslint:disable:next-line no-console
    console.error(error);
    return invalid([]);
  }
}

interface RawRfiVersion extends Omit<RfiResource.PublicVersion, 'createdAt' | 'closingAt' | 'attachments'> {
  createdAt: string;
  closingAt: string;
  attachments: RawFile[];
}

interface RawRfi extends Omit<RfiResource.PublicRfi, 'createdAt' | 'publishedAt' | 'latestVersion'> {
  createdAt: string;
  publishedAt: string;
  latestVersion?: RawRfiVersion;
}

function rawRfiToPublicRfi(raw: RawRfi): RfiResource.PublicRfi {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    publishedAt: new Date(raw.publishedAt),
    latestVersion: raw.latestVersion && {
      ...raw.latestVersion,
      createdAt: new Date(raw.latestVersion.createdAt),
      closingAt: new Date(raw.latestVersion.closingAt),
      attachments: raw.latestVersion.attachments.map(file => rawFileToPublicFile(file)),
      addenda: raw.latestVersion.addenda.map(addendum => ({
        ...addendum,
        createdAt: new Date(addendum.createdAt),
        updatedAt: new Date(addendum.updatedAt)
      }))
    }
  };
}

export interface CreateRfiRequestBody {
  rfiNumber: string;
  title: string;
  publicSectorEntity: string;
  description: string;
  discoveryDay: boolean;
  closingDate: string;
  closingTime: string;
  buyerContact: string;
  programStaffContact: string;
  categories: string[];
  attachments: string[];
  addenda: string[];
}

export async function createRfi(rfi: CreateRfiRequestBody): Promise<ValidOrInvalid<RfiResource.PublicRfi, RfiResource.CreateValidationErrors>> {
  try {
    const response = await request(HttpMethod.Post, 'requestsForInformation', rfi);
    switch (response.status) {
      case 201:
        const rawRfi = response.data as RawRfi;
        return valid(rawRfiToPublicRfi(rawRfi));
      case 400:
        return invalid(response.data as RfiResource.CreateValidationErrors);
      default:
        return invalid({});
    }
  } catch (error) {
    // tslint:disable:next-line no-console
    console.error(error);
    return invalid({});
  }
}

export async function updateRfi(rfiId: string, rfi: CreateRfiRequestBody): Promise<ValidOrInvalid<RfiResource.PublicRfi, RfiResource.UpdateValidationErrors>> {
  try {
    const response = await request(HttpMethod.Put, `requestsForInformation/${rfiId}`, rfi);
    switch (response.status) {
      case 200:
        const rawRfi = response.data as RawRfi;
        return valid(rawRfiToPublicRfi(rawRfi));
      case 400:
        return invalid(response.data as RfiResource.UpdateValidationErrors);
      default:
        return invalid({});
    }
  } catch (error) {
    // tslint:disable:next-line no-console
    console.error(error);
    return invalid({});
  }
}

export async function readOneRfi(rfiId: string): Promise<ValidOrInvalid<RfiResource.PublicRfi, null>> {
  try {
    const response = await request(HttpMethod.Get, `requestsForInformation/${rfiId}`);
    switch (response.status) {
      case 200:
        const rawRfi = response.data as RawRfi;
        return valid(rawRfiToPublicRfi(rawRfi));
      default:
        return invalid(null);
    }
  } catch (error) {
    // tslint:disable:next-line no-console
    console.error(error);
    return invalid(null);
  }
}

type RawReadManyRfiResponseBody = PaginatedList<RawRfi>;

export type ReadManyRfiResponseBody = PaginatedList<RfiResource.PublicRfi>;

export async function readManyRfis(): Promise<ValidOrInvalid<ReadManyRfiResponseBody, null>> {
  try {
    const response = await request(HttpMethod.Get, 'requestsForInformation');
    switch (response.status) {
      case 200:
        const rawResponseBody = response.data as RawReadManyRfiResponseBody;
        return valid({
          ...rawResponseBody,
          items: rawResponseBody.items.map(rawRfi => rawRfiToPublicRfi(rawRfi))
        });
      default:
        return invalid(null);
    }
  } catch (error) {
    // tslint:disable:next-line no-console
    console.error(error);
    return invalid(null);
  }
}

interface RawDdr extends Omit<DdrResource.PublicDiscoveryDayResponse, 'createdAt'> {
  createdAt: string;
}

function rawDdrToPublicDdr(raw: RawDdr): DdrResource.PublicDiscoveryDayResponse {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt)
  };
}

export interface CreateDdrRequestBody {
  rfiId: string;
}

export async function createDdr(ddr: CreateDdrRequestBody): Promise<ValidOrInvalid<DdrResource.PublicDiscoveryDayResponse, DdrResource.CreateValidationErrors>> {
  try {
    const response = await request(HttpMethod.Post, 'discoveryDayResponses', ddr);
    switch (response.status) {
      case 201:
        const rawDdr = response.data as RawDdr;
        return valid(rawDdrToPublicDdr(rawDdr));
      case 400:
        return invalid(response.data as DdrResource.CreateValidationErrors);
      default:
        return invalid({});
    }
  } catch (error) {
    // tslint:disable:next-line no-console
    console.error(error);
    return invalid({});
  }
}

export async function readOneDdr(rfiId: string): Promise<ValidOrInvalid<DdrResource.PublicDiscoveryDayResponse, null>> {
  try {
    const response = await request(HttpMethod.Get, `discoveryDayResponses/${rfiId}`);
    switch (response.status) {
      case 200:
        const rawDdr = response.data as RawDdr;
        return valid(rawDdrToPublicDdr(rawDdr));
      case 400:
        return invalid(null);
      default:
        return invalid(null);
    }
  } catch (error) {
    // tslint:disable:next-line no-console
    console.error(error);
    return invalid(null);
  }
}

interface RawRfiResponse extends Pick<RfiResponseResource.PublicRfiResponse, '_id'> {
  createdAt: string;
  createdBy: RawUser;
  rfi: RawRfi;
  attachments: RawFile[];
}

function rawRfiResponseToPublicRfiResponse(raw: RawRfiResponse): RfiResponseResource.PublicRfiResponse {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    createdBy: rawUserToPublicUser(raw.createdBy),
    rfi: rawRfiToPublicRfi(raw.rfi),
    attachments: raw.attachments.map(file => rawFileToPublicFile(file))
  };
}

export interface CreateRfiResponseRequestBody {
  rfiId: string;
  attachments: string[];
}

export async function createRfiResponse(rfiResponse: CreateRfiResponseRequestBody): Promise<ValidOrInvalid<RfiResponseResource.PublicRfiResponse, RfiResponseResource.CreateValidationErrors>> {
  try {
    const response = await request(HttpMethod.Post, 'requestForInformationResponses', rfiResponse);
    switch (response.status) {
      case 201:
        const rawRfiResponse = response.data as RawRfiResponse;
        return valid(rawRfiResponseToPublicRfiResponse(rawRfiResponse));
      case 400:
        return invalid(response.data as RfiResource.CreateValidationErrors);
      default:
        return invalid({});
    }
  } catch (error) {
    // tslint:disable:next-line no-console
    console.error(error);
    return invalid({});
  }
}
