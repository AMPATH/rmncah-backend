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
import { LocationsModule } from './locations/locations.module.js';
import { FacilitiesModule } from './facilities/facilities.module.js';
import { UserOrganizationAssignmentsModule } from './shared/user-organization-assignments/user-organization-assignments.module.js';
import { RbacModule } from './shared/rbac/rbac.module.js';
import { AuthModule } from './auth/auth.module.js';

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
    LocationsModule,
    FacilitiesModule,
    UserOrganizationAssignmentsModule,
    RbacModule,
    AuthModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
