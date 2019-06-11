import { MONGO_URL } from 'back-end/config';
import { Db, MongoClient } from 'mongodb';

interface Connection {
  client: MongoClient;
  db: Db;
}

let connection: Connection | undefined;

export async function connect(): Promise<Connection> {
  if (!MONGO_URL) {
    throw new Error('MONGO_URL is null');
  }
  if (!connection) {
    const client = await (new MongoClient(MONGO_URL, {
      useNewUrlParser: true
    })).connect();
    connection = {
      client,
      db: client.db()
    };
  }
  return connection;
}
