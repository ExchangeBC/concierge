import { CONTACT_EMAIL } from 'back-end/config';
import * as templates from 'back-end/lib/mailer/templates';
import { send } from 'back-end/lib/mailer/transport';
import * as RfiSchema from 'back-end/lib/schemas/request-for-information';
import * as UserSchema from 'back-end/lib/schemas/user';
import * as mongoose from 'mongoose';
import React from 'react';
import { formatDate, formatTime } from 'shared/lib';
import { Attendee } from 'shared/lib/resources/discovery-day-response';
import { PublicFeedback } from 'shared/lib/resources/feedback';
import { PublicDiscoveryDay } from 'shared/lib/resources/request-for-information';
import { PublicRfiResponse } from 'shared/lib/resources/request-for-information/response';
import { PublicUser } from 'shared/lib/resources/user';
import { Omit, profileToName, UserType, VerificationStatus } from 'shared/lib/types';

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

interface RfiResponseReceivedToProgramStaffParams {
  rfiResponse: PublicRfiResponse;
  rfi: RfiSchema.Data;
}

export async function rfiResponseReceivedToProgramStaff(params: RfiResponseReceivedToProgramStaffParams): Promise<void> {
  const { rfi, rfiResponse } = params;
  const latestVersion = RfiSchema.getLatestVersion(rfi);
  if (!latestVersion) { return; }
  const rfiName = latestVersion.rfiNumber;
  const vendorName = profileToName(rfiResponse.createdBy.profile);
  const subject = `${rfiName}: RFI Response Received`;
  await send({
    to: CONTACT_EMAIL,
    subject,
    html: templates.simple({
      title: 'RFI Response Received',
      description: (
        <div>
          <p>
            A response has been submitted by <templates.Link url={templates.makeUrl(`users/${rfiResponse.createdBy._id}`)} text={vendorName} /> to <templates.Link url={templates.makeUrl(`requests-for-information/${rfi._id}/edit`)} text={`${latestVersion.rfiNumber}: ${latestVersion.title}`} />.
          </p>
          <p>
            Please note that you will only be able to view this Vendor's profile and download their response's attachments if you have already signed into your Program Staff account in the Procurement Concierge web application. <templates.Link text='Click here to sign in' url={templates.makeUrl('sign-in')} />.
          </p>
        </div>
      ),
      linkLists: [{
        title: 'Attachments',
        links: rfiResponse.attachments.map(file => ({
          text: file.originalName,
          url: templates.makeUrl(`api/fileBlobs/${file._id}`)
        }))
      }],
      callToAction: {
        text: `View ${latestVersion.rfiNumber}'s Responses`,
        url: templates.makeUrl(`requests-for-information/${rfi._id}/edit?activeTab=responses`)
      }
    })
  });
}

interface RfiResponseReceivedToVendorParams {
  rfi: RfiSchema.Data;
  to: string;
}

export async function rfiResponseReceivedToVendor(params: RfiResponseReceivedToVendorParams): Promise<void> {
  const { rfi, to } = params;
  const latestVersion = RfiSchema.getLatestVersion(rfi);
  if (!latestVersion) { return; }
  const rfiName = latestVersion.rfiNumber;
  const subject = `${rfiName}: RFI Response Received`;
  await send({
    to,
    subject,
    html: templates.simple({
      title: 'RFI Response Received',
      description: (
        <p>
          Thank you for submitting your response to <templates.Link url={templates.makeUrl(`requests-for-information/${rfi._id}/edit`)} text={`${latestVersion.rfiNumber}: ${latestVersion.title}`} />. It has been successfully received by the Procurement Concierge Program's staff.
        </p>
      )
    })
  });
}

function makeDiscoveryDaySessionInformation(discoveryDay: PublicDiscoveryDay, showVenue: boolean, showRemoteAccess: boolean): templates.DescriptionListProps {
  const items = [
    { name: 'Date', value: formatDate(discoveryDay.occurringAt) },
    { name: 'Time', value: formatTime(discoveryDay.occurringAt, true) }
  ]
  if (showVenue) {
    items.push({ name: 'Venue', value: discoveryDay.venue });
  }
  if (showRemoteAccess) {
    items.push({ name: 'Remote Access', value: discoveryDay.remoteAccess });
  }
  return {
    title: 'Session Information',
    items
  };
}

interface DiscoveryDayToVendorProps {
  to: string,
  rfi: RfiSchema.Data;
}

interface DiscoveryDayToVendorSoloProps {
  rfi: RfiSchema.Data;
  to: string;
  remote: boolean;
}

interface DiscoveryDayToProgramStaffProps {
  rfi: RfiSchema.Data;
  vendor: UserSchema.Data | PublicUser;
}

interface DiscoveryDayToAttendeesProps {
  rfi: RfiSchema.Data;
  vendor: UserSchema.Data | PublicUser;
  attendees: Attendee[];
}

export async function updateDiscoveryDayToVendor({ rfi, to }: DiscoveryDayToVendorProps): Promise<void> {
  const latestVersion = RfiSchema.getLatestVersion(rfi);
  const discoveryDay = latestVersion && latestVersion.discoveryDay;
  if (!latestVersion || !discoveryDay) { return; }
  const subject = `${latestVersion.rfiNumber}: Discovery Day Session Update`;
  await send({
    to,
    subject,
    html: templates.simple({
      title: 'Discovery Day Session Information Updated',
      description: (
        <div>
          <p>
            The Discovery Day session for <templates.Link url={templates.makeUrl(`requests-for-information/${rfi._id}/view`)} text={`${latestVersion.rfiNumber}: ${latestVersion.title}`} /> has been updated by the Procurement Concierge Program's staff. All attendees will receive an email to notify them of the changes.
          </p>
          <p>
            If this update impacts an attendee's ability to attend the session, please click on the button below to update your registration accordingly. We apologize for any inconvenience this may cause.
          </p>
          <p>
            Please contact the Procurement Concierge Program's staff at <templates.Link url={`mailto:${CONTACT_EMAIL}`} text={CONTACT_EMAIL} /> if you have any questions.
          </p>
        </div>
      ),
      descriptionLists: [makeDiscoveryDaySessionInformation(discoveryDay, true, true)],
      callToAction: makeViewDdrRegistrationCta(rfi._id)
    })
  });
}

export async function updateDiscoveryDayToVendorSolo({ rfi, to, remote }: DiscoveryDayToVendorSoloProps): Promise<void> {
  const latestVersion = RfiSchema.getLatestVersion(rfi);
  const discoveryDay = latestVersion && latestVersion.discoveryDay;
  if (!latestVersion || !discoveryDay) { return; }
  const subject = `${latestVersion.rfiNumber}: Discovery Day Session Update`;
  await send({
    to,
    subject,
    html: templates.simple({
      title: 'Discovery Day Session Information Updated',
      description: (
        <div>
          <p>
            The Discovery Day session for <templates.Link url={templates.makeUrl(`requests-for-information/${rfi._id}/view`)} text={`${latestVersion.rfiNumber}: ${latestVersion.title}`} /> has been updated by the Procurement Concierge Program's staff. You have been registered to attend this session {remote ? 'remotely' : 'in-person'}.
          </p>
          <p>
            If this update impacts your ability to attend the session, please click on the button below to update your registration accordingly. We apologize for any inconvenience this may cause.
          </p>
        </div>
      ),
      descriptionLists: [makeDiscoveryDaySessionInformation(discoveryDay, !remote, remote)],
      callToAction: makeViewDdrRegistrationCta(rfi._id)
    })
  });
}

export async function updateDiscoveryDayToAttendees({ rfi, vendor, attendees }: DiscoveryDayToAttendeesProps): Promise<void> {
  const latestVersion = RfiSchema.getLatestVersion(rfi);
  const discoveryDay = latestVersion && latestVersion.discoveryDay;
  if (!latestVersion || !discoveryDay || vendor.profile.type !== UserType.Vendor) { return; }
  const subject = `${latestVersion.rfiNumber}: Discovery Day Session Update`;
  for await (const attendee of attendees) {
    await send({
      to: attendee.email,
      subject,
      html: templates.simple({
        title: 'Discovery Day Session Information Updated',
        description: (
          <div>
            <p>
              The Discovery Day session for <templates.Link url={templates.makeUrl(`requests-for-information/${rfi._id}/view`)} text={`${latestVersion.rfiNumber}: ${latestVersion.title}`} /> has been updated by the Procurement Concierge Program's staff. You have been registered to attend this session {attendee.remote ? 'remotely' : 'in-person'}.
            </p>
            {vendor.email === attendee.email
              ? null
              : (<p>Please contact {vendor.profile.contactName} at <templates.Link url={`mailto:${vendor.email}`} text={vendor.email} /> if this change impacts your ability to attend this session. We apologize for any inconvenience this may cause.</p>)}
          </div>
        ),
        descriptionLists: [makeDiscoveryDaySessionInformation(discoveryDay, !attendee.remote, attendee.remote)]
      })
    });
  }
}

export async function deleteDiscoveryDayToVendor({ rfi, to }: DiscoveryDayToVendorProps): Promise<void> {
  const latestVersion = RfiSchema.getLatestVersion(rfi);
  if (!latestVersion) { return; }
  const subject = `${latestVersion.rfiNumber}: Discovery Day Session Cancelled`;
  await send({
    to,
    subject,
    html: templates.simple({
      title: 'Discovery Day Session Cancelled',
      description: (
        <div>
          <p>
            The Discovery Day session for <templates.Link url={templates.makeUrl(`requests-for-information/${rfi._id}/view`)} text={`${latestVersion.rfiNumber}: ${latestVersion.title}`} /> has been cancelled by the Procurement Concierge Program's staff. All attendees will receive an email to notify them of the cancellation.
          </p>
          <p>
            Please contact the Procurement Concierge Program's staff at <templates.Link url={`mailto:${CONTACT_EMAIL}`} text={CONTACT_EMAIL} /> if you have any questions. We apologize for any inconvenience this may cause.
          </p>
        </div>
      )
    })
  });
}

export async function deleteDiscoveryDayToAttendees({ rfi, vendor, attendees }: DiscoveryDayToAttendeesProps): Promise<void> {
  const latestVersion = RfiSchema.getLatestVersion(rfi);
  if (!latestVersion || vendor.profile.type !== UserType.Vendor) { return; }
  const subject = `${latestVersion.rfiNumber}: Discovery Day Session Cancelled`;
  for await (const attendee of attendees) {
    await send({
      to: attendee.email,
      subject,
      html: templates.simple({
        title: 'Discovery Day Session Cancelled',
        description: (
          <div>
            <p>
              The Discovery Day session for <templates.Link url={templates.makeUrl(`requests-for-information/${rfi._id}/view`)} text={`${latestVersion.rfiNumber}: ${latestVersion.title}`} /> has been cancelled by the Procurement Concierge Program's staff.
            </p>
            {vendor.email === attendee.email
              ? null
              : (<p>Please contact {vendor.profile.contactName} at <templates.Link url={`mailto:${vendor.email}`} text={vendor.email} /> if you have any questions. We apologize for any inconvenience this may cause.</p>)}
          </div>
        )
      })
    });
  }
}

function makeViewDdrRegistrationCta(rfiId: mongoose.Types.ObjectId): templates.LinkProps {
  return {
    text: 'View Registration',
    url: templates.makeUrl(`requests-for-information/${rfiId.toString()}/attend-discovery-day`)
  };
}

/**
 * A call to action linking Program Staff to the "Discovery Day" tab
 * of an RFI's edit page.
 */

function makeViewDdrRegistrationsCta(rfiId: mongoose.Types.ObjectId): templates.LinkProps {
  return {
    text: 'View Discovery Day Registrations',
    url: templates.makeUrl(`requests-for-information/${rfiId.toString()}/edit?activeTab=discoveryDay`)
  };
}

export async function createDdrToVendor({ rfi, to }: DiscoveryDayToVendorProps): Promise<void> {
  const latestVersion = RfiSchema.getLatestVersion(rfi);
  const discoveryDay = latestVersion && latestVersion.discoveryDay;
  if (!latestVersion || !discoveryDay) { return; }
  const subject = `${latestVersion.rfiNumber}: Discovery Day Session Registration Received`;
  await send({
    to,
    subject,
    html: templates.simple({
      title: 'Discovery Day Session Registration Received',
      description: (
        <div>
          <p>
            Your registration for the Discovery Day session for <templates.Link url={templates.makeUrl(`requests-for-information/${rfi._id}/view`)} text={`${latestVersion.rfiNumber}: ${latestVersion.title}`} /> has been received. All attendees will receive an email confirmation with details on how to attend the event.
          </p>
          <p>
            You can access your registration by clicking on the button below. Any changes to your registration, including whether a registrant is attending the session in-person or remotely, can be submitted prior to its start date. Please note that in-person attendees can only be added to your registration at least 24 hours before a session's scheduled time.
          </p>
        </div>
      ),
      descriptionLists: [makeDiscoveryDaySessionInformation(discoveryDay, true, true)],
      callToAction: makeViewDdrRegistrationCta(rfi._id)
    })
  });
}

export async function createDdrToVendorSolo({ rfi, to, remote }: DiscoveryDayToVendorSoloProps): Promise<void> {
  const latestVersion = RfiSchema.getLatestVersion(rfi);
  const discoveryDay = latestVersion && latestVersion.discoveryDay;
  if (!latestVersion || !discoveryDay) { return; }
  const subject = `${latestVersion.rfiNumber}: Discovery Day Session Registration Received`;
  await send({
    to,
    subject,
    html: templates.simple({
      title: 'Discovery Day Session Registration Received',
      description: (
        <div>
          <p>
            You have been registered to attend the Discovery Day session for <templates.Link url={templates.makeUrl(`requests-for-information/${rfi._id}/view`)} text={`${latestVersion.rfiNumber}: ${latestVersion.title}`} /> {remote ? 'remotely' : 'in-person'}.
          </p>
          <p>
            You can access your registration by clicking on the button below. Any changes to your registration, including whether you are attending the session in-person or remotely, can be submitted prior to its start date.
          </p>
        </div>
      ),
      descriptionLists: [makeDiscoveryDaySessionInformation(discoveryDay, !remote, remote)],
      callToAction: makeViewDdrRegistrationCta(rfi._id)
    })
  });
}

export async function createDdrToAttendees({ rfi, vendor, attendees }: DiscoveryDayToAttendeesProps): Promise<void> {
  const latestVersion = RfiSchema.getLatestVersion(rfi);
  const discoveryDay = latestVersion && latestVersion.discoveryDay;
  if (!latestVersion || !discoveryDay || vendor.profile.type !== UserType.Vendor) { return; }
  const subject = `${latestVersion.rfiNumber}: Discovery Day Session Registration`;
  for await (const attendee of attendees) {
    await send({
      to: attendee.email,
      subject,
      html: templates.simple({
        title: 'Discovery Day Session Registration',
        description: (
          <div>
            <p>
              You have been registered to attend the Discovery Day session for <templates.Link url={templates.makeUrl(`requests-for-information/${rfi._id}/view`)} text={`${latestVersion.rfiNumber}: ${latestVersion.title}`} /> {attendee.remote ? 'remotely' : 'in-person'}.
            </p>
            {vendor.email === attendee.email
              ? null
              : (<p>Please contact {vendor.profile.contactName} at <templates.Link url={`mailto:${vendor.email}`} text={vendor.email} /> if you require changes to be made to your registration.</p>)}
          </div>
        ),
        descriptionLists: [makeDiscoveryDaySessionInformation(discoveryDay, !attendee.remote, attendee.remote)]
      })
    });
  }
}

export async function createDdrToProgramStaff({ rfi, vendor }: DiscoveryDayToProgramStaffProps): Promise<void> {
  const latestVersion = RfiSchema.getLatestVersion(rfi);
  if (!latestVersion) { return; }
  const vendorName = profileToName(vendor.profile) || 'Unknown Vendor';
  const subject = `${latestVersion.rfiNumber}: ${vendorName} — Discovery Day Session Registration Received`;
  await send({
    to: CONTACT_EMAIL,
    subject,
    html: templates.simple({
      title: 'Discovery Day Session Registration Received',
      description: (
        <span>
          <templates.Link url={templates.makeUrl(`users/${vendor._id}`)} text={vendorName} /> has submitted their registration for the Discovery Day session for <templates.Link url={templates.makeUrl(`requests-for-information/${rfi._id}/edit`)} text={`${latestVersion.rfiNumber}: ${latestVersion.title}`} />.
        </span>
      ),
      callToAction: makeViewDdrRegistrationsCta(rfi._id)
    })
  });
}

export async function updateDdrToVendorByVendor({ rfi, to }: DiscoveryDayToVendorProps): Promise<void> {
  const latestVersion = RfiSchema.getLatestVersion(rfi);
  const discoveryDay = latestVersion && latestVersion.discoveryDay;
  if (!latestVersion || !discoveryDay) { return; }
  const subject = `${latestVersion.rfiNumber}: Discovery Day Session Registration Updated`;
  await send({
    to,
    subject,
    html: templates.simple({
      title: 'Update to Discovery Day Session Registration Received',
      description: (
        <div>
          Your registration for the Discovery Day session for <templates.Link url={templates.makeUrl(`requests-for-information/${rfi._id}/view`)} text={`${latestVersion.rfiNumber}: ${latestVersion.title}`} /> has been updated. Attendees will receive an email confirmation to notify them of any changes that impact their attendance.
        </div>
      ),
      callToAction: makeViewDdrRegistrationCta(rfi._id)
    })
  });
}

export async function updateDdrToVendorSoloByVendor({ rfi, to, remote }: DiscoveryDayToVendorSoloProps): Promise<void> {
  const latestVersion = RfiSchema.getLatestVersion(rfi);
  const discoveryDay = latestVersion && latestVersion.discoveryDay;
  if (!latestVersion || !discoveryDay) { return; }
  const subject = `${latestVersion.rfiNumber}: Discovery Day Session Registration Updated`;
  await send({
    to,
    subject,
    html: templates.simple({
      title: 'Update to Discovery Day Session Registration Received',
      description: (
        <div>
          Your registration for the Discovery Day session for <templates.Link url={templates.makeUrl(`requests-for-information/${rfi._id}/view`)} text={`${latestVersion.rfiNumber}: ${latestVersion.title}`} /> has been updated. You have been registered to attend this session {remote ? 'remotely' : 'in-person'}.
        </div>
      ),
      descriptionLists: [makeDiscoveryDaySessionInformation(discoveryDay, !remote, remote)],
      callToAction: makeViewDdrRegistrationCta(rfi._id)
    })
  });
}

export async function updateDdrToProgramStaffByVendor({ rfi, vendor }: DiscoveryDayToProgramStaffProps): Promise<void> {
  const latestVersion = RfiSchema.getLatestVersion(rfi);
  if (!latestVersion) { return; }
  const vendorName = profileToName(vendor.profile) || 'Unknown Vendor';
  const subject = `${latestVersion.rfiNumber}: ${vendorName} — Discovery Day Session Registration Updated`;
  await send({
    to: CONTACT_EMAIL,
    subject,
    html: templates.simple({
      title: 'Update to Discovery Day Session Registration Received',
      description: (
        <span>
          <templates.Link url={templates.makeUrl(`users/${vendor._id}`)} text={vendorName} /> has updated their registration for the Discovery Day session for <templates.Link url={templates.makeUrl(`requests-for-information/${rfi._id}/edit`)} text={`${latestVersion.rfiNumber}: ${latestVersion.title}`} />.
        </span>
      ),
      callToAction: makeViewDdrRegistrationsCta(rfi._id)
    })
  });
}

export async function updateDdrToVendorByProgramStaff({ rfi, to }: DiscoveryDayToVendorProps): Promise<void> {
  const latestVersion = RfiSchema.getLatestVersion(rfi);
  const discoveryDay = latestVersion && latestVersion.discoveryDay;
  if (!latestVersion || !discoveryDay) { return; }
  const subject = `${latestVersion.rfiNumber}: Discovery Day Session Registration Updated`;
  await send({
    to,
    subject,
    html: templates.simple({
      title: 'Update to Discovery Day Session Registration',
      description: (
        <div>
          <p>
            Your registration for the Discovery Day session for <templates.Link url={templates.makeUrl(`requests-for-information/${rfi._id}/view`)} text={`${latestVersion.rfiNumber}: ${latestVersion.title}`} /> has been updated by the Procurement Concierge Program's staff. Attendees will receive an email confirmation to notify them of any changes that impact their attendance.
          </p>
          <p>
            You can view the changes that were made to your registration by clicking on the button below. If these changes impact an attendee's ability to attend the session, please update your registration accordingly.
          </p>
          <p>
            Please contact the Procurement Concierge Program's staff at <templates.Link url={`mailto:${CONTACT_EMAIL}`} text={CONTACT_EMAIL} /> if you have any questions.
          </p>
        </div>
      ),
      callToAction: makeViewDdrRegistrationCta(rfi._id)
    })
  });
}

export async function updateDdrToVendorSoloByProgramStaff({ rfi, to, remote }: DiscoveryDayToVendorSoloProps): Promise<void> {
  const latestVersion = RfiSchema.getLatestVersion(rfi);
  const discoveryDay = latestVersion && latestVersion.discoveryDay;
  if (!latestVersion || !discoveryDay) { return; }
  const subject = `${latestVersion.rfiNumber}: Discovery Day Session Registration Updated`;
  await send({
    to,
    subject,
    html: templates.simple({
      title: 'Update to Discovery Day Session Registration',
      description: (
        <div>
          <p>
            Your registration for the Discovery Day session for <templates.Link url={templates.makeUrl(`requests-for-information/${rfi._id}/view`)} text={`${latestVersion.rfiNumber}: ${latestVersion.title}`} /> has been updated by the Procurement Concierge Program's staff. You have been registered to attend this session {remote ? 'remotely' : 'in-person'}.
          </p>
          <p>
            You can view the changes that were made to your registration by clicking on the button below. If these changes impact your ability to attend the session, please update your registration accordingly.
          </p>
          <p>
            Please contact the Procurement Concierge Program's staff at <templates.Link url={`mailto:${CONTACT_EMAIL}`} text={CONTACT_EMAIL} /> if you have any questions.
          </p>
        </div>
      ),
      descriptionLists: [makeDiscoveryDaySessionInformation(discoveryDay, !remote, remote)],
      callToAction: makeViewDdrRegistrationCta(rfi._id)
    })
  });
}

export async function updateDdrToAttendees({ rfi, vendor, attendees }: DiscoveryDayToAttendeesProps): Promise<void> {
  const latestVersion = RfiSchema.getLatestVersion(rfi);
  const discoveryDay = latestVersion && latestVersion.discoveryDay;
  if (!latestVersion || !discoveryDay || vendor.profile.type !== UserType.Vendor) { return; }
  const subject = `${latestVersion.rfiNumber}: Discovery Day Session Registration Updated`;
  for await (const attendee of attendees) {
    await send({
      to: attendee.email,
      subject,
      html: templates.simple({
        title: 'Discovery Day Session Registration Updated',
        description: (
          <div>
            <p>
              Your registration for the Discovery Day session for <templates.Link url={templates.makeUrl(`requests-for-information/${rfi._id}/view`)} text={`${latestVersion.rfiNumber}: ${latestVersion.title}`} /> has been updated. You have been registered to attend this session {attendee.remote ? 'remotely' : 'in-person'}.
            </p>
            {vendor.email === attendee.email
              ? null
              : (<p>Please contact {vendor.profile.contactName} at <templates.Link url={`mailto:${vendor.email}`} text={vendor.email} /> if you have any questions.</p>)}
          </div>
        ),
        descriptionLists: [makeDiscoveryDaySessionInformation(discoveryDay, !attendee.remote, attendee.remote)]
      })
    });
  }
}

export async function deleteDdrToVendorByVendor({ rfi, to }: DiscoveryDayToVendorProps): Promise<void> {
  const latestVersion = RfiSchema.getLatestVersion(rfi);
  const discoveryDay = latestVersion && latestVersion.discoveryDay;
  if (!latestVersion || !discoveryDay) { return; }
  const subject = `${latestVersion.rfiNumber}: Discovery Day Session Registration Cancelled`;
  await send({
    to,
    subject,
    html: templates.simple({
      title: 'Discovery Day Session Registration Cancelled',
      description: (
        <div>
          Your registration for the Discovery Day session for <templates.Link url={templates.makeUrl(`requests-for-information/${rfi._id}/view`)} text={`${latestVersion.rfiNumber}: ${latestVersion.title}`} /> has been cancelled. All attendees will receive an email confirmation to notify them of the cancellation.
        </div>
      )
    })
  });
}

export async function deleteDdrToVendorSoloByVendor({ rfi, to }: Omit<DiscoveryDayToVendorSoloProps, 'remote'>): Promise<void> {
  const latestVersion = RfiSchema.getLatestVersion(rfi);
  const discoveryDay = latestVersion && latestVersion.discoveryDay;
  if (!latestVersion || !discoveryDay) { return; }
  const subject = `${latestVersion.rfiNumber}: Discovery Day Session Registration Cancelled`;
  await send({
    to,
    subject,
    html: templates.simple({
      title: 'Discovery Day Session Registration Cancelled',
      description: (
        <div>
          Your registration for the Discovery Day session for <templates.Link url={templates.makeUrl(`requests-for-information/${rfi._id}/view`)} text={`${latestVersion.rfiNumber}: ${latestVersion.title}`} /> has been cancelled.
        </div>
      )
    })
  });
}

export async function deleteDdrToProgramStaffByVendor({ rfi, vendor }: DiscoveryDayToProgramStaffProps): Promise<void> {
  const latestVersion = RfiSchema.getLatestVersion(rfi);
  if (!latestVersion) { return; }
  const vendorName = profileToName(vendor.profile) || 'Unknown Vendor';
  const subject = `${latestVersion.rfiNumber}: ${vendorName} — Discovery Day Session Registration Cancelled`;
  await send({
    to: CONTACT_EMAIL,
    subject,
    html: templates.simple({
      title: 'Discovery Day Session Registration Cancelled',
      description: (
        <span>
          <templates.Link url={templates.makeUrl(`users/${vendor._id}`)} text={vendorName} /> has cancelled their registration for the Discovery Day session for <templates.Link url={templates.makeUrl(`requests-for-information/${rfi._id}/edit`)} text={`${latestVersion.rfiNumber}: ${latestVersion.title}`} />.
        </span>
      ),
      callToAction: makeViewDdrRegistrationsCta(rfi._id)
    })
  });
}

export async function deleteDdrToVendorByProgramStaff({ rfi, to }: DiscoveryDayToVendorProps): Promise<void> {
  const latestVersion = RfiSchema.getLatestVersion(rfi);
  const discoveryDay = latestVersion && latestVersion.discoveryDay;
  if (!latestVersion || !discoveryDay) { return; }
  const subject = `${latestVersion.rfiNumber}: Discovery Day Session Registration Cancelled`;
  await send({
    to,
    subject,
    html: templates.simple({
      title: 'Discovery Day Session Registration Cancelled',
      description: (
        <div>
          <p>
            Your registration for the Discovery Day session for <templates.Link url={templates.makeUrl(`requests-for-information/${rfi._id}/view`)} text={`${latestVersion.rfiNumber}: ${latestVersion.title}`} /> has been cancelled by the Procurement Concierge Program's staff. All attendees will receive an email confirmation to notify them of the cancellation.
          </p>
          <p>
            Please contact the Procurement Concierge Program's staff at <templates.Link url={`mailto:${CONTACT_EMAIL}`} text={CONTACT_EMAIL} /> if you have any questions.
          </p>
        </div>
      )
    })
  });
}

export async function deleteDdrToVendorSoloByProgramStaff({ rfi, to }: Omit<DiscoveryDayToVendorSoloProps, 'remote'>): Promise<void> {
  const latestVersion = RfiSchema.getLatestVersion(rfi);
  const discoveryDay = latestVersion && latestVersion.discoveryDay;
  if (!latestVersion || !discoveryDay) { return; }
  const subject = `${latestVersion.rfiNumber}: Discovery Day Session Registration Cancelled`;
  await send({
    to,
    subject,
    html: templates.simple({
      title: 'Discovery Day Session Registration Cancelled',
      description: (
        <div>
          <p>
            Your registration for the Discovery Day session for <templates.Link url={templates.makeUrl(`requests-for-information/${rfi._id}/view`)} text={`${latestVersion.rfiNumber}: ${latestVersion.title}`} /> has been cancelled by the Procurement Concierge Program's staff.
          </p>
          <p>
            Please contact the Procurement Concierge Program's staff at <templates.Link url={`mailto:${CONTACT_EMAIL}`} text={CONTACT_EMAIL} /> if you have any questions.
          </p>
        </div>
      )
    })
  });
}

export async function deleteDdrToAttendees({ rfi, vendor, attendees }: DiscoveryDayToAttendeesProps): Promise<void> {
  const latestVersion = RfiSchema.getLatestVersion(rfi);
  const discoveryDay = latestVersion && latestVersion.discoveryDay;
  if (!latestVersion || !discoveryDay || vendor.profile.type !== UserType.Vendor) { return; }
  const subject = `${latestVersion.rfiNumber}: Removed from Discovery Day Session Registration`;
  for await (const attendee of attendees) {
    await send({
      to: attendee.email,
      subject,
      html: templates.simple({
        title: 'Removed from Discovery Day Session Registration',
        description: (
          <div>
            <p>
              You have been removed from your company's registration for the Discovery Day session for <templates.Link url={templates.makeUrl(`requests-for-information/${rfi._id}/view`)} text={`${latestVersion.rfiNumber}: ${latestVersion.title}`} />.
            </p>
            {vendor.email === attendee.email
              ? null
              : (<p>Please contact {vendor.profile.contactName} at <templates.Link url={`mailto:${vendor.email}`} text={vendor.email} /> if you have any questions.</p>)}
          </div>
        )
      })
    });
  }
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
