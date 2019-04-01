import { MAILER_CONFIG, MAILER_FROM } from 'back-end/config';
import { fromString } from 'html-to-text';
import nodemailer from 'nodemailer';

const transport = nodemailer.createTransport(MAILER_CONFIG);

export interface SendParams {
  to: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
}

export function send(params: SendParams): Promise<void> {
  return new Promise((resolve, reject) => {
    transport.sendMail({
      ...params,
      from: MAILER_FROM,
      text: fromString(params.html, { wordwrap: 130 })
    }, error => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}
