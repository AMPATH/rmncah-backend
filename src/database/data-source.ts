import 'dotenv/config';
import { DataSource } from 'typeorm';

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  entities: ['src/shared/users/entities/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],

  synchronize: false,
  migrationsRun: false,
  logging: true,
});

export default AppDataSource;