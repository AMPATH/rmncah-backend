
import 'dotenv/config';
import { DataSource } from 'typeorm';

const requiredEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
};

const dataSource = new DataSource({
  type: 'mysql',

  host: requiredEnv('DB_HOST'),
  port: Number(requiredEnv('DB_PORT')),
  username: requiredEnv('DB_USERNAME'),
  password: requiredEnv('DB_PASSWORD'),
  database: requiredEnv('DB_NAME'),

  charset: 'utf8mb4',

  // Automatically discover all compiled entities.
  entities: ['dist/**/*.entity.js'],

  // Load compiled TypeORM migrations.
  migrations: ['dist/database/migrations/*.js'],

  synchronize: false,
  migrationsRun: false,

  logging: true,
});

export default dataSource;
