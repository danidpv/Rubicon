import { Redis } from 'ioredis';
import { env } from '../config/env';
export const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null, lazyConnect: true });
redis.on('error', () => { /* Readiness and operations report failures; never log connection credentials. */ });
const queueUrl = new URL(env.REDIS_URL);
export const queueConnection = { host: queueUrl.hostname, port: Number(queueUrl.port || 6379), username: queueUrl.username ? decodeURIComponent(queueUrl.username) : undefined, password: queueUrl.password ? decodeURIComponent(queueUrl.password) : undefined, db: Number(queueUrl.pathname.slice(1) || 0), maxRetriesPerRequest: null, ...(queueUrl.protocol === 'rediss:' ? { tls: {} } : {}) };
