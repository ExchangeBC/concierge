import { MAILER_CONFIG, MAILER_FROM } from 'back-end/config';
import { makeDomainLogger } from 'back-end/lib/logger';
import { console as consoleAdapter } from 'back-end/lib/logger/adapters';
import { fromString } from 'html-to-text';
import nodemailer from 'nodemailer';

const logger = makeDomainLogger(consoleAdapter, 'mailer');

const transport = nodemailer.createTransport(MAILER_CONFIG);

export interface SendParams {
  to: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
}

export function send(params: SendParams): Promise<void> {
  return new Promise((resolve) => {
    transport.sendMail(
      {
        ...params,
        from: MAILER_FROM,
        text: fromString(params.html, { wordwrap: 130 })
      },
      (error) => {
        if (error) {
          // Do not reject promise, only log the error.
          logger.error('Unable to send email', {
            errorMessage: error.message,
            errorStack: error.stack,
            to: params.to,
            bcc: params.bcc,
            subject: params.subject
          });
        }
        resolve();
      }
    );
  });
}
