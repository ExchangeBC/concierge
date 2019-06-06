import { makeDomainLogger } from 'back-end/lib/logger';
import { console as consoleAdapter } from 'back-end/lib/logger/adapters';
import { MigrationHook } from 'migrate';
import { connect } from 'migrations/db';
import path from 'path';

const logger = makeDomainLogger(consoleAdapter, `migrations:${path.basename(__filename)}`);

export const description = 'Enter a concise, meaningful migration description here.';

export const up: MigrationHook = async () => {
  const { db, client } = await connect();
  // Migration UP logic goes here.
  await client.close();
};

export const down: MigrationHook = async () => {
  const { db, client } = await connect();
  // Migration DOWN logic goes here.
  await client.close();
};
