import { getRedis } from '../../config/redis';

/**
 * 3-tier cache service: in-memory → Redis → Database
 */

// In-memory cache (tier 1)
const memoryCache = new Map<string, { value: unknown; expiresAt: number }>();
const MEMORY_TTL_MS = 30_000; // 30 seconds

export class CacheService {
  /**
   * Get a cached value.
   * Checks: memory → Redis → returns null
   */
  async get<T>(key: string): Promise<T | null> {
    // Tier 1: Memory
    const memEntry = memoryCache.get(key);
    if (memEntry && memEntry.expiresAt > Date.now()) {
      return memEntry.value as T;
    }
    memoryCache.delete(key);

    // Tier 2: Redis
    try {
      const redis = getRedis();
      const redisValue = await redis.get(`cache:${key}`);
      if (redisValue) {
        const parsed = JSON.parse(redisValue) as T;
        // Populate memory cache
        memoryCache.set(key, { value: parsed, expiresAt: Date.now() + MEMORY_TTL_MS });
        return parsed;
      }
    } catch {
      // Redis unavailable, continue
    }

    return null;
  }

  /**
   * Set a cached value in both memory and Redis.
   */
  async set(key: string, value: unknown, ttlSeconds: number = 300): Promise<void> {
    // Tier 1: Memory
    memoryCache.set(key, {
      value,
      expiresAt: Date.now() + Math.min(MEMORY_TTL_MS, ttlSeconds * 1000),
    });

    // Tier 2: Redis
    try {
      const redis = getRedis();
      await redis.setex(`cache:${key}`, ttlSeconds, JSON.stringify(value));
    } catch {
      // Redis unavailable, memory cache is still set
    }
  }

  /**
   * Invalidate a cached value.
   */
  async invalidate(key: string): Promise<void> {
    memoryCache.delete(key);
    try {
      const redis = getRedis();
      await redis.del(`cache:${key}`);
    } catch {
      // Redis unavailable
    }
  }

  /**
   * Invalidate all cache entries matching a pattern.
   */
  async invalidatePattern(pattern: string): Promise<void> {
    // Memory cache
    for (const key of memoryCache.keys()) {
      if (key.includes(pattern)) {
        memoryCache.delete(key);
      }
    }

    // Redis
    try {
      const redis = getRedis();
      const keys = await redis.keys(`cache:*${pattern}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch {
      // Redis unavailable
    }
  }
}

export const cacheService = new CacheService();
