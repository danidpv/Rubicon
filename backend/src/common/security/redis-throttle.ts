import { Injectable } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import { incrementWindow } from '../../database/redis';
@Injectable()
export class RedisThrottleStorage implements ThrottlerStorage {
  async increment(key: string, ttl: number, limit: number, _blockDuration: number, throttlerName: string) {
    const result = await incrementWindow(`rate:${throttlerName}:${key}`, ttl);
    const isBlocked = result.totalHits > limit;
    const seconds = Math.ceil(result.ttlMs / 1000);
    return { totalHits: result.totalHits, timeToExpire: seconds, isBlocked, timeToBlockExpire: isBlocked ? seconds : 0 };
  }
}
