import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DatabaseConfig } from './configuration.js';

export const typeOrmConfigFactory = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const db = configService.getOrThrow<DatabaseConfig>('database');

  return {
    type: 'postgres',
    host: db.host,
    port: db.port,
    username: db.username,
    password: db.password,
    database: db.database,
    ssl: db.ssl ? { rejectUnauthorized: false } : false,

    autoLoadEntities: true,
    synchronize: db.synchronize,
    logging: db.logging,
    retryAttempts: 10,
    retryDelay: 3000,
    extra: {
      max: db.poolSize,
      application_name: 'lessone-7day-api',
    },
  };
};
