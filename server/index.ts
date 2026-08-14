import { createApp } from './app';
import { connectToDatabase } from './config/database';
import { serverEnv } from './config/env';

const startServer = async () => {
  await connectToDatabase();

  const app = createApp();

  app.listen(serverEnv.port, () => {
    console.log(`Noklity API running on port ${serverEnv.port}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start Noklity API:', error);
  process.exit(1);
});
