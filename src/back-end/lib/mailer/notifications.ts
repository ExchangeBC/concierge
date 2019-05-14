import { MAILER_NOREPLY, MAILER_ROOT_URL } from 'back-end/config';
import { send } from 'back-end/lib/mailer';
import ejs from 'ejs';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { PublicRfiResponse } from 'shared/lib/resources/request-for-information/response';
import { profileToName } from 'shared/lib/types';

const TEMPLATE_PATH = resolve(__dirname, './templates/notification.ejs');
const TEMPLATE = readFileSync(TEMPLATE_PATH, 'utf8');

function makeUrl(path: string): string {
  return `${MAILER_ROOT_URL}/${path.replace(/^\/*/, '')}`;
}

interface Link {
  name: string;
  href: string;
}

interface LinkList {
  name: string;
  links: Link[];
}

interface MakeNotificationParams {
  title?: string;
  body?: string;
  linkLists?: LinkList[];
  callToAction?: Link;
}

function makeNotificationHtml(params: MakeNotificationParams): string {
  return ejs.render(TEMPLATE, {
    data: {
      ...params,
      logo: {
        href: makeUrl(''),
        src: makeUrl('images/logo.svg'),
        alt: 'Procurement Concierge Program'
      }
    }
  }, {
    filename: TEMPLATE_PATH
  });
}

export async function createUser(email: string): Promise<void> {
  const title = 'Welcome to the Procurement Concierge Program';
  await send({
    to: email,
    subject: title,
    html: makeNotificationHtml({
      title,
      body: 'Thank you for creating an account. You can now sign in to the web application.',
      callToAction: {
        name: 'Sign In',
        href: makeUrl('sign-in')
      }
    })
  });
}

export async function deleteUser(email: string): Promise<void> {
  const title = 'You have Deactivated your Account';
  await send({
    to: email,
    subject: title,
    html: makeNotificationHtml({
      title,
      body: 'Your request to deactivate your account has been processed. You no longer have access to the Procurement Concierge Program\'s Web Application.'
    })
  });
}

export async function createForgotPasswordToken(email: string, token: string, userId: string): Promise<void> {
  const title = 'Reset your Password';
  await send({
    to: email,
    subject: title,
    html: makeNotificationHtml({
      title,
      body: 'You recently requested to reset your Procurement Concierge Program account password. Please click on the button below to set a new password.',
      callToAction: {
        name: 'Reset your Password',
        href: makeUrl(`reset-password/${token}/${userId}`)
      }
    })
  });
}

// TODO make these params more explicit of their requirements
interface CreateRfiResponseProgramStaffParams {
  programStaffEmails: string[];
  rfiResponse: PublicRfiResponse;
}

export async function createRfiResponseProgramStaff(params: CreateRfiResponseProgramStaffParams): Promise<void> {
  // TODO latestVersion will no longer be optional.
  const { programStaffEmails, rfiResponse } = params;
  const { rfi } = rfiResponse;
  const rfiName = rfi.latestVersion ? rfi.latestVersion.rfiNumber : '[Undefined RFI Number]';
  const vendorName = profileToName(rfiResponse.createdBy.profile) || '[Undefined Vendor Name]';
  const subject = `${rfiName}: RFI Response Received`;
  await send({
    to: MAILER_NOREPLY,
    bcc: programStaffEmails,
    subject,
    html: makeNotificationHtml({
      title: 'RFI Response Received',
      body: `${vendorName} has submitted a response to ${rfiName}.`,
      linkLists: [
        {
          name: 'Details',
          links: [
            {
              name: `RFI Description (${rfiName})`,
              // TODO use front-end function (move to shared) to generate paths.
              href: `${MAILER_ROOT_URL}/requests-for-information/${rfi._id}/view`
            },
            {
              name: `Vendor Profile (${vendorName})`,
              href: `${MAILER_ROOT_URL}/profiles/${rfiResponse.createdBy._id}`
            }
          ]
        },
        {
          name: 'Attachments',
          links: rfiResponse.attachments.map(file => ({
            name: file.originalName,
            href: `${MAILER_ROOT_URL}/api/fileBlobs/${file._id}`
          }))
        }
      ]
    })
  });
}

interface CreateDdrProgramStaffParams {
  programStaffEmails: string[];
  rfiName: string;
  rfiId: string;
  vendorName: string;
  vendorId: string;
}

export async function createDdrProgramStaff(params: CreateDdrProgramStaffParams): Promise<void> {
  const { programStaffEmails, rfiName, rfiId, vendorName, vendorId } = params;
  const subject = `${rfiName}: Discovery Session Request`;
  await send({
    to: MAILER_NOREPLY,
    bcc: programStaffEmails,
    subject,
    html: makeNotificationHtml({
      title: 'Discovery Session Request',
      body: `${vendorName} has requested to attend the Discovery Session for ${rfiName}.`,
      linkLists: [
        {
          name: 'Details',
          links: [
            {
              name: `RFI Description (${rfiName})`,
              // TODO use front-end function (move to shared) to generate paths.
              href: `${MAILER_ROOT_URL}/requests-for-information/${rfiId}/view`
            },
            {
              name: `Vendor Profile (${vendorName})`,
              href: `${MAILER_ROOT_URL}/profiles/${vendorId}`
            }
          ]
        }
      ]
    })
  });
}
