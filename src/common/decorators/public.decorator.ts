import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Opts a route out of `JwtAuthGuard`.
 *
 * Useful when the guard is registered globally via `APP_GUARD`; a no-op for
 * routes that are already public because no guard is attached to them.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
