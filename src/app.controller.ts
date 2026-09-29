import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiStandardResponse } from './common/decorators/api-standard-response.decorator.js';
import { RawResponse } from './common/decorators/raw-response.decorator.js';
import { AppService } from './app.service.js';

@ApiTags('health')
@Controller('health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @RawResponse()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Liveness probe',
    description:
      'Excluded from the /api/v1 prefix so orchestrators can probe it without knowing the API version.',
  })
  @ApiOkResponse({ schema: { type: 'object', properties: { status: { type: 'string' } } } })
  getHealth(): { status: string; uptime: number; timestamp: string } {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('info')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Service metadata' })
  @ApiStandardResponse({ description: 'Service metadata' })
  getInfo(): { name: string; version: string } {
    return { name: this.appService.getHello(), version: '1.0.0' };
  }
}
