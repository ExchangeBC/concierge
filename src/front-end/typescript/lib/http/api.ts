import * as FileMulti from 'front-end/lib/components/form-field-multi/file';
import { prefixRequest } from 'front-end/lib/http';
import shajs from 'sha.js';
import * as DdrResource from 'shared/lib/resources/discovery-day-response';
import * as FeedbackResource from 'shared/lib/resources/feedback';
import * as FileResource from 'shared/lib/resources/file';
import * as ForgotPasswordTokenResource from 'shared/lib/resources/forgot-password-token';
import * as RfiResource from 'shared/lib/resources/request-for-information';
import * as RfiResponseResource from 'shared/lib/resources/request-for-information/response';
import * as SessionResource from 'shared/lib/resources/session';
import * as UserResource from 'shared/lib/resources/user';
import * as ViResource from 'shared/lib/resources/vendor-idea';
import * as LogItemResource from 'shared/lib/resources/vendor-idea/log-item';
import { AuthLevel, HttpMethod, Omit, PaginatedList, UserType } from 'shared/lib/types';
import { ArrayValidation, invalid, valid, validateArrayAsync, ValidOrInvalid } from 'shared/lib/validators';

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

export async function createUser(user: UserResource.CreateRequestBody): Promise<ValidOrInvalid<UserResource.PublicUser, UserResource.CreateValidationErrors>> {
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
};

export async function updateUser(user: UserResource.UpdateRequestBody): Promise<ValidOrInvalid<UserResource.PublicUser, UserResource.UpdateValidationErrors>> {
  user.currentPassword = user.currentPassword ? hashPassword(user.currentPassword) : undefined;
  user.newPassword = user.newPassword ? hashPassword(user.newPassword) : undefined;
  const response = await request(HttpMethod.Put, `users/${user.id}`, user);
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
}

export type RawReadManyUserResponseBody = PaginatedList<RawUser>;
export type ReadManyUserResponseBody = PaginatedList<UserResource.PublicUser>;

export async function readManyUsers(): Promise<ValidOrInvalid<ReadManyUserResponseBody, null>> {
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
}

export async function readOneUser(userId: string): Promise<ValidOrInvalid<UserResource.PublicUser, null>> {
  const response = await request(HttpMethod.Get, `users/${userId}`);
  switch (response.status) {
    case 200:
      const rawUser = response.data as RawUser;
      return valid(rawUserToPublicUser(rawUser));
    default:
      return invalid(null);
  }
}

export async function hasUserAcceptedTerms(userId: string): Promise<boolean> {
  const user = await readOneUser(userId);
  if (user.tag === 'invalid') { return false; }
  return !!user.value.acceptedTermsAt;
}

export async function deleteUser(userId: string): Promise<ValidOrInvalid<null, null>> {
  await request(HttpMethod.Delete, `users/${userId}`);
  return valid(null);
}

export interface RawSession extends Omit<SessionResource.PublicSession, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

function rawSessionToSession(raw: RawSession): SessionResource.PublicSession {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt)
  };
}

export async function createSession(body: SessionResource.CreateRequestBody): Promise<ValidOrInvalid<SessionResource.PublicSession, string[]>> {
  body.password = hashPassword(body.password);
  const response = await request(HttpMethod.Post, 'sessions', body);
  switch (response.status) {
    case 201:
      const rawSession = response.data as RawSession;
      return valid(rawSessionToSession(rawSession));
    case 401:
      return invalid(response.data as string[]);
    default:
      return invalid([]);
  }
}

function withCurrentSession(method: HttpMethod): () => Promise<ValidOrInvalid<SessionResource.PublicSession, null>> {
return async () => {
    const response = await request(method, 'sessions/current');
    switch (response.status) {
      case 200:
        const rawSession = response.data as RawSession;
        return valid(rawSessionToSession(rawSession));
      default:
        return invalid(null);
    }
  }
}

export const getSession = withCurrentSession(HttpMethod.Get);

export const deleteSession = withCurrentSession(HttpMethod.Delete);

export interface RawFeedback extends Omit<FeedbackResource.PublicFeedback, 'createdAt'> {
  createdAt: string;
}

function rawFeedbackToFeedback(raw: RawFeedback): FeedbackResource.PublicFeedback {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt)
  };
}

export async function createFeedback(body: FeedbackResource.CreateRequestBody): Promise<ValidOrInvalid<FeedbackResource.PublicFeedback, FeedbackResource.CreateValidationErrors>> {
  const response = await request(HttpMethod.Post, 'feedback', body);
  switch (response.status) {
    case 201:
      const rawFeedback = body as RawFeedback;
      return valid(rawFeedbackToFeedback(rawFeedback));
    default:
      return invalid(response.data as FeedbackResource.CreateValidationErrors);
  }
}

export async function createForgotPasswordToken(body: ForgotPasswordTokenResource.CreateRequestBody): Promise<ValidOrInvalid<null, null>> {
  const response = await request(HttpMethod.Post, 'forgot-password-tokens', body);
  switch (response.status) {
    case 201:
      return valid(null);
    default:
      return invalid(null);
  }
}

// i.e. Reset password using forgot-password token.
export async function updateForgotPasswordToken(body: ForgotPasswordTokenResource.UpdateRequestBody): Promise<ValidOrInvalid<null, ForgotPasswordTokenResource.UpdateValidationErrors>> {
  const { token, userId } = body;
  let { password } = body;
  password = hashPassword(password);
  const response = await request(HttpMethod.Put, `forgot-password-tokens/${token}`, { userId, password });
  switch (response.status) {
    case 200:
      return valid(null);
    default:
      return invalid(response.data as ForgotPasswordTokenResource.UpdateValidationErrors);
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
  authLevel?: AuthLevel<UserType>;
  alias?: string;
  file: File;
}

export async function createFile(file: CreateFileRequestBody): Promise<ValidOrInvalid<FileResource.PublicFile, string[]>> {
  const requestBody = new FormData();
  requestBody.append('file', file.file);
  requestBody.append('name', file.name);
  requestBody.append('metadata', JSON.stringify({
    authLevel: file.authLevel,
    alias: file.alias
  }));
  const response = await request(HttpMethod.Post, 'files', requestBody);
  switch (response.status) {
    case 200:
    case 201:
      const rawFile = response.data as RawFile;
      return valid(rawFileToPublicFile(rawFile));
    case 400:
    case 401:
      return invalid(response.data as string[]);
    default:
      return invalid([]);
  }
}

export async function readOneFile(id: string): Promise<ValidOrInvalid<FileResource.PublicFile, string[]>> {
  const response = await request(HttpMethod.Get, `files/${id}`);
  switch (response.status) {
    case 200:
      const rawFile = response.data as RawFile;
      return valid(rawFileToPublicFile(rawFile));
    case 401:
    case 404:
      return invalid(response.data as string[]);
    default:
      return invalid([]);
  }
}

/**
 * Uploads a set of files to the back-end and returns
 * a promise of their `_id`s.
 */

export async function uploadFiles(files: FileMulti.Value[], authLevel?: AuthLevel<UserType>): Promise<ArrayValidation<string>> {
  return validateArrayAsync(files, async file => {
    switch (file.tag) {
      case 'existing':
        return valid(file.value._id);
      case 'new':
        const result = await createFile({ ...file.value, authLevel });
        return result.tag === 'valid' ? valid(result.value._id) : result;
    }
  });
}

interface RawDiscoveryDay extends Omit<RfiResource.PublicDiscoveryDay, 'occurringAt'> {
  occurringAt: string;
}

interface RawRfiVersion extends Omit<RfiResource.PublicVersion, 'createdAt' | 'closingAt' | 'attachments' | 'discoveryDay'> {
  createdAt: string;
  closingAt: string;
  attachments: RawFile[];
  discoveryDay: RawDiscoveryDay;
}

interface RawRfi extends Omit<RfiResource.PublicRfi, 'createdAt' | 'publishedAt' | 'latestVersion'> {
  createdAt: string;
  publishedAt: string;
  latestVersion: RawRfiVersion;
}

function rawRfiToPublicRfi(raw: RawRfi): RfiResource.PublicRfi {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    publishedAt: new Date(raw.publishedAt),
    latestVersion: {
      ...raw.latestVersion,
      createdAt: new Date(raw.latestVersion.createdAt),
      closingAt: new Date(raw.latestVersion.closingAt),
      discoveryDay: raw.latestVersion.discoveryDay && {
        ...raw.latestVersion.discoveryDay,
        occurringAt: new Date(raw.latestVersion.discoveryDay.occurringAt)
      },
      attachments: raw.latestVersion.attachments.map(file => rawFileToPublicFile(file)),
      addenda: raw.latestVersion.addenda.map(addendum => ({
        ...addendum,
        createdAt: new Date(addendum.createdAt),
        updatedAt: new Date(addendum.updatedAt)
      }))
    }
  };
}

export async function createRfi(rfi: RfiResource.CreateRequestBody): Promise<ValidOrInvalid<RfiResource.PublicRfi, RfiResource.CreateValidationErrors>> {
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
}

export async function updateRfi(rfiId: string, rfi: RfiResource.CreateRequestBody): Promise<ValidOrInvalid<RfiResource.PublicRfi, RfiResource.UpdateValidationErrors>> {
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
}

export async function readOneRfi(rfiId: string): Promise<ValidOrInvalid<RfiResource.PublicRfi, null>> {
  const response = await request(HttpMethod.Get, `requestsForInformation/${rfiId}`);
  switch (response.status) {
    case 200:
      const rawRfi = response.data as RawRfi;
      return valid(rawRfiToPublicRfi(rawRfi));
    default:
      return invalid(null);
  }
}

type RawReadManyRfiResponseBody = PaginatedList<RawRfi>;

export type ReadManyRfiResponseBody = PaginatedList<RfiResource.PublicRfi>;

export async function readManyRfis(): Promise<ValidOrInvalid<ReadManyRfiResponseBody, null>> {
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
}

export async function createRfiPreview(rfi: RfiResource.CreateRequestBody): Promise<ValidOrInvalid<RfiResource.PublicRfi, RfiResource.CreateValidationErrors>> {
  const response = await request(HttpMethod.Post, 'requestForInformationPreviews', rfi);
  switch (response.status) {
    case 201:
      const rawRfi = response.data as RawRfi;
      return valid(rawRfiToPublicRfi(rawRfi));
    case 400:
      return invalid(response.data as RfiResource.CreateValidationErrors);
    default:
      return invalid({});
  }
}

export async function readOneRfiPreview(rfiId: string): Promise<ValidOrInvalid<RfiResource.PublicRfi, null>> {
  const response = await request(HttpMethod.Get, `requestForInformationPreviews/${rfiId}`);
  switch (response.status) {
    case 200:
      const rawRfi = response.data as RawRfi;
      return valid(rawRfiToPublicRfi(rawRfi));
    default:
      return invalid(null);
  }
}

interface RawDdr extends Omit<DdrResource.PublicDiscoveryDayResponse, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

function rawDdrToPublicDdr(raw: RawDdr): DdrResource.PublicDiscoveryDayResponse {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt)
  };
}

export async function createDdr(ddr: DdrResource.CreateRequestBody): Promise<ValidOrInvalid<DdrResource.PublicDiscoveryDayResponse, DdrResource.CreateValidationErrors>> {
  const response = await request(HttpMethod.Post, 'discoveryDayResponses', ddr);
  switch (response.status) {
    case 200:
    case 201:
      const rawDdr = response.data as RawDdr;
      return valid(rawDdrToPublicDdr(rawDdr));
    case 400:
      return invalid(response.data as DdrResource.CreateValidationErrors);
    default:
      return invalid({});
  }
}

export async function readOneDdr(vendorId: string, rfiId: string): Promise<ValidOrInvalid<DdrResource.PublicDiscoveryDayResponse, null>> {
  const response = await request(HttpMethod.Get, `discoveryDayResponses/${vendorId}?rfiId=${rfiId}`);
  switch (response.status) {
    case 200:
      const rawDdr = response.data as RawDdr;
      return valid(rawDdrToPublicDdr(rawDdr));
    case 400:
      return invalid(null);
    default:
      return invalid(null);
  }
}

export async function updateDdr(vendorId: string, rfiId: string, attendees: DdrResource.Attendee[]): Promise<ValidOrInvalid<DdrResource.PublicDiscoveryDayResponse, DdrResource.UpdateValidationErrors>> {
  const response = await request(HttpMethod.Put, `discoveryDayResponses/${vendorId}?rfiId=${rfiId}`, { attendees });
  switch (response.status) {
    case 200:
      const rawDdr = response.data as RawDdr;
      return valid(rawDdrToPublicDdr(rawDdr));
    case 400:
    case 401:
      return invalid(response.data as DdrResource.UpdateValidationErrors);
    default:
      return invalid({});
  }
}

export async function deleteDdr(vendorId: string, rfiId: string): Promise<ValidOrInvalid<null, null>> {
  const response = await request(HttpMethod.Delete, `discoveryDayResponses/${vendorId}?rfiId=${rfiId}`);
  switch (response.status) {
    case 200:
      return valid(null);
    case 400:
      return invalid(null);
    default:
      return invalid(null);
  }
}

interface RawRfiResponse extends Pick<RfiResponseResource.PublicRfiResponse, '_id'> {
  createdAt: string;
  createdBy: RawUser;
  attachments: RawFile[];
}

function rawRfiResponseToPublicRfiResponse(raw: RawRfiResponse): RfiResponseResource.PublicRfiResponse {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    createdBy: rawUserToPublicUser(raw.createdBy),
    attachments: raw.attachments.map(file => rawFileToPublicFile(file))
  };
}

export async function createRfiResponse(rfiResponse: RfiResponseResource.CreateRequestBody): Promise<ValidOrInvalid<RfiResponseResource.PublicRfiResponse, RfiResponseResource.CreateValidationErrors>> {
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
}

type RawReadManyRfiResponsesResponseBody = PaginatedList<RawRfiResponse>;

export type ReadManyRfiResponsesResponseBody = PaginatedList<RfiResponseResource.PublicRfiResponse>;

export async function readManyRfiResponses(rfiId: string): Promise<ValidOrInvalid<ReadManyRfiResponsesResponseBody, null>> {
  const response = await request(HttpMethod.Get, `requestForInformationResponses?rfiId=${rfiId}`);
  switch (response.status) {
    case 200:
      const rawResponseBody = response.data as RawReadManyRfiResponsesResponseBody;
      return valid({
        ...rawResponseBody,
        items: rawResponseBody.items.map(rawRfi => rawRfiResponseToPublicRfiResponse(rawRfi))
      });
    default:
      return invalid(null);
  }
}

interface RawLogItem extends Omit<LogItemResource.PublicLogItem, 'createdAt' | 'createdBy' | 'attachments'> {
  createdAt: string;
  createdBy?: RawUser;
  attachments: RawFile[];
}

function rawLogItemToPublicLogItem(raw: RawLogItem): LogItemResource.PublicLogItem {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    createdBy: raw.createdBy && rawUserToPublicUser(raw.createdBy),
    attachments: raw.attachments.map(file => rawFileToPublicFile(file))
  };
}

export async function createViLogItem(body: LogItemResource.CreateRequestBody): Promise<ValidOrInvalid<LogItemResource.PublicLogItem, LogItemResource.CreateValidationErrors>> {
  const response = await request(HttpMethod.Post, `unsolicitedProposalLogItems`, body);
  switch (response.status) {
    case 201:
      const rawResponseBody = response.data as RawLogItem;
      return valid(rawLogItemToPublicLogItem(rawResponseBody));
    default:
      return invalid(response.data);
  }
}

interface RawViVersionForBuyers extends Omit<ViResource.PublicVersionForBuyers, 'createdAt' | 'attachments'> {
  createdAt: string;
  attachments: RawFile[];
}

function rawViVersionForBuyersToPublicViVersionForBuyers(raw: RawViVersionForBuyers): ViResource.PublicVersionForBuyers {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    attachments: raw.attachments.map(file => rawFileToPublicFile(file))
  };
}

interface RawViVersionForProgramStaff extends Omit<ViResource.PublicVersionForProgramStaff, 'createdAt' | 'createdBy' | 'attachments'> {
  createdAt: string;
  createdBy: RawUser;
  attachments: RawFile[];
}

function rawViVersionForProgramStaffToPublicViVersionForProgramStaff(raw: RawViVersionForProgramStaff): ViResource.PublicVersionForProgramStaff {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    createdBy: rawUserToPublicUser(raw.createdBy),
    attachments: raw.attachments.map(file => rawFileToPublicFile(file))
  };
}

interface RawViVersionForVendors extends Omit<ViResource.PublicVersionForVendors, 'createdAt' | 'attachments'> {
  createdAt: string;
  attachments: RawFile[];
}

function rawViVersionForVendorsToPublicViVersionForVendors(raw: RawViVersionForVendors): ViResource.PublicVersionForVendors {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    attachments: raw.attachments.map(file => rawFileToPublicFile(file))
  };
}

interface RawViForBuyers extends Omit<ViResource.PublicVendorIdeaForBuyers, 'createdAt' | 'latestVersion'> {
  createdAt: string;
  latestVersion: RawViVersionForBuyers;
}

function rawViForBuyersToPublicViForBuyers(raw: RawViForBuyers): ViResource.PublicVendorIdeaForBuyers {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    latestVersion: rawViVersionForBuyersToPublicViVersionForBuyers(raw.latestVersion)
  };
}

interface RawViForVendors extends Omit<ViResource.PublicVendorIdeaForVendors, 'createdAt' | 'latestVersion' | 'createdBy'> {
  createdAt: string;
  latestVersion: RawViVersionForVendors;
  createdBy: RawUser;
}

function rawViForVendorsToPublicViForVendors(raw: RawViForVendors): ViResource.PublicVendorIdeaForVendors {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    latestVersion: rawViVersionForVendorsToPublicViVersionForVendors(raw.latestVersion),
    createdBy: rawUserToPublicUser(raw.createdBy)
  };
}

interface RawViForProgramStaff extends Omit<ViResource.PublicVendorIdeaForProgramStaff, 'createdAt' | 'latestVersion' | 'createdBy' | 'log'> {
  createdAt: string;
  latestVersion: RawViVersionForProgramStaff;
  createdBy: RawUser;
  log: RawLogItem[];
}

function rawViForProgramStaffToPublicViForProgramStaff(raw: RawViForProgramStaff): ViResource.PublicVendorIdeaForProgramStaff {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    latestVersion: rawViVersionForProgramStaffToPublicViVersionForProgramStaff(raw.latestVersion),
    createdBy: rawUserToPublicUser(raw.createdBy),
    log: raw.log.map(item => rawLogItemToPublicLogItem(item))
  };
}

// Only vendors create vendor ideas.
export async function createVi(vi: ViResource.CreateRequestBody): Promise<ValidOrInvalid<ViResource.PublicVendorIdeaForVendors, ViResource.CreateValidationErrors>> {
  const response = await request(HttpMethod.Post, 'unsolicitedProposals', vi);
  switch (response.status) {
    case 201:
      const rawVi = response.data as RawViForVendors;
      return valid(rawViForVendorsToPublicViForVendors(rawVi));
    case 400:
      return invalid(response.data as ViResource.CreateValidationErrors);
    default:
      return invalid({});
  }
}

interface RawViVersionSlim extends Omit<ViResource.PublicVersionSlim, 'createdAt'> {
  createdAt: string;
}

interface RawViSlimForBuyers extends Omit<ViResource.PublicVendorIdeaSlimForBuyers, 'createdAt' | 'latestVersion'> {
  createdAt: string;
  latestVersion: RawViVersionSlim;
}

function rawViSlimForBuyersToPublicViSlimForBuyers(raw: RawViSlimForBuyers): ViResource.PublicVendorIdeaSlimForBuyers {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    latestVersion: {
      ...raw.latestVersion,
      createdAt: new Date(raw.createdAt)
    }
  };
}

function rawViSlimForVendorsToPublicViSlimForVendors(raw: RawViSlimForVendors): ViResource.PublicVendorIdeaSlimForVendors {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    latestVersion: {
      ...raw.latestVersion,
      createdAt: new Date(raw.createdAt)
    }
  };
}

function rawViSlimForProgramStaffToPublicViSlimForProgramStaff(raw: RawViSlimForProgramStaff): ViResource.PublicVendorIdeaSlimForProgramStaff {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt),
    latestVersion: {
      ...raw.latestVersion,
      createdAt: new Date(raw.createdAt)
    }
  };
}

interface RawViSlimForVendors extends Omit<ViResource.PublicVendorIdeaSlimForVendors, 'createdAt' | 'latestVersion'> {
  createdAt: string;
  latestVersion: RawViVersionSlim;
}

interface RawViSlimForProgramStaff extends Omit<ViResource.PublicVendorIdeaSlimForProgramStaff, 'createdAt' | 'latestVersion'> {
  createdAt: string;
  latestVersion: RawViVersionSlim;
}

export async function readManyVisForBuyers(): Promise<ValidOrInvalid<PaginatedList<ViResource.PublicVendorIdeaSlimForBuyers>, null>> {
  const response = await request(HttpMethod.Get, 'unsolicitedProposals');
  switch (response.status) {
    case 200:
      const raw = response.data as PaginatedList<RawViSlimForBuyers>;
      return valid({
        ...raw,
        items: raw.items.map(i => rawViSlimForBuyersToPublicViSlimForBuyers(i))
      });
    default:
      return invalid(null);
  }
}

export async function readManyVisForVendors(): Promise<ValidOrInvalid<PaginatedList<ViResource.PublicVendorIdeaSlimForVendors>, null>> {
  const response = await request(HttpMethod.Get, 'unsolicitedProposals');
  switch (response.status) {
    case 200:
      const raw = response.data as PaginatedList<RawViSlimForVendors>;
      return valid({
        ...raw,
        items: raw.items.map(i => rawViSlimForVendorsToPublicViSlimForVendors(i))
      });
    default:
      return invalid(null);
  }
}

export async function readManyVisForProgramStaff(): Promise<ValidOrInvalid<PaginatedList<ViResource.PublicVendorIdeaSlimForProgramStaff>, null>> {
  const response = await request(HttpMethod.Get, 'unsolicitedProposals');
  switch (response.status) {
    case 200:
      const raw = response.data as PaginatedList<RawViSlimForProgramStaff>;
      return valid({
        ...raw,
        items: raw.items.map(i => rawViSlimForProgramStaffToPublicViSlimForProgramStaff(i))
      });
    default:
      return invalid(null);
  }
}

export async function readOneViForBuyers(id: string): Promise<ValidOrInvalid<ViResource.PublicVendorIdeaForBuyers, null>> {
  const response = await request(HttpMethod.Get, `unsolicitedProposals/${id}`);
  switch (response.status) {
    case 200:
      const rawVi = response.data as RawViForBuyers;
      return valid(rawViForBuyersToPublicViForBuyers(rawVi));
    default:
      return invalid(null);
  }
}

export async function readOneViForProgramStaff(id: string): Promise<ValidOrInvalid<ViResource.PublicVendorIdeaForProgramStaff, null>> {
  const response = await request(HttpMethod.Get, `unsolicitedProposals/${id}`);
  switch (response.status) {
    case 200:
      const rawVi = response.data as RawViForProgramStaff;
      return valid(rawViForProgramStaffToPublicViForProgramStaff(rawVi));
    default:
      return invalid(null);
  }
}

export async function readOneViForVendors(id: string): Promise<ValidOrInvalid<ViResource.PublicVendorIdeaForVendors, null>> {
  const response = await request(HttpMethod.Get, `unsolicitedProposals/${id}`);
  switch (response.status) {
    case 200:
      const rawVi = response.data as RawViForVendors;
      return valid(rawViForVendorsToPublicViForVendors(rawVi));
    default:
      return invalid(null);
  }
}

export async function updateViForVendors(vi: ViResource.UpdateRequestBody, id: string): Promise<ValidOrInvalid<ViResource.PublicVendorIdeaForVendors, ViResource.UpdateValidationErrors>> {
  const response = await request(HttpMethod.Put, `unsolicitedProposals/${id}`, vi);
  switch (response.status) {
    case 200:
      const rawVi = response.data as RawViForVendors;
      return valid(rawViForVendorsToPublicViForVendors(rawVi));
    case 400:
      return invalid(response.data as ViResource.UpdateValidationErrors);
    default:
      return invalid({});
  }
}

export async function updateViForProgramStaff(vi: ViResource.UpdateRequestBody, id: string): Promise<ValidOrInvalid<ViResource.PublicVendorIdeaForProgramStaff, ViResource.UpdateValidationErrors>> {
  const response = await request(HttpMethod.Put, `unsolicitedProposals/${id}`, vi);
  switch (response.status) {
    case 200:
      const rawVi = response.data as RawViForProgramStaff;
      return valid(rawViForProgramStaffToPublicViForProgramStaff(rawVi));
    case 400:
      return invalid(response.data as ViResource.UpdateValidationErrors);
    default:
      return invalid({});
  }
}
