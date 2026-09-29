import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { TasksService } from '../modules/tasks/tasks.service.js';

const JOB_NAME = 'task-retention';

@Injectable()
export class TaskRetentionService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(TaskRetentionService.name);

  constructor(
    private readonly tasksService: TasksService,
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onApplicationBootstrap(): void {
    const expression = this.configService.get<string>(
      'TASK_CLEANUP_CRON',
      '0 3 * * *',
    );

    const job = new CronJob(expression, () => void this.purgeExpired());

    this.schedulerRegistry.addCronJob(JOB_NAME, job);
    job.start();

    this.logger.log(`Soft-delete retention job scheduled with "${expression}"`);
  }

  onApplicationShutdown(): void {
    this.schedulerRegistry.deleteCronJob(JOB_NAME);
  }

  /** Public so it can be triggered manually and asserted in unit tests. */
  async purgeExpired(now: Date = new Date()): Promise<number> {
    const retentionDays = this.configService.get<number>(
      'TASK_RETENTION_DAYS',
      30,
    );
    const cutoff = new Date(
      now.getTime() - retentionDays * 24 * 60 * 60 * 1000,
    );

    try {
      const purged = await this.tasksService.purgeSoftDeletedBefore(cutoff);
      this.logger.log(
        `Purged ${purged} task(s) soft-deleted before ${cutoff.toISOString()}`,
      );
      return purged;
    } catch (error) {
      // A failing job must never take the API process down.
      this.logger.error(
        `Retention purge failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return 0;
    }
  }
}
