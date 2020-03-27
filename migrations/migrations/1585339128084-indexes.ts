import { makeDomainLogger } from 'back-end/lib/logger';
import { console as consoleAdapter } from 'back-end/lib/logger/adapters';
import { MigrationHook } from 'migrate';
import { connect } from 'migrations/db';
import path from 'path';

const logger = makeDomainLogger(consoleAdapter, `migrations:${path.basename(__filename)}`);

export const description = 'Creates all necessary indexes in the database. Originally, these indexes were manually created, but migration aims to "catch up" and created indexes via programmatically for posterity.';

interface Index {
  collection: string;
  column: string;
  name: string;
  expireAfterSeconds?: number;
  direction: 1 | -1;
}

const defineIndex = (collection: string, column: string, expireAfterSeconds?: number, direction: 1 | -1 = 1): Index => ({
  collection,
  column,
  expireAfterSeconds,
  name: `${collection}_${column}_${direction}`,
  direction
});

const ONE_DAY_IN_SECONDS = 60 * 60 * 24;

const ONE_WEEK_IN_SECONDS = ONE_DAY_IN_SECONDS * 7;

const indexes: Index[] = [
  defineIndex('forgotpasswordtokens', 'createdAt'),
  defineIndex('forgotpasswordtokens', 'token'),
  defineIndex('sessions', 'sessionId'),
  defineIndex('sessions', 'user.id'),
  defineIndex('sessions', 'updatedAt', ONE_DAY_IN_SECONDS * 2), //Prune stale sessions
  defineIndex('sessions', 'createdAt', ONE_WEEK_IN_SECONDS), //Prune week-old sessions
  defineIndex('users', 'email'),
  defineIndex('users', 'profile.type'),
  defineIndex('files', 'hash'),
  defineIndex('files', 'alias'),
  defineIndex('rfipreviews', 'createdAt', ONE_WEEK_IN_SECONDS) //Prune old RFI previews
];

export const up: MigrationHook = async () => {
  const { db } = await connect();
  for (const { collection, column, name, expireAfterSeconds, direction } of indexes) {
    try {
      logger.info(`try dropping existing index: ${name}`);
      await db.collection(collection).dropIndex({
        [column]: direction
      } as any);
      logger.info(`successfully dropped existing index: ${name}`);
    } catch (e) {
      logger.warn(`unable to drop existing index: ${name}, it's likely it doesn't exist (that's fine)`);
    }
    try {
      logger.info(`try creating index: ${name}`);
      await db.collection(collection).createIndex({
        [column]: direction
      }, {
        name,
        expireAfterSeconds
      });
      logger.info(`successfully created index: ${name}`);
    } catch (e) {
      logger.error(`failed to create index: ${name}`);
    }
  }
};

export const down: MigrationHook = async () => {
  const { db } = await connect();
  for (const { collection, name } of indexes) {
    try {
      logger.info(`try dropping index: ${name}`);
      await db.collection(collection).dropIndex(name);
      logger.info(`successfully dropped index: ${name}`);
    } catch (e) {
      logger.error(`failed to drop index: ${name}`);
    }
  }
};
