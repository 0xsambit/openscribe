import { Request, Response, NextFunction } from 'express';
import { getRedis } from '../config/redis';
import { AppError } from './error-handler.middleware';
import { AuthenticatedRequest } from './auth.middleware';
import { env } from '../config/env';

/**
 * Redis-backed sliding window rate limiter.
 * Uses INCR + EXPIRE for simplicity and atomicity.
 */
export function rateLimitMiddleware(options?: {
  maxRequests?: number;
  windowSeconds?: number;
  keyPrefix?: string;
}) {
  const {
    maxRequests = env.RATE_LIMIT_API_PER_HOUR,
    windowSeconds = 3600,
    keyPrefix = 'ratelimit:api',
  } = options || {};

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const redis = getRedis();
      
      // Use user ID if authenticated, otherwise use IP
      const identifier = req.user?.id || req.ip || 'unknown';
      const key = `${keyPrefix}:${identifier}`;

      const current = await redis.incr(key);
      
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      const ttl = await redis.ttl(key);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - current));
      res.setHeader('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + Math.max(ttl, 0));

      if (current > maxRequests) {
        throw AppError.tooManyRequests(
          `Rate limit exceeded. Try again in ${ttl} seconds.`
        );
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
        return;
      }
      // If Redis is down, allow the request through
      console.warn('Rate limiter error (allowing request):', (error as Error).message);
      next();
    }
  };
}

/**
 * Generation-specific rate limiter (stricter limits)
 */
export function generationRateLimitMiddleware() {
  return rateLimitMiddleware({
    maxRequests: env.RATE_LIMIT_GENERATIONS_PER_DAY,
    windowSeconds: 86400, // 24 hours
    keyPrefix: 'ratelimit:generation',
  });
}
