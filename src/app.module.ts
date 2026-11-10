
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createObserveModule } from '@nestjs/observe';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import { envValidationSchema } from './config/env.validation.js';
import { getDatabaseConfig } from './config/database.config.js';

import { UsersModule } from './shared/users/users.module.js';
import { MpdsrModule } from './mpdsr/mpdsr.module.js';
// import { EmoncModule } from './emonc/emonc.module.js';
import { EmoncModule } from './emonc/emonc.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: envValidationSchema,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),

    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'ramca-backend',
    }),

    // Business domains
    UsersModule,
    MpdsrModule,
    EmoncModule,
    // EmoncModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
