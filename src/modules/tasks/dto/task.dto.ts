import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';
import { TaskPriority, TaskStatus } from '../../../common/enums/task.enum.js';

export class CreateTaskDto {
  @ApiProperty({ example: 'Ship the release notes' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    example: 'Draft the changelog for v1.0.0',
    nullable: true,
    description: 'Trimmed automatically; blank strings become null.',
  })
  @IsString()
  @MaxLength(4000)
  @IsOptional()
  description?: string | null;

  @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.TODO })
  @IsEnum(TaskStatus, {
    message: `status must be one of the following values: ${Object.values(TaskStatus).join(', ')}`,
  })
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  @IsEnum(TaskPriority, {
    message: `priority must be one of the following values: ${Object.values(TaskPriority).join(', ')}`,
  })
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({ example: '2026-10-01T09:00:00.000Z', format: 'date-time' })
  @IsDateString({}, { message: 'dueDate must be a valid ISO-8601 date string' })
  @IsOptional()
  dueDate?: string | null;
}

export class UpdateTaskDto extends PartialType(CreateTaskDto) {}

export class TaskQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({ description: 'Free-text match against title/description' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: ['createdAt', 'dueDate', 'priority'], default: 'createdAt' })
  @IsString()
  @IsOptional()
  sortBy: 'createdAt' | 'dueDate' | 'priority' = 'createdAt';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
  @Type(() => String)
  @IsString()
  @IsOptional()
  order: 'ASC' | 'DESC' = 'DESC';
}
