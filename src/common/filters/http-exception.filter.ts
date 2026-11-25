import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

interface RequestContext {
  method?: string;
  url?: string;
  headers?: {
    'x-request-id'?: string | string[];
  };
}

interface ResponseContext {
  status: (code: number) => {
    json: (body: unknown) => void;
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();

    const request = context.getRequest<RequestContext>();
    const response = context.getResponse<ResponseContext>();

    const isHttpException = exception instanceof HttpException;

    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = isHttpException
      ? exception.getResponse()
      : null;

    const responseBody =
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
        ? (exceptionResponse as Record<string, unknown>)
        : {};

    const validationMessages = Array.isArray(responseBody.message)
      ? responseBody.message
      : undefined;

    const message =
      statusCode >= 500
        ? 'Internal server error'
        : validationMessages
          ? 'Validation failed'
          : typeof responseBody.message === 'string'
            ? responseBody.message
            : typeof exceptionResponse === 'string'
              ? exceptionResponse
              : 'Request failed';

    const error =
      statusCode >= 500
        ? 'Internal Server Error'
        : typeof responseBody.error === 'string'
          ? responseBody.error
          : HttpStatus[statusCode];

    if (statusCode >= 500) {
      const stack =
        exception instanceof Error ? exception.stack : undefined;

      this.logger.error(
        `${request.method ?? 'UNKNOWN'} ${request.url ?? ''} - ${statusCode}`,
        stack,
      );
    }

    const headerRequestId = request.headers?.['x-request-id'];
    const requestId = Array.isArray(headerRequestId)
      ? headerRequestId[0]
      : headerRequestId;

    response.status(statusCode).json({
      success: false,
      requestId,
      message,
      statusCode,
      error,
      ...(validationMessages
        ? { details: validationMessages }
        : {}),
      timestamp: new Date().toISOString(),
      path: request.url ?? '',
      method: request.method ?? '',
    });
  }
}
