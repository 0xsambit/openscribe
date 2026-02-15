import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env';
import { requestIdMiddleware, requestLogger } from './middleware/request-logger.middleware';
import { errorHandler } from './middleware/error-handler.middleware';

// Controllers
import { authController } from './modules/auth/auth.controller';
import { usersController } from './modules/users/users.controller';
import { apiKeysController } from './modules/api-keys/api-keys.controller';
import { linkedInController } from './modules/linkedin/linkedin.controller';
import { analysisController } from './modules/analysis/analysis.controller';
import { strategyController } from './modules/strategy/strategy.controller';
import { contentController } from './modules/content/content.controller';
import { analyticsController } from './modules/analytics/analytics.controller';

export function createApp() {
  const app = express();

  // ---- Global Middleware ----
  app.use(helmet());
  app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestIdMiddleware);
  app.use(requestLogger);

  // ---- Health Check ----
  app.get('/api/v1/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '0.1.0',
    });
  });

  // ---- API Routes ----
  app.use('/api/v1/auth', authController);
  app.use('/api/v1/users', usersController);
  app.use('/api/v1/api-keys', apiKeysController);
  app.use('/api/v1/linkedin', linkedInController);
  app.use('/api/v1/analysis', analysisController);
  app.use('/api/v1/strategy', strategyController);
  app.use('/api/v1/content', contentController);
  app.use('/api/v1/analytics', analyticsController);

  // ---- 404 Handler ----
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested endpoint does not exist.',
      },
    });
  });

  // ---- Global Error Handler ----
  app.use(errorHandler);

  return app;
}
