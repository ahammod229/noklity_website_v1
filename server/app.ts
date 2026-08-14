import cors from 'cors';
import express from 'express';
import catalogRoutes from './routes/catalog';
import healthRoutes from './routes/health';
import { serverEnv } from './config/env';

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || serverEnv.clientOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error('Request origin is not allowed by API CORS policy.'));
      },
      credentials: true
    })
  );

  app.use(express.json({ limit: '1mb' }));

  app.use('/api', healthRoutes);
  app.use('/api', catalogRoutes);

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({
      message: 'The API could not process this request.'
    });
  });

  return app;
};
