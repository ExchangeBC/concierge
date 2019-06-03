import { MONGO_URL } from 'back-end/config';
import { MongoClient } from 'mongodb';

export async function connect() {
  if (!MONGO_URL) {
    throw new Error('MONGO_URL is null');
  }
  const client = await MongoClient.connect(MONGO_URL, {
    useNewUrlParser: true
  });
  return {
    client,
    db: client.db()
  };
}
