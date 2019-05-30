import { makeDomainLogger } from 'back-end/lib/logger';
import { console as consoleAdapter } from 'back-end/lib/logger/adapters';
import { get } from 'lodash';
import { Callback, default as migrate, LoadOptions, MigrationSet, Store, StoreState } from 'migrate';
import { connect } from 'migrations/db';
import { ObjectId } from 'mongodb';
import path from 'path';

const logger = makeDomainLogger(consoleAdapter, 'migrations');

function exitWithFailure(error: Error) {
  logger.error('migrations failed', {
    message: error.message,
    stack: error.stack
  });
  process.exit(1);
}

interface CustomStoreState extends StoreState {
  _id: ObjectId;
  createdAt: Date;
}

async function mongoDbStore(): Promise<Store> {
  const db = await connect();
  return {
    async load(callback) {
      try {
        const collection = db.collection('migrations');
        const result: CustomStoreState[] = await collection
          .find({})
          .limit(1)
          .sort({ createdAt: -1 })
          .toArray();
        const state: CustomStoreState | null = get(result, '0', null);
        if (state) {
          logger.info(`"${state.lastRun}" was the last run migration`);
          callback(null, state);
        } else {
          logger.info('no migrations have been run yet');
          callback(null, {
            lastRun: null,
            migrations: []
          });
        }
      } catch (error) {
        callback(error, undefined);
      }
    },
    async save(state, callback) {
      try {
        const collection = db.collection('migrations');
        await collection.insertOne({
          createdAt: new Date(),
          lastRun: state.lastRun,
          migrations: state.migrations
        });
        logger.info('migration state persisted');
        callback(null);
      } catch (error) {
        callback(error);
      }
    }
  };

};

async function start(): Promise<void> {
  const MIGRATION_FILE_REGEXP = /\.ts$/;
  const options: LoadOptions = {
    stateStore: await mongoDbStore(),
    migrationsDirectory: path.join(__dirname, 'migrations'),
    filterFunction(file) {
      return !!file.match(MIGRATION_FILE_REGEXP);
    }
  };

  const callback: Callback<MigrationSet> = (error, set) => {
    if (error) { return exitWithFailure(error); }
    set.up(error => {
      if (error) { return exitWithFailure(error); }
      logger.info('migrations successfully completed');
      process.exit(0);
    });
  };

  logger.info('loading migrations');
  migrate.load(options, callback);
}

start().catch(exitWithFailure);
