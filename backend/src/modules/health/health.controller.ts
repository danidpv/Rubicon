import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Pool } from 'pg';
import { env } from '../../config/env';
import { redis } from '../../database/redis';
const pool = new Pool({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 2000 });
@Controller('health')
export class HealthController {
  @Get() health() { return { status: 'ok', service: 'sp-local-ia' }; }
  @Get('ready') async ready() {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try { await Promise.race([Promise.all([pool.query('SELECT 1'), redis.ping()]), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Readiness timeout')), 3000); })]); return { status: 'ready', database: 'ok', redis: 'ok' }; }
    catch { throw new ServiceUnavailableException({ code: 'NOT_READY', message: 'Servicios de persistencia no disponibles' }); }
    finally { if (timer) clearTimeout(timer); }
  }
}
