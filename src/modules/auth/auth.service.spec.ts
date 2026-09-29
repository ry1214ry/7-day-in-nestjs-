import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { Role } from '../../common/enums/role.enum.js';
import { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let authService: AuthService;

  const usersService = {
    findByEmailWithPassword: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };

  const jwtService = {
    signAsync: jest.fn(),
  };

  const configService = {
    getOrThrow: jest.fn().mockReturnValue({
      jwtSecret: 'unit-test-secret',
      jwtExpiresIn: '15m',
      bcryptSaltRounds: 4,
    }),
  };

  const user: User = {
    id: '9b0e2c2e-0000-4000-8000-000000000001',
    email: 'ada@example.com',
    password: 'hashed-password',
    role: Role.USER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    authService = module.get(AuthService);
  });

  describe('register', () => {
    it('rejects a duplicate email with a 409', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(user);

      await expect(
        authService.register({
          email: 'Ada@Example.com',
          password: 'Str0ng-Pass!',
        }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('hashes the password, persists the user and issues a token', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);
      usersService.create.mockResolvedValue(user);
      jwtService.signAsync.mockResolvedValue('signed.jwt.token');

      const tokens = await authService.register({
        email: 'ADA@example.com',
        password: 'Str0ng-Pass!',
      });

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'ada@example.com',
        }),
      );

      const createdPassword = (
        usersService.create.mock.calls[0][0] as Partial<User>
      ).password;
      expect(createdPassword).toBeDefined();
      expect(createdPassword).not.toBe('Str0ng-Pass!');
      await expect(bcrypt.compare('Str0ng-Pass!', createdPassword!)).resolves.toBe(
        true,
      );

      expect(tokens).toMatchObject({
        accessToken: 'signed.jwt.token',
        tokenType: 'Bearer',
        expiresIn: '15m',
        user: { id: user.id, email: 'ada@example.com', role: Role.USER },
      });
    });
  });

  describe('login', () => {
    it('returns a generic 401 for an unknown email', async () => {
      usersService.findByEmailWithPassword.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'nobody@example.com', password: 'whatever' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('returns a generic 401 for a wrong password', async () => {
      const existing = { ...user, password: await bcrypt.hash('RightPa$$123', 4) };
      usersService.findByEmailWithPassword.mockResolvedValue(existing);

      await expect(
        authService.login({ email: 'ada@example.com', password: 'WrongPa$$456' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('issues a token for valid credentials', async () => {
      const existing = { ...user, password: await bcrypt.hash('RightPa$$123', 4) };
      usersService.findByEmailWithPassword.mockResolvedValue(existing);
      jwtService.signAsync.mockResolvedValue('signed.jwt.token');

      const tokens = await authService.login({
        email: 'ada@example.com',
        password: 'RightPa$$123',
      });

      expect(tokens.accessToken).toBe('signed.jwt.token');
      expect(tokens.user.role).toBe(Role.USER);
    });
  });
});