import { makeDomainLogger } from 'back-end/lib/logger';
import { console as consoleAdapter } from 'back-end/lib/logger/adapters';
import { MigrationHook } from 'migrate';
import { connect } from 'migrations/db';
import path from 'path';

const logger = makeDomainLogger(consoleAdapter, `migrations:${path.basename(__filename)}`);

export const description = 'Enter a concise, meaningful migration description here.';

export const up: MigrationHook = async () => {
  const { db } = await connect();
  const vis = db.collection('vendorideas');
  const docs = await vis.find();
  logger.info('Vendor Ideas', { count: await docs.count() });
  for await (const doc of docs) {
    let updated = false;
    for (const logItem of doc.log) {
      if (logItem.attachments === undefined || logItem.attachments === null) {
        logger.info('modifying vendor idea log item', { vendorIdeaId: doc._id });
        logItem.attachments = [];
        updated = true;
      }
    }
    if (updated) {
      logger.info('persisting updated vendor idea...', { vendorIdeaId: doc._id });
      await vis.replaceOne({ _id: doc._id }, doc);
      logger.info('...persisted updated RFI', { rfiId: doc._id });
    } else {
      logger.info('no need to persist updated vendor idea...', { vendorIdeaId: doc._id });
    }
  }
};

export const down: MigrationHook = async () => {
  const { db } = await connect();
  const vis = db.collection('vendorideas');
  const docs = await vis.find();
  logger.info('Vendor Ideas', { count: await docs.count() });
  for await (const doc of docs) {
    let updated = false;
    for (const logItem of doc.log) {
      if (logItem.attachments !== undefined && logItem.attachments !== null) {
        logger.info('modifying vendor idea log item', { vendorIdeaId: doc._id });
        delete logItem.attachments;
        updated = true;
      }
    }
    if (updated) {
      logger.info('persisting updated vendor idea...', { vendorIdeaId: doc._id });
      await vis.replaceOne({ _id: doc._id }, doc);
      logger.info('...persisted updated RFI', { rfiId: doc._id });
    } else {
      logger.info('no need to persist updated vendor idea...', { vendorIdeaId: doc._id });
    }
  }
};
