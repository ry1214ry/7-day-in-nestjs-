import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../../common/enums/role.enum.js';
import { Task } from '../../tasks/entities/task.entity.js';

@Entity('users')
export class User {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'ada@example.com' })
  @Index('idx_users_email', { unique: true })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  /**
   * `select: false` keeps the hash out of every default query, so it cannot be
   * leaked by accident; `UsersService` opts in explicitly when it needs it.
   */
  @Exclude({ toPlainOnly: true })
  @Column({ type: 'varchar', length: 120, select: false })
  password: string;

  @ApiPropertyOptional({ enum: Role, default: Role.USER })
  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

  @ApiPropertyOptional({ default: true })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiPropertyOptional({ type: () => [Task], isArray: true })
  @OneToMany(() => Task, (task) => task.owner)
  tasks: Task[];

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
