import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

/**
 * Structured access log: method, path, status and end-to-end latency.
 *
 * Runs as Express middleware, i.e. *before* the Nest DI/guard/interceptor
 * pipeline, so it also captures requests rejected early by guards.
 */
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const startedAt = process.hrtime.bigint();

    res.on('finish', () => {
      const durationMs =
        Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const { statusCode } = res;
      const context = `${method} ${originalUrl} ${statusCode} ${durationMs.toFixed(2)}ms`;

      if (statusCode >= 500) {
        this.logger.error(context);
      } else if (statusCode >= 400) {
        this.logger.warn(context);
      } else {
        this.logger.log(context);
      }
    });

    next();
  }
}
