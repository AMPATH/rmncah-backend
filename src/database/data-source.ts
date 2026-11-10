import { DataSource } from 'typeorm';

import { Case } from '../mpdsr/cases/entities/case.entity.js';
import { MaternalCaseDetail } from '../mpdsr/cases/entities/maternal-case-detail.entity.js';
import { PerinatalCaseDetail } from '../mpdsr/cases/entities/perinatal-case-detail.entity.js';
import { NearMissDetail } from '../mpdsr/cases/entities/near-miss-detail.entity.js';

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

  entities: [Case, MaternalCaseDetail, PerinatalCaseDetail, NearMissDetail],

  migrations: ['dist/database/migrations/*.js'],

  synchronize: false,
  migrationsRun: false,
  logging: true,
});

export default dataSource;
