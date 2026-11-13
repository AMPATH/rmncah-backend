import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseEnumPipe,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard.js';

import { SystemModule } from '../enum/system-module.enum.js';
import { RequirePermissions } from '../authorization/decorators/permissions.decorator.js';
import { PermissionsGuard } from '../authorization/guards/permissions.guard.js';

import { PermissionsService } from './permissions.service.js';

@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RequirePermissions(SystemModule.PLATFORM, 'platform.permissions.read')
  findAll(
    @Query('module', new ParseEnumPipe(SystemModule, { optional: true }))
    module?: SystemModule,
  ) {
    return this.permissionsService.findAll(module);
  }

  @Get(':code')
  @RequirePermissions(SystemModule.PLATFORM, 'platform.permissions.read')
  async findByCode(@Param('code') code: string) {
    const permission = await this.permissionsService.findByCode(code);

    if (!permission) {
      throw new NotFoundException(`Permission with code "${code}" not found`);
    }

    return permission;
  }
}
