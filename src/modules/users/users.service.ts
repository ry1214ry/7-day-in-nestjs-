import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface.js';
import { User } from './entities/user.entity.js';
import {
  UpdateUserDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
} from './dto/user.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: email.toLowerCase() })
      .getOne();
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  create(
    partial: Pick<User, 'email' | 'password'> & Partial<User>,
  ): Promise<User> {
    return this.usersRepository.save(this.usersRepository.create(partial));
  }

  findAll(page: number, limit: number): Promise<PaginatedResult<User>> {
    return this.usersRepository
      .findAndCount({
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
      })
      .then(([items, total]) => PaginatedResult.of(items, total, page, limit));
  }

  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException(`User with id "${id}" was not found`);
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findByIdOrFail(id);
    Object.assign(user, dto);
    return this.usersRepository.save(user);
  }

  async updateRole(id: string, dto: UpdateUserRoleDto): Promise<User> {
    return this.update(id, { role: dto.role });
  }

  async updateStatus(id: string, dto: UpdateUserStatusDto): Promise<User> {
    return this.update(id, { isActive: dto.isActive });
  }

  /** Hard delete; tasks cascade via the `onDelete: 'CASCADE'` FK. */
  async remove(id: string): Promise<void> {
    const user = await this.findByIdOrFail(id);
    await this.usersRepository.remove(user);
  }
}
