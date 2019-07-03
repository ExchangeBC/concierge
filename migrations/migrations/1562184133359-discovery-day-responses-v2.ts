import { makeDomainLogger } from 'back-end/lib/logger';
import { console as consoleAdapter } from 'back-end/lib/logger/adapters';
import { get } from 'lodash';
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
    const ddrs = [];
    for await (const ddr of doc.discoveryDayResponses) {
      const vendor = await db.collection('users').findOne({
        _id: ddr.vendor
      });
      if (!vendor) {
        logger.error('unable to find vendor', { id: ddr.vendor });
        throw new Error('unable to find vendor');
      }
      ddrs.push({
        ...ddr,
        updatedAt: ddr.createdAt,
        attendees: get(ddr, 'attendees.length')
          ? ddr.attendees
          : [{
              name: get(vendor.profile, 'contactName', 'Unknown'),
              email: vendor.email,
              remote: false
            }]
      });
    }
    doc.discoveryDayResponses = ddrs;
    logger.info('persisting updated rfi...', { _id: doc._id, ddrCount: doc.discoveryDayResponses.length });
    await db.collection('rfis').replaceOne({ _id: doc._id }, doc);
    logger.info('...persisted updated rfi...', { _id: doc._id, ddrCount: doc.discoveryDayResponses.length });
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
    logger.info('persisting updated rfi...', { _id: doc._id });
    await db.collection('rfis').replaceOne({ _id: doc._id }, doc);
    logger.info('...persisted updated rfi...', { _id: doc._id });
  }
};
