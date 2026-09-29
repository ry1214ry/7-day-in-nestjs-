import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum.js';

export const ROLES_KEY = 'roles';

/**
 * Declares the roles allowed to reach a handler.
 * Read by `RolesGuard` through the reflector.
 *
 * @example
 * ```ts
 * @Roles(Role.ADMIN)
 * @Delete(':id')
 * remove() {}
 * ```
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
