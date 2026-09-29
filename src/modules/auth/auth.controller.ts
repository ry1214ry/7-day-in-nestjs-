import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiStandardResponse } from '../../common/decorators/api-standard-response.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../../common/interfaces/auth.interface.js';
import { AuthService, AuthTokens } from './auth.service.js';
import { AuthTokensDto, UserProfileDto } from './dto/auth-response.dto.js';
import { LoginDto, RegisterDto } from './dto/auth.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new account and receive an access token' })
  @ApiCreatedResponse({ description: 'Account created; returns a signed JWT.' })
  @ApiConflictResponse({ description: 'That email is already registered.' })
  @ApiStandardResponse({
    status: 201,
    type: AuthTokensDto,
    description: 'Account created',
  })
  register(@Body() dto: RegisterDto): Promise<AuthTokens> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange credentials for an access token' })
  @ApiOkResponse({ description: 'Authenticated.' })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials, or a deactivated account.',
  })
  @ApiStandardResponse({ type: AuthTokensDto, description: 'Authenticated' })
  login(@Body() dto: LoginDto): Promise<AuthTokens> {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Return the profile bound to the current token' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token.' })
  @ApiStandardResponse({ type: UserProfileDto, description: 'Current user' })
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }
}
