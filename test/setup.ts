// Test-wide environment so `ConfigModule` passes its validation schema during
// the e2e boot (JWT_SECRET is required with a minimum length) without forcing
// contributors to keep a real `.env` file around.
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.JWT_SECRET ??= 'test-only-secret-that-is-at-least-32-chars!';