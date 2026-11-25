import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

import { Observable, map } from 'rxjs';

interface PaginatedPayload {
  data: unknown[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function isPaginatedPayload(
  value: unknown,
): value is PaginatedPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const payload = value as Record<string, unknown>;

  return (
    Array.isArray(payload.data) &&
    typeof payload.total === 'number' &&
    typeof payload.page === 'number' &&
    typeof payload.limit === 'number' &&
    typeof payload.totalPages === 'number'
  );
}

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      map((response: unknown) => {
        const timestamp = new Date().toISOString();
        const request = _context.switchToHttp().getRequest<{
          headers?: { 'x-request-id'?: string };
        }>();
        const requestId = request.headers?.['x-request-id'];

        if (isPaginatedPayload(response)) {
          return {
            success: true,
            requestId,
            message: 'Request successful',
            data: response.data,
            meta: {
              total: response.total,
              page: response.page,
              limit: response.limit,
              totalPages: response.totalPages,
            },
            timestamp,
          };
        }

        return {
          success: true,
          requestId,
          message: 'Request successful',
          data: response,
          timestamp,
        };
      }),
    );
  }
}
