import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'mysql',

  host: configService.getOrThrow<string>('DB_HOST'),

  port: configService.getOrThrow<number>('DB_PORT'),

  username: configService.getOrThrow<string>('DB_USERNAME'),

  password: configService.getOrThrow<string>('DB_PASSWORD'),

  database: configService.getOrThrow<string>('DB_DATABASE'),

  // Automatically register entities from feature modules.
  autoLoadEntities: true,

  // Never let TypeORM automatically change the database schema.
  synchronize: false,

  // Enable SQL logging during development.
  logging: configService.get<string>('NODE_ENV') === 'development',

  charset: 'utf8mb4',
});
