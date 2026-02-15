import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';

async function main() {
  console.log(`🚀 Starting OpenScripe Backend (${env.NODE_ENV})`);

  // Connect to database
  await connectDatabase();

  // Connect to Redis (optional - gracefully degrades)
  await connectRedis();

  // Create and start Express app
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`✅ Server running on http://localhost:${env.PORT}`);
    console.log(`📋 Health: http://localhost:${env.PORT}/api/v1/health`);
    console.log(`🔗 API Base: http://localhost:${env.PORT}/api/v1`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);

    server.close(async () => {
      await disconnectDatabase();
      await disconnectRedis();
      console.log('Server closed.');
      process.exit(0);
    });

    // Force shutdown after 10s
    setTimeout(() => {
      console.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught errors
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    process.exit(1);
  });
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
