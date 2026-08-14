import mongoose from 'mongoose';
import { requireServerEnv } from './env';

let connectionPromise: Promise<typeof mongoose> | null = null;

export const connectToDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(requireServerEnv('mongoUri'));
  }

  try {
    return await connectionPromise;
  } catch (error) {
    connectionPromise = null;
    throw error;
  }
};
