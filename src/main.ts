
import { NestFactory } from '@nestjs/core';
import { AppModule , ObserveInstrument} from './app.module.js';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule,{
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

  // // Enable CORS
  // app.enableCors({
  //   origin: ['http://localhost:3000'],
  //   credentials: true,
  // });

  // Start application
  const port = process.env.PORT ?? 3000;

  await app.listen(port);

  console.log(`Application running on: http://localhost:${port}/api`);
}

bootstrap();
