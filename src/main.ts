
import { setDefaultResultOrder } from 'node:dns';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

import { NestFactory, Reflector } from '@nestjs/core';
import {
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

//import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { AppModule, ObserveInstrument } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor.js';

// Prefer IPv4 to avoid SMTP connection timeouts caused by IPv6 routing.
setDefaultResultOrder('ipv4first');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  const httpLogger = new Logger('HTTP');

  // Global API prefix
  app.setGlobalPrefix('api');

  // Assign a unique ID to every request and log its outcome.
  app.use((request: Request, response: Response, next: NextFunction) => {
    const requestId = randomUUID();
    const startedAt = process.hrtime.bigint();

    request.headers['x-request-id'] = requestId;
    response.setHeader('X-Request-ID', requestId);

    response.on('finish', () => {
      const durationMs =
        Number(process.hrtime.bigint() - startedAt) / 1_000_000;

      httpLogger.log(
        JSON.stringify({
          requestId,
          method: request.method,
          path: request.path,
          statusCode: response.statusCode,
          durationMs: Number(durationMs.toFixed(2)),
        }),
      );
    });

    next();
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('RMNCAH API')
    .setDescription('RMNCAH and EmONC Management System API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    useGlobalPrefix: false,
  });

  console.log('Swagger configured at /api/docs');

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(
    new ApiResponseInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  // Swagger / OpenAPI configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('RMNCAH API')
    .setDescription('API documentation for the RMNCAH System.')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
        name: 'Authorization',
        description: 'Enter your JWT access token.',
      },
      'access-token',
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, swaggerDocument, {
    useGlobalPrefix: true,
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Enable CORS when needed
  // app.enableCors({
  //   origin: ['http://localhost:3000'],
  //   credentials: true,
  // });

  const port = Number(process.env.PORT ?? 3000);

  await app.listen(port);

  console.log(`Application running on: http://localhost:${port}/api`);
  console.log(`Swagger documentation: http://localhost:${port}/api/docs`);
}

await bootstrap();
