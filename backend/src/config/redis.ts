import Redis from 'ioredis';
import { env } from './env';

let redis: Redis;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null, // Required for BullMQ
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      lazyConnect: true,
    });

    redis.on('connect', () => {
      console.log('✅ Redis connected');
    });

    redis.on('error', (err) => {
      console.error('❌ Redis error:', err.message);
    });
  }
  return redis;
}

export async function connectRedis(): Promise<void> {
  const client = getRedis();
  try {
    await client.connect();
  } catch (error) {
    // If already connected, ignore
    if ((error as Error).message?.includes('already')) return;
    console.error('❌ Redis connection failed:', error);
    // Redis is optional for basic operation
    console.warn('⚠️ Continuing without Redis - some features may be unavailable');
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    console.log('Redis disconnected');
  }
}
