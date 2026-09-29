import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithoutRequest } from 'passport-jwt';
import { AuthConfig } from '../../../config/configuration.js';
import { AuthenticatedUser, JwtPayload } from '../../../common/interfaces/auth.interface.js';
import { AuthService } from '../auth.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const { jwtSecret } = configService.getOrThrow<AuthConfig>('auth');

    const options: StrategyOptionsWithoutRequest = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    };

    super(options);
  }

  /**
   * Runs after the signature and `exp` checks succeed. Anything thrown here
   * (e.g. a deactivated account) surfaces as a 401.
   */
  validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    return this.authService.validateUser(payload);
  }
}
