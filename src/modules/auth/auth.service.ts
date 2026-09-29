import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthConfig } from '../../config/configuration.js';
import {
  AuthenticatedUser,
  JwtPayload,
} from '../../common/interfaces/auth.interface.js';
import { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { LoginDto, RegisterDto } from './dto/auth.dto.js';

export interface AuthTokens {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: Pick<AuthenticatedUser, 'id' | 'email' | 'role'>;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const email = dto.email.toLowerCase();

    if (await this.usersService.findByEmailWithPassword(email)) {
      throw new ConflictException('An account with this email already exists');
    }

    const { bcryptSaltRounds } = this.authConfig();

    const user = await this.usersService.create({
      email,
      // Salt rounds are configurable; the plaintext never leaves this function.
      password: await bcrypt.hash(dto.password, bcryptSaltRounds),
    });

    this.logger.log(`Registered user ${user.id}`);

    return this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.usersService.findByEmailWithPassword(
      dto.email.toLowerCase(),
    );

    // The same message for "unknown email" and "wrong password" so this
    // endpoint cannot be used to enumerate registered accounts.
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This account has been deactivated');
    }

    return this.issueTokens(user);
  }

  /**
   * Invoked by `JwtStrategy.validate()` on every authenticated request.
   * Re-reading the user instead of trusting the token body means role changes
   * and deactivations take effect immediately, not after the token expires.
   */
  async validateUser(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Account no longer exists');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This account has been deactivated');
    }

    return { id: user.id, email: user.email, role: user.role };
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const { jwtExpiresIn } = this.authConfig();

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      tokenType: 'Bearer',
      expiresIn: jwtExpiresIn,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  private authConfig(): AuthConfig {
    return this.configService.getOrThrow<AuthConfig>('auth');
  }
}
