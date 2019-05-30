/* tslint:disable max-classes-per-file */

declare module 'migrate' {

  import { EventEmitter } from 'events';

  export type Errback
    = (error: Error | null | undefined) => void;

  export type Callback<Value>
    = (error: Error | null | undefined, value: Value) => void;

  export type MigrationSetAddMigration
    = (title: string | Migration, up?: MigrationHook, down?: MigrationHook) => void;

  export type MigrationSetUp
    = (migration: string | Errback, callback?: Errback) => void;

  export type MigrationSetDown = MigrationSetUp;

  export type MigrationSetMigrate
    = (direction: 'up' | 'down', migrationName: string | Errback, fn?: Errback) => void;

  export class MigrationSet extends EventEmitter {
    public store: Store;
    public migrations: Migration[];
    public map: Record<string, Migration>;
    public lastRun: string | null;
    public addMigration: MigrationSetAddMigration;
    public up: MigrationSetUp;
    public down: MigrationSetDown;
    public migrate: MigrationSetMigrate;
    public save(callback: Errback): void;
  }

  export interface StoreState {
    lastRun: string | null;
    migrations: StoreMigration[];
  }

  export interface Store {
    save(state: StoreState, callback: Errback): void | Promise<void>;
    load(callback: Callback<StoreState | undefined>): void | Promise<void>;
  }

  export type MigrationHook = () => Promise<void>;

  export interface StoreMigration {
    title: string;
    description: string;
    timestamp: null | number;
  }

  export interface Migration extends StoreMigration {
    up: MigrationHook;
    down: MigrationHook;
  }

  export interface LoadOptions {
    stateStore: string | Store;
    migrationsDirectory?: string;
    ignoreMissing?: boolean;
    filterFunction?(file: string, index: number, files: string[]): boolean;
    sortFunction?(a: Migration, b: Migration): -1 | 0 | 1;
  }

  interface Migrate {
    load(options: LoadOptions, callaback: Callback<MigrationSet>): void;
  }

  const migrate: Migrate;

  export default migrate;

}

/* tslint:enable max-classes-per-file */
