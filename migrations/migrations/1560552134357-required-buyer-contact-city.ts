import { makeDomainLogger } from 'back-end/lib/logger';
import { console as consoleAdapter } from 'back-end/lib/logger/adapters';
import { MigrationHook } from 'migrate';
import { connect } from 'migrations/db';
import path from 'path';

const logger = makeDomainLogger(consoleAdapter, `migrations:${path.basename(__filename)}`);

const USER_TYPE_BUYER = 'BUYER';
const DEFAULT_CONTACT_CITY = 'Unknown';

export const description = `Set Buyer contact cities to ${DEFAULT_CONTACT_CITY} if they haven't set one already.`;

export const up: MigrationHook = async () => {
  const { db } = await connect();
  const users = db.collection('users');
  const buyers = await users
    .find({
      $and: [
        { 'profile.type': USER_TYPE_BUYER },
        {
          $or: [
            { 'profile.contactCity': { $exists: false }},
            { 'profile.contactCity': { $eq: '' }},
            { 'profile.contactCity': { $eq: null }}
          ]
        }
      ]
    });
  logger.info('Buyers', { count: await buyers.count() });
  for await (const doc of buyers) {
    if (doc.profile.type !== USER_TYPE_BUYER) {
      logger.warn('ignoring non-buyer user', { _id: doc._id, userType: doc.profile.type });
    }
    doc.profile.contactCity = DEFAULT_CONTACT_CITY;
    logger.info('persisting updated user...', { _id: doc._id, userType: doc.profile.type });
    await users.replaceOne({ _id: doc._id }, doc);
    logger.info('...persisted updated user', { _id: doc._id, userType: doc.profile.type });
  }
};

export const down: MigrationHook = async () => {
  const { db } = await connect();
  const users = db.collection('users');
  const buyers = await users
    .find({
      $and: [
        { 'profile.type': USER_TYPE_BUYER },
        { 'profile.contactCity': DEFAULT_CONTACT_CITY }
      ]
    });
  logger.info('Buyers', { count: await buyers.count() });
  for await (const doc of buyers) {
    if (doc.profile.type !== USER_TYPE_BUYER) {
      logger.warn('ignoring non-buyer user', { _id: doc._id, userType: doc.profile.type });
    }
    doc.profile.contactCity = '';
    logger.info('persisting updated user...', { _id: doc._id, userType: doc.profile.type });
    await users.replaceOne({ _id: doc._id }, doc);
    logger.info('...persisted updated user', { _id: doc._id, userType: doc.profile.type });
  }
};
