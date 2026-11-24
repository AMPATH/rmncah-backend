
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  // Global API prefix
  app.setGlobalPrefix('api');

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

  // SwaggerModule.setup('docs', app, document);
  SwaggerModule.setup('api/docs', app, document, {
  useGlobalPrefix: false,
});
  console.log('Swagger configured at /api/docs');

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
