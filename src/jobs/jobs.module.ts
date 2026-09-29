import { Module } from '@nestjs/common';
import { TasksModule } from '../modules/tasks/tasks.module.js';
import { TaskRetentionService } from './task-retention.service.js';

@Module({
  imports: [TasksModule],
  providers: [TaskRetentionService],
})
export class JobsModule {}
