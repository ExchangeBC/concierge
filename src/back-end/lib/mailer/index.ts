import { CONTACT_EMAIL, MAILER_NOREPLY } from 'back-end/config';
import * as templates from 'back-end/lib/mailer/templates';
import { send } from 'back-end/lib/mailer/transport';
import { PublicFeedback } from 'shared/lib/resources/feedback';
import { PublicRfiResponse } from 'shared/lib/resources/request-for-information/response';
import { profileToName, UserType, VerificationStatus } from 'shared/lib/types';

export async function createUser(email: string): Promise<void> {
  const title = 'Welcome to the Procurement Concierge Program';
  await send({
    to: email,
    subject: title,
    html: templates.simple({
      title,
      description: 'Thank you for creating an account. You can now sign in to the web application.',
      callToAction: {
        text: 'Sign In',
        url: templates.makeUrl('sign-in')
      }
    })
  });
}

export async function deactivateUser(email: string, userType: UserType): Promise<void> {
  await send({
    to: email,
    subject: 'Your Account has been Deactivated',
    html: templates.deactivateUser({ userType })
  });
}

export async function reactivateUser(email: string): Promise<void> {
  const title = 'Welcome back to the Procurement Concierge Program';
  await send({
    to: email,
    subject: title,
    html: templates.simple({
      title,
      description: 'Your Procurement Concierge Program account has been reactivated.',
      callToAction: {
        text: 'Sign In',
        url: templates.makeUrl('sign-in')
      }
    })
  });
}

export async function createForgotPasswordToken(email: string, token: string, userId: string): Promise<void> {
  const title = 'Reset your Password';
  await send({
    to: email,
    subject: title,
    html: templates.simple({
      title,
      description: 'You recently requested to reset your Procurement Concierge Program account password. Please click on the button below to set a new password.',
      callToAction: {
        text: 'Reset your Password',
        url: templates.makeUrl(`reset-password/${token}/${userId}`)
      }
    })
  });
}

interface RfiResponseReceivedParams {
  rfiResponse: PublicRfiResponse;
}

export async function rfiResponseReceived(params: RfiResponseReceivedParams): Promise<void> {
  const { rfiResponse } = params;
  const { rfi } = rfiResponse;
  const rfiName = rfi.latestVersion.rfiNumber;
  const vendorName = profileToName(rfiResponse.createdBy.profile) || '[Undefined Vendor Name]';
  const subject = `${rfiName}: RFI Response Received`;
  await send({
    to: MAILER_NOREPLY,
    bcc: CONTACT_EMAIL,
    subject,
    html: templates.rfiResponseReceived({
      vendor: {
        name: vendorName,
        id: rfiResponse.createdBy._id
      },
      rfi: {
        title: rfi.latestVersion.title,
        rfiNumber: rfi.latestVersion.rfiNumber,
        id: rfi._id
      },
      attachments: rfiResponse.attachments.map(file => ({
        name: file.originalName,
        id: file._id
      }))
    })
  });
}

interface DiscoveryDayResponseReceived {
  rfiName: string;
  rfiId: string;
  vendorName: string;
  vendorId: string;
}

export async function discoveryDayResponseReceived(params: DiscoveryDayResponseReceived): Promise<void> {
  const { rfiName, rfiId, vendorName, vendorId } = params;
  const subject = `${rfiName}: Discovery Session Request`;
  await send({
    to: MAILER_NOREPLY,
    bcc: CONTACT_EMAIL,
    subject,
    html: templates.simple({
      title: 'Discovery Session Request',
      description: `${vendorName} has requested to attend the Discovery Session for ${rfiName}.`,
      linkLists: [
        {
          links: [
            {
              text: `RFI Description (${rfiName})`,
              url: templates.makeUrl(`requests-for-information/${rfiId}/view`)
            },
            {
              text: `Vendor Profile (${vendorName})`,
              url: templates.makeUrl(`users/${vendorId}`)
            }
          ]
        }
      ]
    })
  });
}

interface CreateFeedbackEmailParams {
  feedbackEmail: string;
  feedbackResponse: PublicFeedback;
}

export async function createFeedback(params: CreateFeedbackEmailParams): Promise<void> {
  const { feedbackEmail, feedbackResponse } = params;
  const subject = 'Feedback Received';
  await send({
    to: feedbackEmail,
    subject,
    html: templates.feedback({
      rating: feedbackResponse.rating,
      text: feedbackResponse.text,
      userType: feedbackResponse.userType
    })
  });
}

export async function buyerStatusUpdated(buyerEmail: string, verificationStatus: VerificationStatus): Promise<void> {
  await send({
    to: buyerEmail,
    subject: 'Account Status Updated',
    html: templates.buyerStatusUpdated({ verificationStatus })
  });
}
