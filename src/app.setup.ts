import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppConfig } from './config/configuration.js';

/**
 * Everything that must be identical between `main.ts` and the e2e suite.
 *
 * Keeping it here guarantees the tests exercise the same validation, filters and
 * response envelope that production serves — a mismatch there is the classic
 * source of "passes in CI, 500s in prod".
 */
export function configureApp(app: INestApplication): INestApplication {
  app.setGlobalPrefix('api/v1', {
    // `{*path}` is the path-to-regexp v8 syntax; the legacy `docs/(.*)` form
    // triggers LegacyRouteConverter warnings and breaks in future majors.
    exclude: ['health', 'docs', 'docs/{*path}'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      // Strip unknown properties...
      whitelist: true,
      // ...and actively reject requests that carry them, so typos in a payload
      // fail loudly instead of being silently ignored.
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  const { corsOrigins } = app.get(ConfigService).getOrThrow<AppConfig>('app');

  app.enableCors({
    // `true` reflects the request Origin, which is what `CORS_ORIGINS=*` means;
    // otherwise only the allow-listed origins are echoed back.
    origin: corsOrigins.includes('*') ? true : corsOrigins,
    credentials: true,
    maxAge: 86400,
  });

  app.enableShutdownHooks();

  return app;
}

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('lessone-7day API')
    .setDescription(
      'Modular NestJS REST API — JWT auth, RBAC and a task manager backed by PostgreSQL.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addTag('auth', 'Registration, login and session introspection')
    .addTag('tasks', 'Task CRUD')
    .addTag('users', 'Administration')
    .addTag('health', 'Liveness / readiness probes')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'lessone-7day API docs',
  });
}
