import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp, setupSwagger } from './app.setup.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    // Buffer logs until the DI graph is ready, so module-resolution errors are
    // not interleaved with half-initialised startup logs.
    bufferLogs: true,
  });

  configureApp(app);

  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction || process.env.SWAGGER_ENABLED === 'true') {
    setupSwagger(app);
  }

  // `Logger` is not a DI provider, so it must be instantiated directly —
  // `app.get(Logger)` throws UnknownElementException. Passing a live instance
  // also flushes everything buffered while the DI graph was being built.
  app.useLogger(new Logger());

  const port = Number(process.env.PORT ?? 4000);

  // 0.0.0.0 so the container is reachable outside its network namespace.
  await app.listen(port, '0.0.0.0');

  Logger.log(`Listening on http://localhost:${port}/api/v1`, 'Bootstrap');
}

void bootstrap();
