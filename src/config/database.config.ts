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

  database: configService.getOrThrow<string>('DB_NAME'),

  // Automatically register entities from feature modules.
  autoLoadEntities: true,


 
  // migrations
  migrationsRun:false,
  entities: ['dist/**/*.entity.js'],
    migrations: ['dist/database/migrations/*.ts'],
 synchronize: false,
  // Enable SQL logging during development.
  logging: true,

  charset: 'utf8mb4',
});
