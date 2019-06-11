import { makeDomainLogger } from 'back-end/lib/logger';
import { console as consoleAdapter } from 'back-end/lib/logger/adapters';
import { MigrationHook } from 'migrate';
import { connect } from 'migrations/db';
import path from 'path';

const logger = makeDomainLogger(consoleAdapter, `migrations:${path.basename(__filename)}`);

const USER_TYPE_VENDOR = 'VENDOR';
const DEFAULT_CONTACT_NAME = 'Unknown';

export const description = `Set Vendor contact names to ${DEFAULT_CONTACT_NAME} if they haven't set one already.`;

export const up: MigrationHook = async () => {
  const { db } = await connect();
  const users = db.collection('users');
  const vendors = await users
    .find({
      $and: [
        { 'profile.type': USER_TYPE_VENDOR },
        {
          $or: [
            { 'profile.contactName': { $exists: false }},
            { 'profile.contactName': { $eq: '' }},
            { 'profile.contactName': { $eq: null }}
          ]
        }
      ]
    });
  logger.info('Vendors', { count: await vendors.count() });
  for await (const doc of vendors) {
    if (doc.profile.type !== USER_TYPE_VENDOR) {
      logger.warn('ignoring non-vendor user', { _id: doc._id, userType: doc.profile.type });
    }
    doc.profile.contactName = DEFAULT_CONTACT_NAME;
    logger.info('persisting updated user...', { _id: doc._id, userType: doc.profile.type });
    await users.replaceOne({ _id: doc._id }, doc);
    logger.info('...persisted updated user', { _id: doc._id, userType: doc.profile.type });
  }
};

export const down: MigrationHook = async () => {
  const { db } = await connect();
  const users = db.collection('users');
  const vendors = await users
    .find({
      $and: [
        { 'profile.type': USER_TYPE_VENDOR },
        { 'profile.contactName': DEFAULT_CONTACT_NAME }
      ]
    });
  logger.info('Vendors', { count: await vendors.count() });
  for await (const doc of vendors) {
    if (doc.profile.type !== USER_TYPE_VENDOR) {
      logger.warn('ignoring non-vendor user', { _id: doc._id, userType: doc.profile.type });
    }
    doc.profile.contactName = '';
    logger.info('persisting updated user...', { _id: doc._id, userType: doc.profile.type });
    await users.replaceOne({ _id: doc._id }, doc);
    logger.info('...persisted updated user', { _id: doc._id, userType: doc.profile.type });
  }
};
