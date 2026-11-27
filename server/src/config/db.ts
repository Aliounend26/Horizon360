import mongoose from 'mongoose';
import { env } from './env';

let memoryServer: any = null;

export async function connectDB(): Promise<void> {
  let uri = env.mongoUri;

  if (!uri) {
    if (env.nodeEnv !== 'development') {
      throw new Error('MONGODB_URI must be configured outside development');
    }
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create({ instance: { dbName: 'horizon360' } });
    uri = memoryServer.getUri();
    console.log('[db] No MONGODB_URI set — using an in-memory MongoDB for development.');
    console.log('[db] Data will reset on restart. Set MONGODB_URI in server/.env for persistent storage.');
  }

  await mongoose.connect(uri);
  console.log(`[db] Connected to MongoDB (${memoryServer ? 'in-memory' : 'configured URI'})`);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}
