import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number().port().default(3000),

  DB_HOST: Joi.string().hostname().default('localhost'),

  DB_PORT: Joi.number().port().default(3306),

  DB_USERNAME: Joi.string().trim().required(),

  DB_PASSWORD: Joi.string().required(),

  DB_NAME: Joi.string().trim().required(),

  JWT_SECRET: Joi.string().min(32).required(),

  // Email / SMTP configuration
  SMTP_HOST: Joi.string().trim().required(),

  SMTP_PORT: Joi.number().port().required(),

  SMTP_SECURE: Joi.boolean().required(),

  SMTP_USER: Joi.string().email().required(),

  SMTP_PASSWORD: Joi.string().required(),

  SMTP_FROM: Joi.string().required(),

  FRONTEND_URL: Joi.string().uri().required(),
}).unknown(true);
