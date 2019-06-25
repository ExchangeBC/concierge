import { makeDomainLogger } from 'back-end/lib/logger';
import { console as consoleAdapter } from 'back-end/lib/logger/adapters';
import { MigrationHook } from 'migrate';
import { connect } from 'migrations/db';
import path from 'path';

const logger = makeDomainLogger(consoleAdapter, `migrations:${path.basename(__filename)}`);

const INCORRECT_CATEGORY = 'Agriculture and Aquaculture Machinery, Equiment and Supplies';
const CORRECT_CATEGORY = 'Agriculture and Aquaculture Machinery, Equipment and Supplies';

export const description = `Fix typo: "${INCORRECT_CATEGORY}" -> "${CORRECT_CATEGORY}"`;

export const up: MigrationHook = async () => {
  const { db } = await connect();
  const users = db.collection('users');
  const docs = await users
    .find({ 'profile.categories': { $elemMatch: { $eq: INCORRECT_CATEGORY }}});
  logger.info('Users', { count: await docs.count() });
  for await (const doc of docs) {
    doc.profile.categories = (doc.profile.categories || []).map((c: string) => {
      if (c === INCORRECT_CATEGORY) {
        return CORRECT_CATEGORY;
      } else {
        return c;
      }
    });
    logger.info('persisting updated user...', { _id: doc._id, userType: doc.profile.type });
    await users.replaceOne({ _id: doc._id }, doc);
    logger.info('...persisted updated user', { _id: doc._id, userType: doc.profile.type });
  }
};

export const down: MigrationHook = async () => {
  logger.warn('no down logic for this migration');
};
