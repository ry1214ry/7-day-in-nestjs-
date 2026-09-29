import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RAW_RESPONSE_KEY } from '../decorators/raw-response.decorator.js';
import {
  PaginatedResult,
  PaginationMeta,
} from '../interfaces/paginated-result.interface.js';

export interface StandardResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
  timestamp: string;
  path: string;
}

/**
 * Wraps every successful handler return value in a stable envelope.
 *
 * Clients can then write one response-parsing path instead of guessing whether
 * a field is `data`, `items` or bare. Paginated results keep their `meta`.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  StandardResponse<T> | T
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<StandardResponse<T> | T> {
    const isRaw = this.reflector.getAllAndOverride<boolean>(RAW_RESPONSE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isRaw) {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();

    return next.handle().pipe(
      map((data): StandardResponse<T> | T => {
        const isPaginated = data instanceof PaginatedResult;

        return {
          success: true,
          data: (isPaginated ? data.items : data) as T,
          ...(isPaginated ? { meta: data.meta } : {}),
          timestamp: new Date().toISOString(),
          path: request.originalUrl ?? request.url ?? '',
        };
      }),
    );
  }
}
