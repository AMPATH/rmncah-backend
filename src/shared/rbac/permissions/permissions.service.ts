import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Permission } from './entities/permission.entity.js';
import { SystemModule } from '../enum/system-module.enum.js';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  findAll(module?: SystemModule): Promise<Permission[]> {
    return this.permissionRepository.find({
      where: module ? { module } : {},
      order: {
        module: 'ASC',
        code: 'ASC',
      },
    });
  }

  findByCode(code: string): Promise<Permission | null> {
    return this.permissionRepository.findOne({
      where: { code },
    });
  }
}
