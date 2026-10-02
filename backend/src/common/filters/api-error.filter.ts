import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { ZodError } from 'zod';
import type { Response } from 'express';
import pino from 'pino';
const logger = pino();
@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof ZodError ? 400 : exception instanceof HttpException ? exception.getStatus() : 500;
    if (status === 500) logger.error({ event: 'request_error', type: exception instanceof Error ? exception.name : 'Unknown', code: typeof exception === 'object' && exception && 'code' in exception ? String(exception.code) : 'INTERNAL', frames: exception instanceof Error ? exception.stack?.split('\n').slice(1, 4) : [] });
    const payload = exception instanceof HttpException ? exception.getResponse() : null;
    const code = payload && typeof payload === 'object' && 'code' in payload ? String(payload.code) : status === 400 ? 'VALIDATION_ERROR' : status === 401 ? 'UNAUTHORIZED' : status === 403 ? 'FORBIDDEN' : status === 429 ? 'RATE_LIMITED' : 'REQUEST_FAILED';
    const message = payload && typeof payload === 'object' && 'message' in payload ? String(payload.message) : status === 400 ? 'Revisa los datos enviados.' : 'No se ha podido completar la solicitud.';
    response.status(status).json({ error: { code, message } });
  }
}
