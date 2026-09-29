import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiStandardResponse } from '../../common/decorators/api-standard-response.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Role } from '../../common/enums/role.enum.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../../common/interfaces/auth.interface.js';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface.js';
import { Task } from './entities/task.entity.js';
import { CreateTaskDto, TaskQueryDto, UpdateTaskDto } from './dto/task.dto.js';
import { TasksService } from './tasks.service.js';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({
    summary: 'List tasks',
    description:
      'Non-admins only ever see their own tasks; admins see every task. Supports filtering, search and pagination.',
  })
  @ApiStandardResponse({
    type: Task,
    isArray: true,
    description: 'Paginated task list',
  })
  findAll(
    @Query() query: TaskQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedResult<Task>> {
    return this.tasksService.findAll(query, user);
  }

  @Get('stats/summary')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Task counts grouped by status (ADMIN only)' })
  @ApiStandardResponse({ description: 'Counts per status' })
  stats(): Promise<Record<string, number>> {
    return this.tasksService.countByStatus();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a task by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNotFoundResponse({ description: 'No task with that id.' })
  @ApiForbiddenResponse({ description: 'The task belongs to another user.' })
  @ApiStandardResponse({ type: Task, description: 'The task' })
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Task> {
    return this.tasksService.findOneOrFail(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a task owned by the caller' })
  @ApiCreatedResponse({ description: 'Task created.' })
  @ApiStandardResponse({ status: 201, type: Task, description: 'The created task' })
  create(
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Task> {
    return this.tasksService.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partially update a task' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiStandardResponse({ type: Task, description: 'The updated task' })
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Task> {
    return this.tasksService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a task' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Task soft-deleted.' })
  remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.tasksService.remove(id, user);
  }
}
