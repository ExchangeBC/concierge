import { makeDomainLogger } from 'back-end/lib/logger';
import { console as consoleAdapter } from 'back-end/lib/logger/adapters';
import { MigrationHook } from 'migrate';
import { connect } from 'migrations/db';
import path from 'path';

const logger = makeDomainLogger(consoleAdapter, `migrations:${path.basename(__filename)}`);

const DEFAULT_GRACE_PERIOD_DAYS = 2;

export const description = `Add the gracePeriodDays property to RFI versions. The default value is ${DEFAULT_GRACE_PERIOD_DAYS} days.`;

export const up: MigrationHook = async () => {
  const { db } = await connect();
  const rfis = db.collection('rfis');
  const docs = await rfis
    // Find RFIs that have versions
    .find({
      versions: {
        $elemMatch: {
          gracePeriodDays: {
            $exists: false
          }
        }
      }
    });
  logger.info('RFIs without gracePeriodDays', { count: await docs.count() });
  for await (const doc of docs) {
    for (const version of doc.versions) {
      if (version.gracePeriodDays === undefined) {
        logger.info('modifying version', { rfiId: doc._id, versionCreatedAt: version.createdAt });
        version.gracePeriodDays = DEFAULT_GRACE_PERIOD_DAYS;
      }
    }
    logger.info('persisting updated RFI...', { rfiId: doc._id });
    await rfis.replaceOne({ _id: doc._id }, doc);
    logger.info('...persisted updated RFI', { rfiId: doc._id });
  }
};

export const down: MigrationHook = async () => {
  const { db } = await connect();
  const rfis = db.collection('rfis');
  const docs = await rfis
    // Find RFIs that have versions
    .find({
      versions: {
        $elemMatch: {
          gracePeriodDays: {
            $exists: true
          }
        }
      }
    });
  logger.info('RFIs with gracePeriodDays', { count: await docs.count() });
  for await (const doc of docs) {
    for (const version of doc.versions) {
      if (version.gracePeriodDays !== undefined) {
        logger.info('modifying version', { rfiId: doc._id, versionCreatedAt: version.createdAt });
        delete version.gracePeriodDays;
      }
    }
    logger.info('persisting updated RFI...', { rfiId: doc._id });
    await rfis.replaceOne({ _id: doc._id }, doc);
    logger.info('...persisted updated RFI', { rfiId: doc._id });
  }
};
