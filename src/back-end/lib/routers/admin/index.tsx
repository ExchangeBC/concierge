import * as mailer from 'back-end/lib/mailer';
import { styles, View } from 'back-end/lib/mailer/templates';
import * as permissions from 'back-end/lib/permissions';
import * as mocks from 'back-end/lib/routers/admin/mocks';
import { HtmlResponseBody, makeHtmlResponseBody, Response, Router } from 'back-end/lib/server';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { HttpMethod, UserType, VerificationStatus } from 'shared/lib/types';

const Notification: View<{ email: mailer.Email }> = ({ email }) => {
  return (
    <div>
      {email.summary
        ? (<div style={{ ...styles.utilities.font.bold, ...styles.utilities.font.sm, ...styles.utilities.mb[2], color: 'grey' }}>Summary: {email.summary}</div>)
        : null}
        <div style={{ ...styles.utilities.font.bold, ...styles.utilities.font.sm, ...styles.utilities.mb[3], color: 'grey' }}>Subject: {email.subject}</div>
      <div style={{ ...styles.utilities.borderRadius, ...styles.utilities.mb[4], border: '1px solid silver' }} dangerouslySetInnerHTML={{ __html: email.html }}></div>
    </div>
  );
};

interface NotificationGroupProps {
  title: string;
  emails: mailer.Emails;
}

const NotificationGroup: View<NotificationGroupProps> = ({ title, emails }) => {
  return (
    <div style={{ ...styles.utilities.pl[4], ...styles.utilities.pr[4] }}>
      <h2 style={{ ...styles.utilities.m[0], ...styles.utilities.mb[4] }}>{title}</h2>
      {emails.map((e, i) => (
        <Notification key={`notification-group-notification-${i}`} email={e} />
      ))}
    </div>
  );
};

async function makeEmailNotificationReference(): Promise<View<{}>> {
  const notifications: NotificationGroupProps[] = [
    { title: 'Create User', emails: await mailer.createUserT(mocks.email) },
    {
      title: 'Deactivate User',
      emails: [
        ...(await mailer.deactivateUserT(mocks.email, UserType.Vendor)),
        ...(await mailer.deactivateUserT(mocks.email, UserType.Buyer)),
        ...(await mailer.deactivateUserT(mocks.email, UserType.ProgramStaff))
      ]
    },
    { title: 'Reactivate User', emails: await mailer.reactivateUserT(mocks.email) },
    { title: 'Reset User Password', emails: await mailer.createForgotPasswordTokenT(mocks.email, 'TOKEN', mocks.id) },
    {
      title: 'Public Sector Buyer Verfication Status Updated by Program Staff to Buyers',
      emails: [
        ...(await mailer.buyerStatusUpdatedT(mocks.email, VerificationStatus.Verified)),
        ...(await mailer.buyerStatusUpdatedT(mocks.email, VerificationStatus.UnderReview)),
        ...(await mailer.buyerStatusUpdatedT(mocks.email, VerificationStatus.Unverified))
      ]
    },
    {
      title: 'RFI Response Submitted by Vendors for Program Staff',
      emails: await mailer.rfiResponseReceivedToProgramStaffT({
        rfiResponse: mocks.publicRfiResponse,
        rfi: mocks.rfi
      })
    },
    {
      title: 'RFI Response Submitted by Vendors for Vendors',
      emails: await mailer.rfiResponseReceivedToVendorT({
        to: mocks.email,
        rfi: mocks.rfi
      })
    },
    {
      title: 'Discovery Day Updated by Program Staff for Multi Vendors',
      emails: await mailer.updateDiscoveryDayToVendorT({
        to: mocks.email,
        rfi: mocks.rfi
      })
    },
    {
      title: 'Discovery Day Updated by Program Staff for Multi Vendors\' Attendees',
      emails: await mailer.updateDiscoveryDayToAttendeesT({
        vendor: mocks.publicVendor,
        rfi: mocks.rfi,
        attendees: [
          mocks.attendee(true),
          mocks.attendee(false)
        ]
      })
    },
    {
      title: 'Discovery Day Updated by Program Staff for Solo Vendors',
      emails: [
        ...(await mailer.updateDiscoveryDayToVendorSoloT({
          to: mocks.email,
          rfi: mocks.rfi,
          remote: true
        })),
        ...(await mailer.updateDiscoveryDayToVendorSoloT({
          to: mocks.email,
          rfi: mocks.rfi,
          remote: false
        }))
      ]
    },
    {
      title: 'Discovery Day Cancelled by Program Staff for Multi and Solo Vendors',
      emails: await mailer.deleteDiscoveryDayToVendorT({
        to: mocks.email,
        rfi: mocks.rfi
      })
    },
    {
      title: 'Discovery Day Cancelled by Program Staff for Multi Vendors\' Attendees',
      emails: await mailer.deleteDiscoveryDayToAttendeesT({
        vendor: mocks.publicVendor,
        rfi: mocks.rfi,
        attendees: [
          mocks.attendee(true),
          mocks.attendee(false)
        ]
      })
    },
    {
      title: 'Discovery Day Registration Received for Submitting Multi Vendors',
      emails: await mailer.createDdrToVendorT({
        to: mocks.email,
        rfi: mocks.rfi
      })
    },
    {
      title: 'Discovery Day Registration Received for Submitting Multi Vendors\' Attendees',
      emails: await mailer.createDdrToAttendeesT({
        vendor: mocks.publicVendor,
        rfi: mocks.rfi,
        attendees: [
          mocks.attendee(true),
          mocks.attendee(false)
        ]
      })
    },
    {
      title: 'Discovery Day Registration Received for Solo Vendors',
      emails: [
        ...(await mailer.createDdrToVendorSoloT({
          to: mocks.email,
          rfi: mocks.rfi,
          remote: true
        })),
        ...(await mailer.createDdrToVendorSoloT({
          to: mocks.email,
          rfi: mocks.rfi,
          remote: false
        }))
      ]
    },
    {
      title: 'Discovery Day Registration Received for Program Staff',
      emails: await mailer.createDdrToProgramStaffT({
        vendor: mocks.publicVendor,
        rfi: mocks.rfi
      })
    },
    {
      title: 'Discovery Day Registration Updated by Multi Vendors for Multi Vendors',
      emails: await mailer.updateDdrToVendorByVendorT({
        to: mocks.email,
        rfi: mocks.rfi
      })
    },
    {
      title: 'Discovery Day Registration Updated by Solo Vendors for Solo Vendors',
      emails: [
        ...(await mailer.updateDdrToVendorSoloByVendorT({
          to: mocks.email,
          rfi: mocks.rfi,
          remote: true
        })),
        ...(await mailer.updateDdrToVendorSoloByVendorT({
          to: mocks.email,
          rfi: mocks.rfi,
          remote: false
        }))
      ]
    },
    {
      title: 'Discovery Day Registration Updated by Multi and Solo Vendors for Program Staff',
      emails: await mailer.updateDdrToProgramStaffByVendorT({
        vendor: mocks.publicVendor,
        rfi: mocks.rfi
      })
    },
    {
      title: 'Discovery Day Registration Updated by Program Staff for Multi Vendors',
      emails: await mailer.updateDdrToVendorByProgramStaffT({
        to: mocks.email,
        rfi: mocks.rfi
      })
    },
    {
      title: 'Discovery Day Registration Updated by Program Staff for Solo Vendors',
      emails: [
        ...(await mailer.updateDdrToVendorSoloByProgramStaffT({
          to: mocks.email,
          rfi: mocks.rfi,
          remote: true
        })),
        ...(await mailer.updateDdrToVendorSoloByProgramStaffT({
          to: mocks.email,
          rfi: mocks.rfi,
          remote: false
        }))
      ]
    },
    {
      title: 'Discovery Day Registration Updated by Multi Vendors or Program Staff for Multi Vendors\' Attendees',
      emails: await mailer.updateDdrToAttendeesT({
        vendor: mocks.publicVendor,
        rfi: mocks.rfi,
        attendees: [
          mocks.attendee(true),
          mocks.attendee(false)
        ]
      })
    },
    {
      title: 'Discovery Day Registration Cancelled by Multi Vendors for Multi Vendors',
      emails: await mailer.deleteDdrToVendorByVendorT({
        to: mocks.email,
        rfi: mocks.rfi
      })
    },
    {
      title: 'Discovery Day Registration Cancelled by Solo Vendors for Solo Vendors',
      emails: await mailer.deleteDdrToVendorSoloByVendorT({
        to: mocks.email,
        rfi: mocks.rfi
      })
    },
    {
      title: 'Discovery Day Registration Cancelled by Multi and Solo Vendors for Program Staff',
      emails: await mailer.deleteDdrToProgramStaffByVendorT({
        vendor: mocks.publicVendor,
        rfi: mocks.rfi
      })
    },
    {
      title: 'Discovery Day Registration Cancelled by Program Staff for Multi Vendors',
      emails: await mailer.deleteDdrToVendorByProgramStaffT({
        to: mocks.email,
        rfi: mocks.rfi
      })
    },
    {
      title: 'Discovery Day Registration Cancelled by Program Staff for Solo Vendors',
      emails: await mailer.deleteDdrToVendorSoloByProgramStaffT({
        to: mocks.email,
        rfi: mocks.rfi
      })
    },
    {
      title: 'Discovery Day Registration Cancelled by Multi Vendors or Program Staff for Multi Vendors\' Attendees',
      emails: await mailer.deleteDdrToAttendeesT({
        vendor: mocks.publicVendor,
        rfi: mocks.rfi,
        attendees: [
          mocks.attendee(true) // Remote property doesn't impact email notification
        ]
      })
    },
    {
      title: 'Feedback Received',
      emails: await mailer.createFeedbackT({
        feedbackEmail: mocks.email,
        feedbackResponse: mocks.publicFeedback
      })
    },
    {
      title: 'Unsolicited Proposal Made Eligible by Program Staff for Vendors',
      emails: await mailer.createViLogItemEligibleToVendorT({
        title: 'Unsolicited Proposal Title',
        id: mocks.id,
        to: mocks.email
      })
    },
    {
      title: 'Unsolicited Proposal Submitted by Vendors to Program Staff',
      emails: await mailer.createViToProgramStaffT({
        title: 'Unsolicited Proposal Title',
        createdAt: mocks.date,
        id: mocks.id,
        vendorName: 'Vendor Name'
      })
    },
    {
      title: 'Unsolicited Proposal Updated by Vendors to Program Staff',
      emails: await mailer.updateViToProgramStaffByVendorT({
        title: 'Unsolicited Proposal Title',
        editsReceivedAt: mocks.date,
        id: mocks.id,
        vendorName: 'Vendor Name'
      })
    }
  ];
  return () => {
    return (
      <html>
        <head>
          <meta charSet='utf8' />
          <title>Email Notification Reference: Procurement Concierge Program</title>
        </head>
        <body style={{ ...styles.utilities.p[5], maxWidth: styles.helpers.px(styles.helpers.scale(40)), margin: '0 auto' }}>
          <a href='/' style={{ display: 'block', ...styles.classes.link, ...styles.utilities.mb[4] }}>Go back to the Procurement Concierge web app</a>
          <h1 style={{ ...styles.utilities.m[0], ...styles.utilities.mb[5] }}>Email Notification Reference</h1>
          {notifications.map((g, i) => (
            <div key={`notification-group-${i}`}>
              <NotificationGroup {...g} />
              {i < notifications.length - 1
                ? (<div style={{ ...styles.utilities.mt[5], ...styles.utilities.mb[5], width: '100%', borderTop: '1px double grey' }}></div>)
                : null}
            </div>
          ))}
        </body>
      </html>
    );
  };
}

function makeRouter(): Router<any, HtmlResponseBody, any> {
  return [{
    method: HttpMethod.Get,
    path: '/email-notification-reference',
    handler: {
      async transformRequest(request) {
        return null;
      },
      async respond(request): Promise<Response<HtmlResponseBody, unknown>> {
        const respond = (code: number, body: string) => ({
          code,
          headers: {},
          session: request.session,
          body: makeHtmlResponseBody(body)
        });
        if (!request.session || !permissions.isProgramStaff(request.session)) { return respond(401, permissions.ERROR_MESSAGE); }
        const EmailNotificationReference = await makeEmailNotificationReference();
        return respond(200, renderToStaticMarkup(<EmailNotificationReference />));
      }
    }
  }];
}

export default makeRouter;
