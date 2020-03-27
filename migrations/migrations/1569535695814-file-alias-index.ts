import { makeDomainLogger } from 'back-end/lib/logger';
import { console as consoleAdapter } from 'back-end/lib/logger/adapters';
import { MigrationHook } from 'migrate';
import { connect } from 'migrations/db';
import path from 'path';

const logger = makeDomainLogger(consoleAdapter, `migrations:${path.basename(__filename)}`);

export const description = 'Creates an index on the file collection\'s "alias" property.';

const indexName = 'fileAlias';

export const up: MigrationHook = async () => {
  const { db } = await connect();
  logger.info('creating index...');
  await db.collection('files').createIndex({ alias: 1 }, { name: indexName });
  logger.info('...index created.');
};

export const down: MigrationHook = async () => {
  const { db } = await connect();
  try {
    logger.info('dropping index...');
    await db.collection('files').dropIndex(indexName);
    logger.info('...index dropped.');
  } catch (e) {
    logger.error('failed to drop fileAlias index');
  }
};
