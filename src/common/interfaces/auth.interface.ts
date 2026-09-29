import { Role } from '../enums/role.enum.js';

/** Claims embedded in the signed access token. */
export interface JwtPayload {
  /** `sub` — the user id. */
  sub: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

/** Shape attached to `request.user` after JwtStrategy validation. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}
