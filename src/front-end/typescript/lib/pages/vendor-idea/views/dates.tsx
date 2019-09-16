import { View } from 'front-end/lib/framework';
import Link from 'front-end/lib/views/link';
import React from 'react';
import { formatDateAndTime } from 'shared/lib';
import { PublicUser } from 'shared/lib/resources/user';
import { profileToName } from 'shared/lib/types';

export const SubmittedDate: View<{ date: Date, vendor?: PublicUser, className?: string }> = ({ date, vendor, className }) => {
  return (
    <span className={className} >
      {vendor
        ? (<span>
            Submitted by <Link newTab route={{ tag: 'userView', value: { profileUserId: vendor._id }}}>{profileToName(vendor.profile)}</Link> on
          </span>)
        : 'Submitted:'}&nbsp;
      {formatDateAndTime(date, true)}
    </span>
  );
}

export const UpdatedDate: View<{ date: Date, className?: string }> = ({ date, className }) => {
  return (<span className={className} >Last Updated: {formatDateAndTime(date, true)}</span>);
}
