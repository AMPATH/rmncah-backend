import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

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

import { RolesService } from './roles.service.js';

@Controller('roles')
@ApiTags('RBAC - Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @ApiOperation({ summary: 'Retrieve all roles, optionally filtered by module' })
  @Get()
  @RequirePermissions(SystemModule.PLATFORM, 'platform.roles.read')
  findAll(
    @Query('module', new ParseEnumPipe(SystemModule, { optional: true }))
    module?: SystemModule,
  ) {
    return this.rolesService.findAll(module);
  }

  @ApiOperation({ summary: 'Retrieve a role by its code' })
  @Get(':code')
  @RequirePermissions(SystemModule.PLATFORM, 'platform.roles.read')
  async findByCode(@Param('code') code: string) {
    const role = await this.rolesService.findByCode(code);

    if (!role) {
      throw new NotFoundException(`Role with code "${code}" not found`);
    }

    return role;
  }
}
