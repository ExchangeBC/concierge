import { MAILER_CONFIG, MAILER_FROM } from 'back-end/config';
import { fromString } from 'html-to-text';
import nodemailer from 'nodemailer';

const transport = nodemailer.createTransport(MAILER_CONFIG);

export interface SendParams {
  to: string;
  subject: string;
  html: string;
}

export function send(params: SendParams): Promise<void> {
  const { to, subject, html } = params;
  return new Promise((resolve, reject) => {
    transport.sendMail({
      to,
      from: MAILER_FROM,
      subject,
      html,
      text: fromString(html, { wordwrap: 130 })
    }, error => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}
