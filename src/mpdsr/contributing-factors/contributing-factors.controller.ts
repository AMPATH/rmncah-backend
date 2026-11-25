import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { RequirePermissions } from '../../shared/rbac/authorization/decorators/permissions.decorator.js';
import { PermissionsGuard } from '../../shared/rbac/authorization/guards/permissions.guard.js';
import { SystemModule } from '../../shared/rbac/enum/system-module.enum.js';

import { ContributingFactorsService } from './contributing-factors.service.js';
import { ListContributingFactorsQueryDto } from './dto/list-contributing-factors-query.dto.js';

@Controller('contributing-factors')
@UseGuards(PermissionsGuard)
export class ContributingFactorsController {
  constructor(
    private readonly contributingFactorsService: ContributingFactorsService,
  ) {}

  @Get()
  @RequirePermissions(SystemModule.MPDSR, 'mpdsr.cases.read')
  findAll(@Query() query: ListContributingFactorsQueryDto) {
    return this.contributingFactorsService.findAll(query);
  }
}
