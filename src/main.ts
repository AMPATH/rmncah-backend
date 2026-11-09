import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  const port = Number(process.env.PORT ?? 3000);

  await app.listen(port);

  console.log(`Application running on: http://localhost:${port}`);
}

await bootstrap();
