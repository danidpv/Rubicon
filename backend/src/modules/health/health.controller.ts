import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { db } from '../../database/prisma';
import { redis } from '../../database/redis';
@Controller('health')
export class HealthController {
  @Get() health() { return { status: 'ok', service: 'sp-local-ia' }; }
  @Get('live') live() { return { status: 'live' }; }
  @Get('ready')
  async ready() {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const checks = [db.$queryRaw`SELECT 1`, ...(redis ? [redis.ping()] : [])];
    try {
      await Promise.race([Promise.all(checks), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Readiness timeout')), 3000); })]);
      return { status: 'ready', database: 'ok', redis: redis ? 'ok' : 'disabled' };
    }
    catch { throw new ServiceUnavailableException({ status: 'not_ready' }); }
    finally { if (timer) clearTimeout(timer); }
  }
}
