import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import pino from 'pino';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { env } from './config/env';
import { ApiErrorFilter } from './common/filters/api-error.filter';
const logger = pino({ level: 'info' });
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true, logger: ['error', 'warn'] });
  app.setGlobalPrefix('api/v1');
  app.use(helmet()); app.use(cookieParser()); app.useBodyParser('json', { limit: '128kb' });
  app.use((req: Request, res: Response, next: NextFunction) => {
    const started = Date.now(); const requestId = randomUUID(); res.setHeader('X-Request-Id', requestId);
    res.on('finish', () => logger.info({ requestId, route: req.path, duration: Date.now() - started, status: res.statusCode }));
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.path !== '/api/v1/billing/webhook' && req.headers.origin !== env.FRONTEND_URL) {
      res.status(403).json({ error: { code: 'ORIGIN_REJECTED', message: 'Origen no autorizado.' } }); return;
    }
    next();
  });
  app.useGlobalFilters(new ApiErrorFilter());
  app.enableShutdownHooks();
  await app.listen(env.PORT, env.HOST);
  logger.info({ event: 'api_started', host: env.HOST, port: env.PORT });
}
bootstrap().catch(() => { logger.error({ event: 'startup_failed' }); process.exitCode = 1; });
