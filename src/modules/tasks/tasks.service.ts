import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../common/enums/role.enum.js';
import { TaskStatus } from '../../common/enums/task.enum.js';
import { AuthenticatedUser } from '../../common/interfaces/auth.interface.js';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface.js';
import { Task } from './entities/task.entity.js';
import { CreateTaskDto, TaskQueryDto, UpdateTaskDto } from './dto/task.dto.js';

/** Entity fields the DTO layer is allowed to set. */
type TaskChanges = Partial<
  Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'dueDate'>
>;

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
  ) {}

  /**
   * Paginated, filtered listing.
   *
   * Row-level ownership is applied in SQL (not after fetching): a non-admin
   * caller can never observe another user's tasks, and pagination totals stay
   * correct.
   */
  async findAll(
    query: TaskQueryDto,
    currentUser: AuthenticatedUser,
  ): Promise<PaginatedResult<Task>> {
    const qb = this.tasksRepository.createQueryBuilder('task');

    if (currentUser.role !== Role.ADMIN) {
      qb.andWhere('task.ownerId = :ownerId', { ownerId: currentUser.id });
    }

    if (query.status) {
      qb.andWhere('task.status = :status', { status: query.status });
    }

    if (query.priority) {
      qb.andWhere('task.priority = :priority', { priority: query.priority });
    }

    if (query.search) {
      qb.andWhere('(task.title ILIKE :search OR task.description ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const [items, total] = await qb
      .orderBy(`task.${query.sortBy}`, query.order)
      .skip(query.skip)
      .take(query.take)
      .getManyAndCount();

    return PaginatedResult.of(items, total, query.page, query.limit);
  }

  async findOneOrFail(id: string, currentUser: AuthenticatedUser): Promise<Task> {
    const task = await this.tasksRepository.findOne({ where: { id } });

    if (!task) {
      throw new NotFoundException(`Task with id "${id}" was not found`);
    }

    this.assertCanAccess(task, currentUser);

    return task;
  }

  async create(dto: CreateTaskDto, currentUser: AuthenticatedUser): Promise<Task> {
    const task = this.tasksRepository.create({
      ...this.normalize(dto),
      // The owner always comes from the verified token, never from the body.
      ownerId: currentUser.id,
    });

    return this.tasksRepository.save(task);
  }

  async update(
    id: string,
    dto: UpdateTaskDto,
    currentUser: AuthenticatedUser,
  ): Promise<Task> {
    const task = await this.findOneOrFail(id, currentUser);

    Object.assign(task, this.normalize(dto));

    // Keep the denormalised flag in sync with the status column.
    task.isCompleted = task.status === TaskStatus.DONE;

    return this.tasksRepository.save(task);
  }

  async remove(id: string, currentUser: AuthenticatedUser): Promise<void> {
    const task = await this.findOneOrFail(id, currentUser);
    await this.tasksRepository.remove(task);
  }

  /** Used by the retention cron job to hard-delete purged soft-deleted rows. */
  async purgeSoftDeletedBefore(cutoff: Date): Promise<number> {
    // `delete()` bypasses the soft-delete scope, which is exactly what we want
    // here: the rows being dropped are already soft-deleted.
    const result = await this.tasksRepository
      .createQueryBuilder()
      .delete()
      .from(Task)
      .where('deletedAt <= :cutoff', { cutoff })
      .execute();

    return result.affected ?? 0;
  }

  countByStatus(): Promise<Record<string, number>> {
    return this.tasksRepository
      .createQueryBuilder('task')
      .select('task.status', 'status')
      .addSelect('COUNT(task.id)', 'count')
      .groupBy('task.status')
      .getRawMany()
      .then((rows: Array<{ status: string; count: string }>) =>
        rows.reduce<Record<string, number>>((acc, row) => {
          acc[row.status] = Number(row.count);
          return acc;
        }, {}),
      );
  }

  private assertCanAccess(task: Task, currentUser: AuthenticatedUser): void {
    if (currentUser.role !== Role.ADMIN && task.ownerId !== currentUser.id) {
      throw new ForbiddenException('You do not have access to this task');
    }
  }

  /** Converts ISO-string dates to `Date` and blank strings to `null`. */
  private normalize(dto: CreateTaskDto | UpdateTaskDto): TaskChanges {
    const { dueDate, description, ...rest } = dto;

    return {
      ...rest,
      ...(description !== undefined
        ? { description: description?.trim() || null }
        : {}),
      ...(dueDate !== undefined
        ? { dueDate: dueDate ? new Date(dueDate) : null }
        : {}),
    };
  }
}
