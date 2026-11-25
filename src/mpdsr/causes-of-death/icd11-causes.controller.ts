import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { RequirePermissions } from '../../shared/rbac/authorization/decorators/permissions.decorator.js';
import { PermissionsGuard } from '../../shared/rbac/authorization/guards/permissions.guard.js';
import { SystemModule } from '../../shared/rbac/enum/system-module.enum.js';

import { Icd11CausesService } from './icd11-causes.service.js';
import { ListIcd11CausesQueryDto } from './dto/list-icd11-causes-query.dto.js';

@Controller('icd11-causes')
@UseGuards(PermissionsGuard)
export class Icd11CausesController {
  constructor(
    private readonly icd11CausesService: Icd11CausesService,
  ) {}

  @Get()
  @RequirePermissions(SystemModule.MPDSR, 'mpdsr.cases.read')
  findAll(@Query() query: ListIcd11CausesQueryDto) {
    return this.icd11CausesService.findAll(query);
  }
}
