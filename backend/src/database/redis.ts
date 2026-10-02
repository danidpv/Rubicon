import { Redis } from 'ioredis';
import { env } from '../config/env';

export const hasRedis = Boolean(env.REDIS_URL);
export const redis = env.REDIS_URL ? new Redis(env.REDIS_URL, { maxRetriesPerRequest: null, lazyConnect: true }) : null;
redis?.on('error', () => { /* Readiness and operations report failures; never log connection credentials. */ });

const memoryCounters = new Map<string, { count: number; expiresAt: number }>();

function readQueueConnection() {
  if (!env.REDIS_URL) return null;
  const queueUrl = new URL(env.REDIS_URL);
  return {
    host: queueUrl.hostname,
    port: Number(queueUrl.port || 6379),
    username: queueUrl.username ? decodeURIComponent(queueUrl.username) : undefined,
    password: queueUrl.password ? decodeURIComponent(queueUrl.password) : undefined,
    db: Number(queueUrl.pathname.slice(1) || 0),
    maxRetriesPerRequest: null,
    ...(queueUrl.protocol === 'rediss:' ? { tls: {} } : {})
  };
}

export const queueConnection = readQueueConnection();

export async function cacheSet(key: string, value: string, seconds: number) {
  if (!redis) return;
  await redis.set(key, value, 'EX', seconds);
}

export async function cacheDel(keys: string[]) {
  if (!redis || !keys.length) return;
  await redis.del(...keys);
}

export async function incrementWindow(key: string, ttlMs: number): Promise<{ totalHits: number; ttlMs: number }> {
  if (redis) {
    const [totalHits, timeToExpire] = await redis.eval(
      "local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end; return {n, redis.call('PTTL', KEYS[1])}",
      1,
      key,
      ttlMs
    ) as [number, number];
    return { totalHits, ttlMs: Math.max(0, timeToExpire) };
  }

  const now = Date.now();
  const current = memoryCounters.get(key);
  if (!current || current.expiresAt <= now) {
    memoryCounters.set(key, { count: 1, expiresAt: now + ttlMs });
    return { totalHits: 1, ttlMs };
  }
  current.count += 1;
  return { totalHits: current.count, ttlMs: Math.max(0, current.expiresAt - now) };
}

export async function incrementDaily(key: string) {
  return (await incrementWindow(key, 86_400_000)).totalHits;
}
