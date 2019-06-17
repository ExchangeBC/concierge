import { makeDomainLogger } from 'back-end/lib/logger';
import { console as consoleAdapter } from 'back-end/lib/logger/adapters';
import { MigrationHook } from 'migrate';
import { connect } from 'migrations/db';
import path from 'path';

const logger = makeDomainLogger(consoleAdapter, `migrations:${path.basename(__filename)}`);

const USER_TYPE_BUYER = 'BUYER';
const VERIFICATION_STATUS_UNVERIFIED = 'UNVERIFIED';

export const description = `Add the verificationStatus property to ${USER_TYPE_BUYER} profiles and set it to ${VERIFICATION_STATUS_UNVERIFIED}.`;

export const up: MigrationHook = async () => {
  const { db } = await connect();
  const users = db.collection('users');
  const buyers = await users
    .find({
      $and: [
        { 'profile.type': USER_TYPE_BUYER },
        { $or: [
          { 'profile.verificationStatus': { $exists: false }},
          { 'profile.verificationStatus': { $eq: null }},
          { 'profile.verificationStatus': { $eq: '' }}
        ]}
      ]
    });
  logger.info('Buyers', { count: await buyers.count() });
  for await (const doc of buyers) {
    if (doc.profile.type !== USER_TYPE_BUYER) {
      logger.warn('ignoring non-buyer user', { _id: doc._id, userType: doc.profile.type });
    }
    doc.profile.verificationStatus = doc.profile.verificationStatus || VERIFICATION_STATUS_UNVERIFIED;
    logger.info('persisting updated user...', { _id: doc._id, userType: doc.profile.type });
    await users.replaceOne({ _id: doc._id }, doc);
    logger.info('...persisted updated user', { _id: doc._id, userType: doc.profile.type });
  }
};

export const down: MigrationHook = async () => {
  logger.warn('down migration not required when the up migration is adding a new field');
};
