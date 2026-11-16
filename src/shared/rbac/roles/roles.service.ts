import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Role } from './entities/role.entity.js';
import { SystemModule } from '../enum/system-module.enum.js';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  findAll(module?: SystemModule): Promise<Role[]> {
    return this.roleRepository.find({
      where: module ? { module, isActive: true } : { isActive: true },
      relations: {
        permissions: {
          permission: true,
        },
      },
      order: {
        module: 'ASC',
        name: 'ASC',
      },
    });
  }

  findByCode(code: string): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: {
        code,
        isActive: true,
      },
      relations: {
        permissions: {
          permission: true,
        },
      },
    });
  }
}
