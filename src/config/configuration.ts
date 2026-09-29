import { registerAs } from '@nestjs/config';

/**
 * Namespaced, immutable configuration built from `process.env`.
 *
 * `registerAs` gives every slice a typed shape, so `ConfigService.get('database.port')`
 * is a compile-time-checked lookup instead of a magic string. Everything is parsed
 * exactly once at boot; nothing else in the app should touch `process.env`.
 */
export interface AppConfig {
  nodeEnv: string;
  port: number;
  globalPrefix: string;
  corsOrigins: string[];
  swaggerEnabled: boolean;
  isProduction: boolean;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
  synchronize: boolean;
  logging: boolean;
  poolSize: number;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptSaltRounds: number;
}

export const appConfig = registerAs('app', (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  globalPrefix: process.env.API_PREFIX ?? 'api/v1',
  corsOrigins: (process.env.CORS_ORIGINS ?? '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  swaggerEnabled: process.env.SWAGGER_ENABLED === 'true',
  isProduction: process.env.NODE_ENV === 'production',
}));

export const databaseConfig = registerAs('database', (): DatabaseConfig => ({
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'lessone7day',
  ssl: process.env.DB_SSL === 'true',
  // Never enable `synchronize` in production: use migrations instead.
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'true',
  poolSize: parseInt(process.env.DB_POOL_SIZE ?? '10', 10),
}));

export const authConfig = registerAs('auth', (): AuthConfig => ({
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '10', 10),
}));

export type AppConfiguration = {
  app: AppConfig;
  database: DatabaseConfig;
  auth: AuthConfig;
};

/** Barrel consumed by `ConfigModule.forRoot({ load: [configuration] })`. */
export const configuration = (): AppConfiguration => ({
  app: appConfig(),
  database: databaseConfig(),
  auth: authConfig(),
});
