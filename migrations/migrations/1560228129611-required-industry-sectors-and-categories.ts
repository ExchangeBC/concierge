import { makeDomainLogger } from 'back-end/lib/logger';
import { console as consoleAdapter } from 'back-end/lib/logger/adapters';
import { MigrationHook } from 'migrate';
import { connect } from 'migrations/db';
import path from 'path';

const logger = makeDomainLogger(consoleAdapter, `migrations:${path.basename(__filename)}`);

const USER_TYPE_VENDOR = 'VENDOR';
const USER_TYPE_BUYER = 'BUYER';
const DEFAULT_INDUSTRY_SECTORS = ['Other'];
const DEFAULT_CATEGORIES = ['Other'];

export const description = 'Enter a concise, meaningful migration description here.';

export const up: MigrationHook = async () => {
  const { db } = await connect();
  const users = db.collection('users');
  const vendorsAndBuyers = await users
    .find({
      $and: [
        {
          $or: [
            { 'profile.type': USER_TYPE_VENDOR },
            { 'profile.type': USER_TYPE_BUYER }
          ]
        },
        {
          $or: [
            { 'profile.categories': { $exists: false }},
            { 'profile.categories': { $size: 0 }},
            { 'profile.industrySectors': { $exists: false }},
            { 'profile.industrySectors': { $size: 0 }}
          ]
        }
      ]
    });
  logger.info('Buyers and Vendors', { count: await vendorsAndBuyers.count() });
  for await (const doc of vendorsAndBuyers) {
    if (doc.profile.type !== USER_TYPE_VENDOR && doc.profile.type !== USER_TYPE_BUYER) {
      logger.warn('ignoring non-vendor/non-buyer user', { _id: doc._id, userType: doc.profile.type });
    }
    doc.profile.industrySectors = doc.profile.industrySectors && doc.profile.industrySectors.length ? doc.profile.industrySectors : DEFAULT_INDUSTRY_SECTORS;
    doc.profile.categories = doc.profile.categories && doc.profile.categories.length ? doc.profile.categories : DEFAULT_CATEGORIES;
    logger.info('persisting updated user...', { _id: doc._id, userType: doc.profile.type });
    await users.replaceOne({ _id: doc._id }, doc);
    logger.info('...persisted updated user', { _id: doc._id, userType: doc.profile.type });
  }
};

export const down: MigrationHook = async () => {
  const { db } = await connect();
  const users = db.collection('users');
  const vendorsAndBuyers = await users
    .find({
      $and: [
        {
          $or: [
            { 'profile.type': USER_TYPE_VENDOR },
            { 'profile.type': USER_TYPE_BUYER }
          ]
        },
        {
          $or: [
            { 'profile.categories': { $elemMatch: { $eq: 'Other' }}},
            { 'profile.industrySectors': { $elemMatch: { $eq: 'Other' }}}
          ]
        }
      ]
    });
  logger.info('Buyers and Vendors', { count: await vendorsAndBuyers.count() });
  for await (const doc of vendorsAndBuyers) {
    if (doc.profile.type !== USER_TYPE_VENDOR && doc.profile.type !== USER_TYPE_BUYER) {
      logger.warn('ignoring non-vendor/non-buyer user', { _id: doc._id, userType: doc.profile.type });
    }
    doc.profile.industrySectors = doc.profile.industrySectors && doc.profile.industrySectors.filter((v: string) => DEFAULT_INDUSTRY_SECTORS.indexOf(v) === -1);
    doc.profile.categories = doc.profile.categories && doc.profile.categories.filter((v: string) => DEFAULT_CATEGORIES.indexOf(v) === -1);
    logger.info('persisting updated user...', { _id: doc._id, userType: doc.profile.type });
    await users.replaceOne({ _id: doc._id }, doc);
    logger.info('...persisted updated user', { _id: doc._id, userType: doc.profile.type });
  }
};
