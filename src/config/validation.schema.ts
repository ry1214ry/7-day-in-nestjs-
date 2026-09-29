import Joi from 'joi';

/**
 * Fail-fast schema for `process.env`.
 *
 * The app refuses to boot when a required variable is missing or malformed,
 * which turns "mystery 500 at 3am" into a crash at deploy time.
 */
export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),

  PORT: Joi.number().port().default(3000),
  API_PREFIX: Joi.string().default('api/v1'),
  CORS_ORIGINS: Joi.string().default('*'),
  SWAGGER_ENABLED: Joi.boolean().default(true),

  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().port().default(5432),
  DB_USERNAME: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().allow('').default('postgres'),
  DB_NAME: Joi.string().default('lessone7day'),
  DB_SSL: Joi.boolean().default(false),
  DB_SYNCHRONIZE: Joi.boolean().default(false),
  DB_LOGGING: Joi.boolean().default(false),
  DB_POOL_SIZE: Joi.number().integer().min(1).default(10),

  JWT_SECRET: Joi.string().min(32).required().messages({
    'string.min':
      'JWT_SECRET must be at least 32 characters long — generate one with `openssl rand -hex 32`',
  }),
  JWT_EXPIRES_IN: Joi.string().default('1h'),
  BCRYPT_SALT_ROUNDS: Joi.number().integer().min(4).max(15).default(10),

  TASK_RETENTION_DAYS: Joi.number().integer().min(1).default(30),
  TASK_CLEANUP_CRON: Joi.string().default('0 3 * * *'),
});
