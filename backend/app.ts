import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.ts';
import { swaggerSpec } from './config/swagger.ts';
import { UPLOAD_DIR } from './middleware/upload.ts';
import { errorHandler, notFoundHandler } from './middleware/error.ts';
import api from './route/index.ts';

export function createApp() {
  const app = express();
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));

  app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));
  app.get('/api/docs.json', (_req, res) => {
    res.json(swaggerSpec);
  });
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'O-Rion API' }));
  app.use('/api', api);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
