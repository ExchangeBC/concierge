import { MAILER_ROOT_URL } from 'back-end/config';
import { send } from 'back-end/lib/mailer';
import ejs from 'ejs';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const TEMPLATE_PATH = resolve(__dirname, './templates/notification.ejs');
const TEMPLATE = readFileSync(TEMPLATE_PATH, 'utf8');

function makeUrl(path: string): string {
  return `${MAILER_ROOT_URL}/${path.replace(/^\/*/, '')}`;
}

interface MakeNotificationParams {
  title?: string;
  body?: string;
  callToAction?: {
    text: string;
    href: string;
  };
}

function makeNotificationHtml({ title, body, callToAction }: MakeNotificationParams): string {
  return ejs.render(TEMPLATE, {
    title,
    body,
    callToAction,
    logo: {
      href: makeUrl(''),
      src: makeUrl('images/logo.svg'),
      alt: 'Procurement Concierge Program'
    }
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
        text: 'Sign In',
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
        text: 'Reset your Password',
        href: makeUrl(`reset-password/${token}/${userId}`)
      }
    })
  });
}
