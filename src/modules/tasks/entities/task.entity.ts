import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TaskPriority, TaskStatus } from '../../../common/enums/task.enum.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('tasks')
@Index('idx_tasks_owner_status', ['ownerId', 'status'])
export class Task {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Ship the release notes' })
  @Column({ type: 'varchar', length: 200 })
  title: string;

  @ApiPropertyOptional({ example: 'Draft the changelog for v1.0.0', nullable: true })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.TODO })
  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.TODO })
  status: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.MEDIUM })
  priority: TaskPriority;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  dueDate: Date | null;

  @ApiPropertyOptional({ default: false })
  @Column({ type: 'boolean', default: false })
  isCompleted: boolean;

  /** Explicit FK column: the owning side of the relation. */
  @ApiProperty({ format: 'uuid' })
  @Column({ type: 'uuid' })
  ownerId: string;

  @ApiPropertyOptional({ type: () => User })
  @ManyToOne(() => User, (user) => user.tasks, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  /** Soft delete: rows are hidden from queries but retained for auditing. */
  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
