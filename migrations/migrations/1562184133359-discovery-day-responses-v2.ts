import { makeDomainLogger } from 'back-end/lib/logger';
import { console as consoleAdapter } from 'back-end/lib/logger/adapters';
import { MigrationHook } from 'migrate';
import { connect } from 'migrations/db';
import path from 'path';

const logger = makeDomainLogger(consoleAdapter, `migrations:${path.basename(__filename)}`);

export const description = 'Updates RFIs\' discovery session responses to support new features.';

export const up: MigrationHook = async () => {
  const { db } = await connect();
  const rfis = db.collection('rfis').find();
  logger.info('RFIs', { count: await rfis.count() });
  for await (const doc of rfis) {
    // Update discovery day definition.
    doc.versions = doc.versions.map((v: any) => {
      // Retain old storage of discovery days in past versions.
      v.discoveryDayDeprecated = v.discoveryDay;
      // Set discovery day to undefined to match new schema.
      v.discoveryDay = undefined;
      return v;
    });
    // Update discovery day responses.
    doc.discoveryDayResponsesDeprecated = doc.discoveryDayResponses || [];
    doc.discoveryDayResponses = [];
    logger.info('persisting updated rfi...', { _id: doc._id, ddrCount: doc.discoveryDayResponsesDeprecated.length });
    await db.collection('rfis').replaceOne({ _id: doc._id }, doc);
    logger.info('...persisted updated rfi...', { _id: doc._id, ddrCount: doc.discoveryDayResponsesDeprecated.length });
  }
};

export const down: MigrationHook = async () => {
  // We only migrate the discovery day definition in RFI versions
  // as that breaks compatibility with older versions of the code.
  // We do not need to migrate discovery day responses down as this
  // migration only adds fields to each response, not breaking compatibility.
  const { db } = await connect();
  const rfis = db.collection('rfis').find();
  logger.info('RFIs', { count: await rfis.count() });
  for await (const doc of rfis) {
    doc.versions = doc.versions.map((v: any) => {
      v.discoveryDay = v.discoveryDayDeprecated;
      delete v.discoveryDayDeprecated;
      return v;
    });
    doc.discoveryDayResponses = doc.discoveryDayResponsesDeprecated;
    delete doc.discoveryDayResponsesDeprecated;
    logger.info('persisting updated rfi...', { _id: doc._id });
    await db.collection('rfis').replaceOne({ _id: doc._id }, doc);
    logger.info('...persisted updated rfi...', { _id: doc._id });
  }
};
