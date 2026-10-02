import type { ThrottlerStorage } from '@nestjs/throttler';
import { redis } from '../../database/redis';
export class RedisThrottleStorage implements ThrottlerStorage {
  async increment(key: string, ttl: number, limit: number, _blockDuration: number, throttlerName: string) {
    const result = await redis.eval("local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end; return {n, redis.call('PTTL', KEYS[1])}", 1, `rate:${throttlerName}:${key}`, ttl) as [number, number];
    return { totalHits: result[0], timeToExpire: Math.ceil(result[1] / 1000), isBlocked: result[0] > limit, timeToBlockExpire: result[0] > limit ? Math.ceil(result[1] / 1000) : 0 };
  }
}
